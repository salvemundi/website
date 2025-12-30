console.log('[EntraAuth] Extension module loading started...');

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export default (router, context) => {
    const { services, exceptions, database, logger, env } = context;

    // Log direct naar console om zeker te zijn dat het niet door Directus logger wordt ingeslikt
    console.log('[EntraAuth] Extension initialization started.');
    console.log(`[EntraAuth] Environment check - Tenant ID configured: ${!!env.AUTH_MICROSOFT_TENANT_ID}`);

    logger.info('[EntraAuth] Registering routes...');

    router.get('/', (req, res) => {
        logger.info('[EntraAuth] Diagnostic GET / request received');
        res.send('Entra Auth Extension is ACTIVE and running.');
    });

    const { UsersService, AuthenticationService } = services;
    const { InvalidPayloadException, InvalidCredentialsException } = exceptions;

    const client = jwksClient({
        jwksUri: `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/discovery/v2.0/keys`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10
    });

    // Match the route expected by the frontend
    router.post('/auth/login/entra', async (req, res, next) => {
        const requestId = Math.random().toString(36).substring(7);
        logger.info(`[EntraAuth][${requestId}] POST /auth/login/entra route hit.`);
        console.log(`[EntraAuth][${requestId}] Processing login request for payload keys: ${Object.keys(req.body).join(', ')}`);

        try {
            const { token, email } = req.body;

            if (!token || !email) {
                logger.warn(`[EntraAuth][${requestId}] Missing token or email.`);
                return res.status(400).json({ error: 'Token and email are required', code: 'INVALID_PAYLOAD' });
            }

            let microsoftUser;
            try {
                // Pass environment and client to the helper function
                logger.debug(`[EntraAuth][${requestId}] Verifying Microsoft token...`);
                microsoftUser = await verifyMicrosoftToken(token, env, logger, client);
                logger.debug(`[EntraAuth][${requestId}] Token verified for OID: ${microsoftUser.oid}`);
            } catch (error) {
                logger.error(`[EntraAuth][${requestId}] Token verification failed:`, error);
                throw new InvalidCredentialsException('Invalid or expired Microsoft token');
            }

            const tokenEmail = microsoftUser.email || microsoftUser.preferred_username;
            const requestedEmail = email.toLowerCase();

            if (tokenEmail.toLowerCase() !== requestedEmail) {
                logger.warn(`[EntraAuth][${requestId}] Email mismatch. Token: ${tokenEmail}, Requested: ${requestedEmail}`);
                throw new InvalidCredentialsException('Email does not match Microsoft account');
            }

            const accountability = { admin: true, role: null, user: null };
            const usersService = new UsersService({ schema: req.schema, accountability });

            // User Lookup Strategy
            logger.debug(`[EntraAuth][${requestId}] Looking up user in database...`);
            let user = await database('directus_users')
                .where({ entra_id: microsoftUser.oid })
                .first();

            if (!user) {
                logger.debug(`[EntraAuth][${requestId}] User not found by entra_id, trying email...`);
                user = await database('directus_users')
                    .where({ email: requestedEmail })
                    .first();
            }

            const isFontysMember = requestedEmail.endsWith('@student.fontys.nl') || requestedEmail.endsWith('@fontys.nl');

            if (!user) {
                logger.info(`[EntraAuth][${requestId}] Creating new user for ${requestedEmail}...`);
                const newUserId = await usersService.createOne({
                    email: requestedEmail,
                    entra_id: microsoftUser.oid,
                    first_name: microsoftUser.given_name || 'Unknown',
                    last_name: microsoftUser.family_name || 'User',
                    fontys_email: isFontysMember ? requestedEmail : null,
                    role: env.AUTH_MICROSOFT_DEFAULT_ROLE_ID || null,
                    status: 'active',
                    provider: 'entra',
                    external_identifier: microsoftUser.oid
                });
                user = await usersService.readOne(newUserId);
            } else {
                logger.debug(`[EntraAuth][${requestId}] User found (ID: ${user.id}). Updating sync fields...`);
                const updates = {};
                if (!user.entra_id) updates.entra_id = microsoftUser.oid;
                if (!user.external_identifier) updates.external_identifier = microsoftUser.oid;
                if (isFontysMember && !user.fontys_email) updates.fontys_email = requestedEmail;

                if (Object.keys(updates).length > 0) {
                    await usersService.updateOne(user.id, updates);
                }
            }

            if (user.status !== 'active') {
                logger.warn(`[EntraAuth][${requestId}] User ${user.id} is not active.`);
                throw new InvalidCredentialsException('Account is not active.');
            }

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

            logger.info(`[EntraAuth][${requestId}] Login successful for user ${user.id}.`);

            res.json({
                data: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires: 15 * 60 * 1000
                }
            });

        } catch (error) {
            logger.error(`[EntraAuth][${requestId}] Error processing request:`, error);
            next(error);
        }
    });

    // Helper function to verify token
    async function verifyMicrosoftToken(idToken, env, logger, client) {
        return new Promise((resolve, reject) => {
            const getKey = (header, callback) => {
                client.getSigningKey(header.kid, (err, key) => {
                    if (err) return callback(err);
                    callback(null, key.getPublicKey());
                });
            };

            const expectedIssuer = `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/v2.0`;

            jwt.verify(
                idToken,
                getKey,
                {
                    audience: env.AUTH_MICROSOFT_CLIENT_ID,
                    issuer: expectedIssuer,
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