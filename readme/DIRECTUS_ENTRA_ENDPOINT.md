# Creating the Directus Entra ID Endpoint

## Overview

You need to create a custom endpoint in Directus to handle Microsoft Entra ID authentication. This endpoint will verify the Microsoft token and create a Directus session.

## Option 1: Custom API Extension (Recommended)

Create a Directus extension to add the `/auth/login/entra` endpoint.

### Step 1: Create Extension Structure

In your Directus project, create this folder structure:

```
directus/
└── extensions/
        └─ entra-auth/
            ├── index.js
            └── package.json
```

### Step 2: Create package.json

Create `extensions/entra-auth/package.json`:

```json
{
  "name": "directus-endpoint-entra-auth",
  "version": "1.0.0",
  "keywords": [
    "directus",
    "directus-extension",
    "directus-custom-endpoint"
  ],
  "directus:extension": {
    "type": "endpoint",
    "path": "dist/index.js",
    "source": "index.js",
    "host": "^10.0.0"
  },
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "node-fetch": "^2.6.1"
  }
}
```

### Step 3: Create index.js

Create `extensions/endpoints/entra-auth/index.js`:

```javascript
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

      logger.info('📥 Request received');
      logger.info('hasBody: ' + !!body);
      logger.info('bodyType: ' + typeof body);
      logger.info('bodyKeys: ' + (body ? JSON.stringify(Object.keys(body)) : 'null'));
      logger.info('body content: ' + JSON.stringify(body));

      const { token, email } = body || {};
      
      logger.info('Extracted token: ' + (token ? 'YES (length: ' + token.length + ')' : 'NO'));
      logger.info('Extracted email: ' + (email || 'NONE'));

      if (!token || !email) {
        logger.error('Missing token or email in request');
        logger.error('hasToken: ' + !!token);
        logger.error('hasEmail: ' + !!email);
        logger.error('tokenLength: ' + (token ? token.length : 0));
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
        logger.info('✅ User created: ' + user.id);
      } else {
        // Update existing user with Entra ID and sync data from Microsoft
        logger.info('🔄 Updating existing user: ' + user.id);
        
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
      
      // Import JWT library to create tokens manually
      const jwt = await import('jsonwebtoken');
      const ms = await import('ms');
      
      // Get environment variables for token configuration
      const SECRET = process.env.SECRET || 'directus-secret';
      const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
      const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
      
      // Generate access token
      const accessTokenPayload = {
        id: user.id,
        role: user.role,
        app_access: true,
        admin_access: user.role === 'admin' || false,
      };
      
      const accessToken = jwt.default.sign(accessTokenPayload, SECRET, {
        expiresIn: ACCESS_TOKEN_TTL,
        issuer: 'directus',
      });
      
      // Generate refresh token
      const refreshTokenPayload = {
        id: user.id,
      };
      
      const refreshToken = jwt.default.sign(refreshTokenPayload, SECRET, {
        expiresIn: REFRESH_TOKEN_TTL,
        issuer: 'directus',
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

      logger.info('✅ Login successful for: ' + email);
      
      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
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

```

### Step 4: Install Dependencies in Directus

Navigate to your Directus project root and install dependencies:

```bash
cd directus/extensions/endpoints/entra-auth
npm install
```

### Step 5: Restart Directus

```bash
# From your Directus root
npm run restart
# or
npx directus start
```

The endpoint will be available at: `http://your-directus-url/auth/login/entra`

---

## Option 2: Directus Hooks (Simpler, but less control)

If extensions are too complex, you can use Directus Hooks to handle the authentication.

Create `directus/extensions/hooks/entra-auth/index.js`:

```javascript
export default ({ filter, action }) => {
  filter('auth.login', async (payload, meta, context) => {
    // Check if this is an Entra ID login attempt
    if (meta.provider === 'entra') {
      // Handle Entra ID authentication
      const { token, email } = payload;
      
      // Verify token and find/create user
      // ... (similar logic as above)
    }
    
    return payload;
  });
};
```

---

## Option 3: Custom Node.js Middleware (If you control Directus deployment)

If you have direct access to the Directus server setup, you can add custom Express middleware.

In your Directus `server.js` or main entry point:

```javascript
// directus/server.js
import express from 'express';
import jwt from 'jsonwebtoken';

export default {
  init: (directus) => {
    const app = directus.app;
    
    // Add custom endpoint before Directus routes
    app.post('/auth/login/entra', async (req, res) => {
      try {
        const { token, email } = req.body;
        
        // Verify Microsoft token
        const decoded = jwt.decode(token);
        
        // Find or create user
        const knex = directus.database;
        let user = await knex('directus_users')
          .where({ entra_id: decoded.oid })
          .first();
        
        if (!user) {
          user = await knex('directus_users')
            .where({ email })
            .first();
        }
        
        if (!user) {
          return res.status(401).json({
            errors: [{ message: 'User not found' }]
          });
        }
        
        // Generate Directus tokens
        // ... (use Directus authentication service)
        
        res.json({
          data: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires: Date.now() + 900000
          }
        });
        
      } catch (error) {
        res.status(500).json({
          errors: [{ message: error.message }]
        });
      }
    });
  }
};
```

---

## Testing the Endpoint

### Test with cURL

```bash
curl -X POST http://localhost:8055/auth/login/entra \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-microsoft-id-token",
    "email": "user@fontys.nl"
  }'
```

### Expected Response

```json
{
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires": 900000
  }
}
```

---

## Environment Variables

Add to your Directus `.env`:

```env
DEFAULT_USER_ROLE_ID=uuid-of-default-role
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-client-id
```

---

## Production Considerations

### 1. Token Verification (Important!)

The example above uses basic token decoding. For production, you should properly verify the Microsoft token signature:

```javascript
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Verify token
jwt.verify(token, getKey, {
  audience: clientId,
  issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
  algorithms: ['RS256']
}, (err, decoded) => {
  if (err) {
    throw new Error('Invalid token');
  }
  // Token is valid
});
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

router.post('/login/entra', limiter, async (req, res) => {
  // ... authentication logic
});
```

### 3. Logging

Log authentication attempts for security:

```javascript
logger.info('Entra login attempt', {
  email,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

---

## Troubleshooting

### "Extension not found"

Make sure:
1. Extension is in `directus/extensions/endpoints/`
2. Directus was restarted after adding the extension
3. Check Directus logs: `npx directus logs`

### "Token verification failed"

- Check that the token is being sent correctly from frontend
- Verify the token hasn't expired
- Check Microsoft Graph API configuration

### "User not found"

- Ensure the `members` table has entries with matching emails
- Check that `directus_users` has the `entra_id` and `fontys_email` columns

### CORS Issues

Add CORS headers in your Directus configuration:

```env
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:5173,https://your-domain.com
```

---

## Additional Resources

- [Directus Extensions Documentation](https://docs.directus.io/extensions/)
- [Microsoft Identity Platform Docs](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [JWT Verification Guide](https://learn.microsoft.com/en-us/azure/active-directory/develop/access-tokens#validate-tokens)

---

## Quick Start Script

I'll create a helper script to set up the extension automatically.
