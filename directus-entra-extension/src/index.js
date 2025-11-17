export default function (router, { services, exceptions, database, logger }) {
  const { ItemsService, UsersService } = services;
  const { ServiceUnavailableException } = exceptions;

  router.post('/auth/login/entra', async (req, res) => {
    try {
      const { token, email } = req.body;

      if (!token || !email) {
        logger.error('Missing token or email in request');
        return res.status(400).json({ 
          error: 'Missing required fields: token and email' 
        });
      }

      logger.info('🔐 Entra ID login attempt for:', email);

      // Verify Microsoft token
      const microsoftUser = await verifyMicrosoftToken(token);
      logger.info('✅ Microsoft token verified for:', microsoftUser.email);

      // Check if user exists
      const usersService = new UsersService({ schema: req.schema, accountability: req.accountability });
      
      let user = null;
      
      // Try to find user by entra_id first
      if (microsoftUser.oid) {
        const usersByEntraId = await database('directus_users')
          .where('entra_id', microsoftUser.oid)
          .first();
        
        if (usersByEntraId) {
          user = usersByEntraId;
          logger.info('✅ Found user by entra_id:', user.id);
        }
      }
      
      // If not found by entra_id, try by email
      if (!user) {
        const usersByEmail = await database('directus_users')
          .where('email', email.toLowerCase())
          .first();
        
        if (usersByEmail) {
          user = usersByEmail;
          logger.info('✅ Found user by email:', user.id);
        }
      }

      const isFontysMember = email.toLowerCase().endsWith('@student.fontys.nl') || 
                            email.toLowerCase().endsWith('@fontys.nl');
      
      if (!user) {
        // Create new user
        logger.info('📝 Creating new user for:', email);
        
        const newUser = {
          email: email.toLowerCase(),
          first_name: microsoftUser.given_name || '',
          last_name: microsoftUser.family_name || '',
          entra_id: microsoftUser.oid,
          fontys_email: isFontysMember ? email.toLowerCase() : null,
          status: 'active',
          role: process.env.DEFAULT_USER_ROLE_ID || null,
          password: Math.random().toString(36).substring(2, 15), // Random password (won't be used)
        };

        user = await usersService.createOne(newUser);
        logger.info('✅ User created:', user.id);
      } else {
        // Update existing user with Entra ID and sync data from Microsoft
        logger.info('🔄 Updating existing user:', user.id);
        
        const updates = {};
        
        // Always update entra_id if not set
        if (!user.entra_id && microsoftUser.oid) {
          updates.entra_id = microsoftUser.oid;
        }
        
        // Update fontys_email if user is a Fontys member
        if (isFontysMember && !user.fontys_email) {
          updates.fontys_email = email.toLowerCase();
        }

        // Sync name from Microsoft if it changed
        if (microsoftUser.given_name && user.first_name !== microsoftUser.given_name) {
          updates.first_name = microsoftUser.given_name;
        }
        if (microsoftUser.family_name && user.last_name !== microsoftUser.family_name) {
          updates.last_name = microsoftUser.family_name;
        }
        
        // Sync email if it changed
        if (email.toLowerCase() !== user.email) {
          updates.email = email.toLowerCase();
        }

        if (Object.keys(updates).length > 0) {
          await usersService.updateOne(user.id, updates);
          logger.info('✅ User updated with:', updates);
        }
      }

      // Generate Directus access token
      logger.info('🎫 Generating Directus tokens for user:', user.id);
      const authService = new services.AuthenticationService({ schema: req.schema });
      const { accessToken, refreshToken } = await authService.login('', {
        session: true,
        user: user.id,
      }, {
        session: true,
      });

      // Fetch full user details
      const fullUser = await usersService.readOne(user.id, {
        fields: ['id', 'email', 'first_name', 'last_name', 'entra_id', 'fontys_email', 'phone_number', 'avatar']
      });

      // Add is_member flag based on entra_id or fontys_email presence
      const userData = {
        ...fullUser,
        is_member: !!(fullUser.entra_id || fullUser.fontys_email),
      };

      logger.info('✅ Login successful for:', email);
      
      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: userData,
      });

    } catch (error) {
      logger.error('❌ Entra ID login error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed',
        details: error.message 
      });
    }
  });

  // Verify Microsoft JWT token
  async function verifyMicrosoftToken(token) {
    const jwt = require('jsonwebtoken');
    const jwksClient = require('jwks-rsa');

    try {
      // Decode without verification first to get the header
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error('Invalid token format');
      }

      // Get the tenant ID from the decoded token
      const tenantId = decoded.payload.tid || 'common';
      
      // Create JWKS client
      const client = jwksClient({
        jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
        cache: true,
        rateLimit: true,
      });

      // Get the signing key
      const key = await client.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      // Verify the token
      const verified = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        // Don't verify audience or issuer for now - can be added if needed
      });

      return verified;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid Microsoft token: ' + error.message);
    }
  }
}
