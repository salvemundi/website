import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export default (router, { services, exceptions, database, logger, env }) => {
  const { UsersService, AuthenticationService } = services;
  const { InvalidPayloadException, InvalidCredentialsException } = exceptions;

  const client = jwksClient({
    jwksUri: `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/discovery/v2.0/keys`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });

  router.post('/login/entra', async (req, res, next) => {
    try {
      const { token, email } = req.body;

      if (!token || !email) {
        throw new InvalidPayloadException('Token and email are required');
      }

      logger.info(`Entra ID login attempt for: ${email}`);

      // Verify Microsoft Token
      let microsoftUser;
      try {
        microsoftUser = await verifyMicrosoftToken(token, env);
      } catch (error) {
        logger.error('Token verification failed:', error);
        throw new InvalidCredentialsException('Invalid or expired Microsoft token');
      }

      // Email Validation
      const tokenEmail = microsoftUser.email || microsoftUser.preferred_username;
      if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
        throw new InvalidCredentialsException('Email does not match Microsoft account');
      }

      // Directus User Lookup & Sync
      const accountability = { admin: true, role: null, user: null };
      const usersService = new UsersService({ schema: req.schema, accountability });

      let user = await database('directus_users')
        .where({ entra_id: microsoftUser.oid })
        .first();

      if (!user) {
        user = await database('directus_users')
          .where({ email: email.toLowerCase() })
          .first();
      }

      if (!user) {
        // Create new user
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
        logger.info(`Created new user: ${user.id}`);
      } else {
        // Sync user data
        const updates = {};
        if (!user.entra_id) updates.entra_id = microsoftUser.oid;
        if (!user.external_identifier) updates.external_identifier = microsoftUser.oid;
        
        if (Object.keys(updates).length > 0) {
          await usersService.updateOne(user.id, updates);
        }
      }

      if (user.status !== 'active') {
        throw new InvalidCredentialsException('Account is not active.');
      }

      // Generate Directus Session Tokens
      const authService = new AuthenticationService({
        schema: req.schema,
        accountability: { admin: false, role: user.role, user: user.id }
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

      res.json({
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires: 15 * 60 * 1000
        }
      });

    } catch (error) {
      logger.error('Entra authentication error:', error);
      next(error);
    }
  });

  async function verifyMicrosoftToken(idToken, env) {
    return new Promise((resolve, reject) => {
      const getKey = (header, callback) => {
        client.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          callback(null, key.getPublicKey());
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
          if (err) return reject(err);
          resolve(decoded);
        }
      );
    });
  }
};