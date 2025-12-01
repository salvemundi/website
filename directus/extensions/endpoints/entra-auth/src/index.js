import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const entraAuthEndpoint = (router, { services, exceptions, database, logger, env }) => {
    // ESSENTIEEL: Logging om te bevestigen dat de extensie-entry point wordt uitgevoerd door Directus.
    logger.info('[ENTRA-AUTH] Extension initializing. Checking environment configuration...');

    const { UsersService, AuthenticationService } = services;
    const { InvalidPayloadException, InvalidCredentialsException } = exceptions;

    if (!env.AUTH_MICROSOFT_TENANT_ID) {
        // Waarschuwing als kritieke omgevingsvariabele ontbreekt (kan silent fail veroorzaken)
        logger.warn('[ENTRA-AUTH] AUTH_MICROSOFT_TENANT_ID is not set in environment variables.');
    }

    const client = jwksClient({
        // Gebruik 'common' als fallback, maar log de gebruikte URI
        jwksUri: `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/discovery/v2.0/keys`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10
    });
    
    logger.info(`[ENTRA-AUTH] JWKS Client configured for Tenant: ${env.AUTH_MICROSOFT_TENANT_ID || 'common'}`);


    router.post('/login/entra', async (req, res, next) => {
        // Debugging voor route-bereikbaarheid (dit wordt alleen gezien als de extensie laadt)
        logger.info('[ENTRA-AUTH] POST /login/entra route hit.');
        try {
            const { token, email } = req.body;
            
            // Log de ingevoerde data (zonder gevoelige token)
            logger.info(`[ENTRA-AUTH] Attempting login for email: ${email}`);

            if (!token || !email) {
                logger.warn('[ENTRA-AUTH] Missing token or email in payload.');
                throw new InvalidPayloadException('Token and email are required');
            }

            // Verify Microsoft Token
            let microsoftUser;
            try {
                // Hier zullen we de daadwerkelijke tokenverificatie-start loggen
                logger.info('[ENTRA-AUTH] Starting Microsoft token verification...');
                microsoftUser = await verifyMicrosoftToken(token, env, logger);
                logger.info(`[ENTRA-AUTH] Token verified. Microsoft OID: ${microsoftUser.oid}`);
            } catch (error) {
                logger.error('[ENTRA-AUTH] Token verification failed:', error);
                throw new InvalidCredentialsException('Invalid or expired Microsoft token');
            }

            // Email Validation
            const tokenEmail = microsoftUser.email || microsoftUser.preferred_username;
            if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
                logger.error(`[ENTRA-AUTH] Email mismatch. Token email: ${tokenEmail}, Request email: ${email}`);
                throw new InvalidCredentialsException('Email does not match Microsoft account');
            }
            
            // Directus User Lookup & Sync
            const accountability = { admin: true, role: null, user: null };
            const usersService = new UsersService({ schema: req.schema, accountability });
            
            logger.info(`[ENTRA-AUTH] Searching for user with OID: ${microsoftUser.oid} or email: ${email}`);
            
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
                logger.info('[ENTRA-AUTH] User not found. Creating new user...');
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
                logger.info(`[ENTRA-AUTH] Created new user: ${user.id}`);
            } else {
                // Sync user data
                const updates = {};
                if (!user.entra_id) updates.entra_id = microsoftUser.oid;
                if (!user.external_identifier) updates.external_identifier = microsoftUser.oid;
                
                if (Object.keys(updates).length > 0) {
                    logger.info(`[ENTRA-AUTH] Syncing user ${user.id} data: ${Object.keys(updates).join(', ')}`);
                    await usersService.updateOne(user.id, updates);
                } else {
                    logger.info(`[ENTRA-AUTH] User ${user.id} found. No data sync needed.`);
                }
            }

            if (user.status !== 'active') {
                logger.warn(`[ENTRA-AUTH] User ${user.id} is inactive.`);
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
            
            logger.info(`[ENTRA-AUTH] Successfully issued tokens for user ${user.id}.`);

            res.json({
                data: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires: 15 * 60 * 1000
                }
            });

        } catch (error) {
            logger.error('[ENTRA-AUTH] Critical Entra authentication error:', error);
            next(error);
        }
    });

    async function verifyMicrosoftToken(idToken, env, logger) {
        return new Promise((resolve, reject) => {
            const getKey = (header, callback) => {
                logger.info(`[ENTRA-AUTH] Retrieving JWKS key with KID: ${header.kid}`);
                client.getSigningKey(header.kid, (err, key) => {
                    if (err) {
                        logger.error('[ENTRA-AUTH] Error retrieving signing key:', err.message);
                        return callback(err);
                    }
                    callback(null, key.getPublicKey());
                });
            };

            const expectedIssuer = `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/v2.0`;
            logger.info(`[ENTRA-AUTH] JWT Verification parameters: Audience=${env.AUTH_MICROSOFT_CLIENT_ID}, Issuer=${expectedIssuer}`);

            jwt.verify(
                idToken,
                getKey,
                {
                    audience: env.AUTH_MICROSOFT_CLIENT_ID,
                    issuer: expectedIssuer,
                    algorithms: ['RS256']
                },
                (err, decoded) => {
                    if (err) {
                        logger.error('[ENTRA-AUTH] JWT Verification failed:', err.message);
                        return reject(err);
                    }
                    logger.info('[ENTRA-AUTH] JWT successfully decoded.');
                    resolve(decoded);
                }
            );
        });
    }
};

// Gebruik standaard ESM export om compilatie te laten slagen.
export default entraAuthEndpoint;