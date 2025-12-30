import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export default (router, context) => {
    const { services, exceptions, database, logger, env } = context || {};

    if (logger) {
        logger.info('[EntraAuth] Extension initialization started.');
    }

    if (logger) {
        logger.info('[EntraAuth] Registering routes...');
    }

    router.get('/', (req, res) => {
        if (logger) logger.info('[EntraAuth] Diagnostic GET / request received');
        res.send('Entra Auth Extension is ACTIVE and running.');
    });

    const UsersService = services?.UsersService;
    const AuthenticationService = services?.AuthenticationService;

    const InvalidPayloadException = exceptions?.InvalidPayloadException || Error;
    const InvalidCredentialsException = exceptions?.InvalidCredentialsException || Error;

    const jwksUri = `https://login.microsoftonline.com/${env?.AUTH_MICROSOFT_TENANT_ID || 'common'}/discovery/v2.0/keys`;
    const client = jwksClient({
        jwksUri: jwksUri,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10
    });

    router.post('/auth/login/entra', async (req, res, next) => {
        const requestId = Math.random().toString(36).substring(7);
        if (logger) {
            logger.info(`[EntraAuth][${requestId}] POST /auth/login/entra route hit.`);
        }

        try {
            const { token, email } = req.body || {};

            if (!token || !email) {
                if (logger) logger.warn(`[EntraAuth][${requestId}] Missing token or email.`);
                return res.status(400).json({ error: 'Token and email are required', code: 'INVALID_PAYLOAD' });
            }


            if (!UsersService || !AuthenticationService) {
                const msg = 'Internal error: Required Directus services are missing.';
                if (logger) logger.error(`[EntraAuth][${requestId}] ${msg} (Services: ${!!UsersService}, ${!!AuthenticationService})`);
                return res.status(500).json({ error: msg, code: 'INTERNAL_SERVER_ERROR' });
            }

            let microsoftUser;
            try {
                if (logger) logger.debug(`[EntraAuth][${requestId}] Verifying Microsoft token...`);
                microsoftUser = await verifyMicrosoftToken(token, env, logger, client);
                if (logger) logger.debug(`[EntraAuth][${requestId}] Token verified for OID: ${microsoftUser.oid}`);
            } catch (error) {
                if (logger) {
                    logger.error(`[EntraAuth][${requestId}] Token verification FAILED.`);
                    logger.error(`[EntraAuth][${requestId}] Error Name: ${error.name}`);
                    logger.error(`[EntraAuth][${requestId}] Error Message: ${error.message}`);
                }
                throw new InvalidCredentialsException(`Invalid or expired Microsoft token: ${error.message}`);
            }

            const tokenEmail = microsoftUser.email || microsoftUser.preferred_username || microsoftUser.upn;
            const requestedEmail = email.toLowerCase();

            if (!tokenEmail) {
                if (logger) logger.error(`[EntraAuth][${requestId}] No email found in Microsoft token.`);
                throw new InvalidCredentialsException('No email found in Microsoft account');
            }

            if (tokenEmail.toLowerCase() !== requestedEmail) {
                if (logger) logger.warn(`[EntraAuth][${requestId}] Email mismatch. Token: ${tokenEmail}, Requested: ${requestedEmail}`);
                throw new InvalidCredentialsException('Email does not match Microsoft account');
            }

            const accountability = { admin: true, role: null, user: null };
            const usersService = new UsersService({ schema: req.schema, accountability });

            if (logger) logger.debug(`[EntraAuth][${requestId}] Looking up user in database...`);
            let user = await database('directus_users')
                .where({ entra_id: microsoftUser.oid })
                .orWhere({ external_identifier: microsoftUser.oid })
                .first();

            if (!user) {
                if (logger) logger.debug(`[EntraAuth][${requestId}] User not found by ID, trying email...`);
                user = await database('directus_users')
                    .where({ email: requestedEmail })
                    .first();
            }

            const isFontysMember = requestedEmail.endsWith('@student.fontys.nl') || requestedEmail.endsWith('@fontys.nl');

            if (!user) {
                if (logger) logger.info(`[EntraAuth][${requestId}] Creating new user for ${requestedEmail}...`);
                const newUserId = await usersService.createOne({
                    email: requestedEmail,
                    entra_id: microsoftUser.oid,
                    first_name: microsoftUser.given_name || 'Unknown',
                    last_name: microsoftUser.family_name || 'User',
                    fontys_email: isFontysMember ? requestedEmail : null,
                    role: env?.AUTH_MICROSOFT_DEFAULT_ROLE_ID || null,
                    status: 'active',
                    provider: 'entra',
                    external_identifier: microsoftUser.oid
                });
                user = await usersService.readOne(newUserId);
            } else {
                if (logger) logger.debug(`[EntraAuth][${requestId}] User found (ID: ${user.id}). Updating sync fields...`);
                const updates = {};
                if (!user.entra_id) updates.entra_id = microsoftUser.oid;
                if (!user.external_identifier) updates.external_identifier = microsoftUser.oid;
                if (isFontysMember && !user.fontys_email) updates.fontys_email = requestedEmail;

                if (Object.keys(updates).length > 0) {
                    await usersService.updateOne(user.id, updates);
                }
            }

            if (user.status !== 'active') {
                if (logger) logger.warn(`[EntraAuth][${requestId}] User ${user.id} is not active.`);
                throw new InvalidCredentialsException('Account is not active.');
            }

            if (logger) logger.debug(`[EntraAuth][${requestId}] User validated. Generating Directus tokens...`);

            // Use the AuthenticationService to create a session
            const authService = new AuthenticationService({
                schema: req.schema,
                accountability: { admin: false, role: user.role, user: user.id }
            });

            // In Directus v11, we should use a more standard way to generate tokens.
            // If the extension is supposed to return a refresh token, it should be a real one from the DB.

            let refreshToken;
            try {
                // Generate a random token for the session
                refreshToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

                if (logger) logger.debug(`[EntraAuth][${requestId}] Creating session in database for user ${user.id}...`);

                // Insert the session into directus_sessions to ensure it's valid for /auth/refresh
                await database('directus_sessions').insert({
                    token: refreshToken,
                    user: user.id,
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                    ip: req.ip || '0.0.0.0',
                    user_agent: req.headers['user-agent'] || 'Directus Entra Auth Extension'
                });

                if (logger) logger.info(`[EntraAuth][${requestId}] Session created successfully for user ${user.id}.`);

            } catch (err) {
                if (logger) logger.error(`[EntraAuth][${requestId}] Failed to create session in database: ${err.message}`);
                // Fallback to stateless token if DB insert fails
                refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, env?.SECRET, { expiresIn: '7d' });
                if (logger) logger.warn(`[EntraAuth][${requestId}] Falling back to stateless refresh token.`);
            }

            const accessToken = jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    app_access: true,
                    admin_access: false
                },
                env?.SECRET,
                {
                    expiresIn: env?.ACCESS_TOKEN_TTL || '15m',
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
            if (logger) logger.error(`[EntraAuth][${requestId}] Error processing request:`, error);
            next(error);
        }
    });

    async function verifyMicrosoftToken(idToken, env, logger, client) {
        return new Promise((resolve, reject) => {
            const getKey = (header, callback) => {
                client.getSigningKey(header.kid, (err, key) => {
                    if (err) return callback(err);
                    callback(null, key.getPublicKey());
                });
            };

            const expectedIssuer = `https://login.microsoftonline.com/${env?.AUTH_MICROSOFT_TENANT_ID || 'common'}/v2.0`;

            jwt.verify(
                idToken,
                getKey,
                {
                    audience: env?.ENTRA_AUTH_FRONTEND_CLIENT_ID || env?.AUTH_MICROSOFT_CLIENT_ID,
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