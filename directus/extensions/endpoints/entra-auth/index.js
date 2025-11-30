const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

export default {
  id: 'entra-auth',
  handler: (router, { services, exceptions, database, logger, env }) => {
    const { UsersService, AuthenticationService } = services;
    const { InvalidPayloadException, InvalidCredentialsException, ServiceUnavailableException } = exceptions;

    // Microsoft JWKS client for token verification
    const client = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID || 'common'}/discovery/v2.0/keys`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });

    /**
     * Entra ID Authentication Endpoint
     * POST /auth/login/entra
     * Body: { token: string, email: string }
     */
    router.post('/login/entra', async (req, res, next) => {
      try {
        const { token, email } = req.body;

        // Validate request payload
        if (!token || !email) {
          throw new InvalidPayloadException('Token and email are required');
        }

        logger.info(`Entra ID login attempt for: ${email}`);

        // Verify Microsoft token
        let microsoftUser;
        try {
          microsoftUser = await verifyMicrosoftToken(token, env);
        } catch (error) {
          logger.error('Token verification failed:', error);
          throw new InvalidCredentialsException('Invalid or expired Microsoft token');
        }

        // Validate email matches token
        const tokenEmail = microsoftUser.email || microsoftUser.preferred_username;
        if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
          logger.warn(`Email mismatch: token=${tokenEmail}, requested=${email}`);
          throw new InvalidCredentialsException('Email does not match Microsoft account');
        }

        // Find or create user in Directus
        const accountability = {
          admin: true, // Temporary admin access for user operations
          role: null,
          user: null
        };

        const usersService = new UsersService({ 
          schema: req.schema, 
          accountability 
        });

        // Try to find user by entra_id first
        let user = await database('directus_users')
          .where({ entra_id: microsoftUser.oid })
          .first();

        // If not found by entra_id, try by email
        if (!user) {
          user = await database('directus_users')
            .where({ email: email.toLowerCase() })
            .first();
        }

        // If user doesn't exist, create a new user automatically
        if (!user) {
          logger.info(`User not found, creating new user for: ${email}`);
          
          // Create new Directus user from Microsoft account info
          const newUser = await usersService.createOne({
            email: email.toLowerCase(),
            entra_id: microsoftUser.oid,
            first_name: microsoftUser.given_name || 'Unknown',
            last_name: microsoftUser.family_name || 'User',
            fontys_email: email.toLowerCase(),
            role: env.DEFAULT_USER_ROLE_ID || null,
            status: 'active',
            provider: 'entra',
            external_identifier: microsoftUser.oid
          });

          // Fetch the created user
          user = await database('directus_users')
            .where({ id: newUser })
            .first();

          logger.info(`Created new user with ID: ${user.id}`);
        } else {
          // Update user's entra_id and fontys_email if not set
          const updates = {};
          if (!user.entra_id) {
            updates.entra_id = microsoftUser.oid;
          }
          if (!user.fontys_email) {
            updates.fontys_email = email.toLowerCase();
          }
          if (!user.external_identifier) {
            updates.external_identifier = microsoftUser.oid;
          }

          if (Object.keys(updates).length > 0) {
            await usersService.updateOne(user.id, updates);
            logger.info(`Updated user ${user.id} with Entra ID info`);
          }
        }

        // Check if user is active
        if (user.status !== 'active') {
          throw new InvalidCredentialsException('Your account is not active. Please contact an administrator.');
        }

        // Create authentication session using DirectusTokens
        // We need to generate tokens manually since we're using SSO
        const authService = new AuthenticationService({
          schema: req.schema,
          accountability: {
            admin: false,
            role: user.role,
            user: user.id
          }
        });

        // Generate refresh token
        const refreshToken = await authService.refresh(user.id);
        
        // Generate access token
        const accessToken = jwt.sign(
          {
            id: user.id,
            role: user.role,
            app_access: true,
            admin_access: false
          },
          env.SECRET || 'directus-secret',
          {
            expiresIn: env.ACCESS_TOKEN_TTL || '15m',
            issuer: 'directus'
          }
        );

        const expiresIn = 15 * 60 * 1000; // 15 minutes in milliseconds

        logger.info(`Successfully authenticated user: ${user.email}`);

        // Return authentication tokens
        res.json({
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires: expiresIn
          }
        });

      } catch (error) {
        logger.error('Entra authentication error:', {
          message: error.message,
          stack: error.stack
        });
        next(error);
      }
    });

    /**
     * Helper function to verify Microsoft ID token
     */
    async function verifyMicrosoftToken(idToken, env) {
      return new Promise((resolve, reject) => {
        // Get signing key from Microsoft JWKS
        const getKey = (header, callback) => {
          client.getSigningKey(header.kid, (err, key) => {
            if (err) {
              return callback(err);
            }
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
          });
        };

        // Verify token signature and claims
        jwt.verify(
          idToken,
          getKey,
          {
            audience: env.MICROSOFT_CLIENT_ID,
            issuer: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID || 'common'}/v2.0`,
            algorithms: ['RS256']
          },
          (err, decoded) => {
            if (err) {
              // If full verification fails, try basic decode for development
              if (env.NODE_ENV === 'development') {
                logger.warn('Token verification failed, using decode for development:', err.message);
                const decoded = jwt.decode(idToken);
                if (decoded) {
                  return resolve(decoded);
                }
              }
              return reject(err);
            }

            // Token is valid, return decoded payload
            resolve(decoded);
          }
        );
      });
    }
  }
};
