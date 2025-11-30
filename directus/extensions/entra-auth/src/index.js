export default function (router, { services, exceptions, database, logger }) {
  const { ItemsService, UsersService } = services;
  const { ServiceUnavailableException } = exceptions;

  router.post('/auth/login/entra', async (req, res) => {
    try {
      // Read and parse the request body
      let body = req.body;
      
      // If body is a string, parse it
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          logger.error('Failed to parse request body:', e);
        }
      }

      const { token, email } = body || {};

      if (!token || !email) {
        logger.error('Missing token or email in Entra ID login request');
        return res.status(400).json({ 
          error: 'Missing required fields: token and email',
          received: { hasToken: !!token, hasEmail: !!email }
        });
      }

      logger.info('🔐 Entra ID login attempt for: ' + email);

      // Verify Microsoft token
      const microsoftUser = await verifyMicrosoftToken(token);
      logger.info('✅ Microsoft token verified for: ' + microsoftUser.email);

      // Check if user exists
      // Use accountability: null to bypass permissions (we're authenticating, so no user exists yet)
      const usersService = new UsersService({ schema: req.schema, accountability: null });
      
      let user = null;
      
      // Try to find user by entra_id first
      if (microsoftUser.oid) {
        const usersByEntraId = await database('directus_users')
          .where('entra_id', microsoftUser.oid)
          .first();
        
        if (usersByEntraId) {
          user = usersByEntraId;
          logger.info('✅ Found user by entra_id: ' + user.id);
        }
      }
      
      // If not found by entra_id, try by email
      if (!user) {
        const usersByEmail = await database('directus_users')
          .where('email', email.toLowerCase())
          .first();
        
        if (usersByEmail) {
          user = usersByEmail;
          logger.info('✅ Found user by email: ' + user.id);
        }
      }

      const isFontysMember = email.toLowerCase().endsWith('@student.fontys.nl') || 
                            email.toLowerCase().endsWith('@fontys.nl');
      
      if (!user) {
        // Create new user
        logger.info('📝 Creating new user for: ' + email);
        
        const defaultRoleId = process.env.DEFAULT_USER_ROLE_ID || null;
        logger.info('🎭 Default role ID from environment: ' + (defaultRoleId || 'NOT SET (will be null)'));
        
        const newUser = {
          email: email.toLowerCase(),
          first_name: microsoftUser.given_name || '',
          last_name: microsoftUser.family_name || '',
          entra_id: microsoftUser.oid,
          fontys_email: isFontysMember ? email.toLowerCase() : null,
          status: 'active',
          role: defaultRoleId,
          password: Math.random().toString(36).substring(2, 15), // Random password (won't be used)
        };

        user = await usersService.createOne(newUser);
        logger.info('✅ User created with ID: ' + user.id + ' and role: ' + (user.role || 'null'));
      } else {
        // Update existing user with Entra ID and sync data from Microsoft
        logger.info('🔄 Updating existing user: ' + user.id + ' with role: ' + (user.role || 'null'));
        
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
          logger.info('✅ User updated with: ' + JSON.stringify(updates));
        }
      }

      // Generate Directus access token
      logger.info('🎫 Generating Directus tokens for user: ' + user.id);
      
      // Generate a random token for the session (UUID-like)
      const crypto = await import('crypto');
      const refreshToken = crypto.default.randomBytes(32).toString('hex');
      
      // Create a session for the user in the database
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const sessionData = {
        token: refreshToken,
        user: user.id,
        expires: sessionExpiry,
        ip: req.ip,
        user_agent: req.get('user-agent'),
      };
      
      await database('directus_sessions').insert(sessionData);
      
      // Generate access token
      const jwt = await import('jsonwebtoken');
      const SECRET = process.env.SECRET || process.env.KEY;
      const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
      
      if (!SECRET) {
        throw new Error('SECRET or KEY environment variable must be set in Directus configuration');
      }
      
      // Fetch the role to check if it's admin
      const userRole = await database('directus_roles')
        .where('id', user.role)
        .first();
      
      const isAdmin = userRole?.admin_access === true || userRole?.name === 'Administrator';
      
      logger.info('🎭 User role details: ' + JSON.stringify({ 
        roleId: user.role, 
        roleName: userRole?.name, 
        isAdmin: isAdmin 
      }));
      
      const accessTokenPayload = {
        id: user.id,
        role: user.role,
        app_access: true,
        admin_access: isAdmin,
      };
      
      const accessToken = jwt.default.sign(accessTokenPayload, SECRET, {
        expiresIn: ACCESS_TOKEN_TTL,
        issuer: 'directus',
      });
      
      const expires = Date.now() + 15 * 60 * 1000; // 15 minutes from now

      // Fetch full user details
      const fullUser = await usersService.readOne(user.id, {
        fields: ['id', 'email', 'first_name', 'last_name', 'entra_id', 'fontys_email', 'phone_number', 'avatar']
      });

      // Add is_member flag based on entra_id or fontys_email presence
      const userData = {
        ...fullUser,
        is_member: !!(fullUser.entra_id || fullUser.fontys_email),
      };

      logger.info('✅ Login successful for: ' + email);
      
      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires: expires,
        user: userData,
      });

    } catch (error) {
      logger.error('❌ Entra ID login error: ' + (error.message || 'Unknown error'));
      logger.error('Error stack: ' + (error.stack || 'No stack trace'));
      logger.error('Error type: ' + (error.constructor.name || 'Unknown'));
      return res.status(500).json({ 
        error: 'Authentication failed',
        details: error.message 
      });
    }
  });

  // Verify Microsoft JWT token
  async function verifyMicrosoftToken(token) {
    // Dynamic imports for ES modules
    const jwt = await import('jsonwebtoken');
    const jwksRsa = await import('jwks-rsa');
    const jwksClient = jwksRsa.default;

    try {
      // Decode without verification first to get the header
      const decoded = jwt.default.decode(token, { complete: true });
      
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
      const verified = jwt.default.verify(token, signingKey, {
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
