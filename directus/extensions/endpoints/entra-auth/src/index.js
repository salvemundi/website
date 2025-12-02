console.log('[ENTRA-AUTH-DEBUG] Loading extension module into memory...');

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const entraAuthEndpoint = (router, { services, exceptions, database, logger, env }) => {
    logger.info('[ENTRA-AUTH] Extension initializing...');

    router.get('/', (req, res) => {
        res.send('Entra Auth Extension is ACTIVE');
    });

    const { UsersService, AuthenticationService } = services;
    const { InvalidPayloadException, InvalidCredentialsException } = exceptions;

    const client = jwksClient({
        jwksUri: `https://login.microsoftonline.com/${env.AUTH_MICROSOFT_TENANT_ID || 'common'}/discovery/v2.0/keys`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10
    });

    router.post('/', async (req, res, next) => {
        logger.info('[ENTRA-AUTH] POST / (ROOT) route hit.');
        
        try {
            const { token, email } = req.body;
            
            if (!token || !email) {
                logger.warn('[ENTRA-AUTH] Missing token or email.');
                return res.status(400).json({ error: 'Token and email are required', code: 'INVALID_PAYLOAD' });
            }

            let microsoftUser;
            try {
                microsoftUser = await verifyMicrosoftToken(token, env, logger, client);
            } catch (error) {
                logger.error('[ENTRA-AUTH] Token verification failed:', error);
                throw new InvalidCredentialsException('Invalid or expired Microsoft token');
            }

            const tokenEmail = microsoftUser.email || microsoftUser.preferred_username;
            const requestedEmail = email.toLowerCase();
            
            if (tokenEmail.toLowerCase() !== requestedEmail) {
                throw new InvalidCredentialsException('Email does not match Microsoft account');
            }
            
            const accountability = { admin: true, role: null, user: null };
            const usersService = new UsersService({ schema: req.schema, accountability });
            
            let user = await database('directus_users')
                .where({ entra_id: microsoftUser.oid })
                .first();

            if (!user) {
                user = await database('directus_users')
                    .where({ email: requestedEmail })
                    .first();
            }
            
            const isFontysMember = requestedEmail.endsWith('@student.fontys.nl') || requestedEmail.endsWith('@fontys.nl');

            if (!user) {
                logger.info('[ENTRA-AUTH] Creating new user...');
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
                const updates = {};
                if (!user.entra_id) updates.entra_id = microsoftUser.oid;
                if (!user.external_identifier) updates.external_identifier = microsoftUser.oid;
                if (isFontysMember && !user.fontys_email) updates.fontys_email = requestedEmail;
                
                if (Object.keys(updates).length > 0) {
                    await usersService.updateOne(user.id, updates);
                }
            }

            if (user.status !== 'active') {
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
            
            logger.info(`[ENTRA-AUTH] Login successful for user ${user.id}.`);

            res.json({
                data: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires: 15 * 60 * 1000
                }
            });

        } catch (error) {
            logger.error('[ENTRA-AUTH] Error:', error);
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

module.exports = entraAuthEndpoint;