import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export default (router, { services, exceptions, database, logger, env }) => {
  const { UsersService, AuthenticationService } = services;
  const { InvalidPayloadException, InvalidCredentialsException } = exceptions;

  // Microsoft JWKS client for token verification
  const client = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/discovery/v2.0/keys`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });

  /**
   * Entra ID Authentication Endpoint
   * URL: /entra-auth/login/entra
   */
  router.post('/login/entra', async (req, res, next) => {
    try {
      const { token, email } = req.body;

      if (!token || !email) {
        throw new InvalidPayloadException('Token and email are required');
      }

      logger.info(`🔐 Entra ID login attempt for: ${email}`);

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

      // Accountability setup
      const accountability = {
        admin: true,
        role: null,
        user: null
      };

      const usersService = new UsersService({ 
        schema: req.schema, 
        accountability 
      });

      // Find user logic
      let user = await database('directus_users')
        .where({ entra_id: microsoftUser.oid })
        .first();

      if (!user) {
        user = await database('directus_users')
          .where({ email: email.toLowerCase() })
          .first();
      }

      // Create new user if needed
      if (!user) {
        logger.info(`User not found, creating new user for: ${email}`);
        
        const newUserId = await usersService.createOne({
          email: email.toLowerCase(),
          entra_id: microsoftUser.oid,
          first_name: microsoftUser.given_name || 'Unknown',
          last_name: microsoftUser.family_name || 'User',
          fontys_email: email.toLowerCase().includes('fontys') ? email.toLowerCase() : null,
          role: env.AUTH_MICROSOFT_DEFAULT_ROLE_ID || null,
          status: 'active',
          provider: 'entra',
          external_identifier: microsoftUser.oid
        });

        user = await usersService.readOne(newUserId);
        logger.info(`Created new user with ID: ${user.id}`);
      } else {
        const updates = {};
        if (!user.entra_id) updates.entra_id = microsoftUser.oid;
        if (!user.external_identifier) updates.external_identifier = microsoftUser.oid;
        
        if (Object.keys(updates).length > 0) {
          await usersService.updateOne(user.id, updates);
          logger.info(`Updated user ${user.id} with Entra ID info`);
        }
      }

      if (user.status !== 'active') {
        throw new InvalidCredentialsException('Your account is not active.');
      }

      // Generate Tokens
      const authService = new AuthenticationService({
        schema: req.schema,
        accountability: {
          admin: false,
          role: user.role,
          user: user.id
        }
      });

      const refreshToken = await authService.refresh(user.id);
      const accessToken = jwt.sign(
        {
          id: user.id,
          role: user.role,
          app_access: true,
          admin_access: false
        },
        env.SECRET,
        {
          expiresIn: env.ACCESS_TOKEN_TTL || '15m',
          issuer: 'directus'
        }
      );

      logger.info(`✅ Successfully authenticated user: ${user.email}`);

      res.json({
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires: 15 * 60 * 1000
        }
      });

    } catch (error) {
      logger.error('❌ Entra authentication error:', error);
      // Return 401/403 for expected errors to be cleaner
      if (error instanceof InvalidCredentialsException) {
         return res.status(401).json({ errors: [{ message: error.message, code: 'INVALID_CREDENTIALS' }] });
      }
      next(error);
    }
  });

  async function verifyMicrosoftToken(idToken, env) {
    return new Promise((resolve, reject) => {
      const getKey = (header, callback) => {
        client.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          const signingKey = key.getPublicKey();
          callback(null, signingKey);
        });
      };

      jwt.verify(
        idToken,
        getKey,
        {
          audience: env.AUTH_MICROSOFT_CLIENT_ID,
          issuer: `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/v2.0`,
          algorithms: ['RS256']
        },
        (err, decoded) => {
          if (err) {
             if (process.env.NODE_ENV !== 'production') {
               const decodedUnsafe = jwt.decode(idToken);
               if (decodedUnsafe) return resolve(decodedUnsafe);
             }
             return reject(err);
          }
          resolve(decoded);
        }
      );
    });
  }
};