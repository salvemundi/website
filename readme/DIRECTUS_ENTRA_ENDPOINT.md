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
    └── endpoints/
        └── entra-auth/
            ├── index.js
            └── package.json
```

### Step 2: Create package.json

Create `extensions/endpoints/entra-auth/package.json`:

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
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

export default {
  id: 'entra-auth',
  handler: (router, { services, exceptions, database, logger }) => {
    const { UsersService, AuthenticationService } = services;
    const { InvalidPayloadException, InvalidCredentialsException } = exceptions;

    router.post('/login/entra', async (req, res, next) => {
      try {
        const { token, email } = req.body;

        if (!token || !email) {
          throw new InvalidPayloadException('Token and email are required');
        }

        // Verify Microsoft token
        const microsoftUser = await verifyMicrosoftToken(token);
        
        if (!microsoftUser || microsoftUser.email.toLowerCase() !== email.toLowerCase()) {
          throw new InvalidCredentialsException('Invalid Microsoft token');
        }

        // Find or create user in Directus
        const usersService = new UsersService({ schema: req.schema, accountability: req.accountability });
        
        // Try to find user by entra_id first, then by email
        let user = await database('directus_users')
          .where({ entra_id: microsoftUser.oid })
          .first();

        if (!user) {
          user = await database('directus_users')
            .where({ email: email.toLowerCase() })
            .first();
        }

        // If user doesn't exist, create one (optional - you might want to restrict this)
        if (!user) {
          // Check if member exists in members table
          const member = await database('members')
            .where({ fontys_email: email.toLowerCase() })
            .orWhere({ email: email.toLowerCase() })
            .first();

          if (!member) {
            throw new InvalidCredentialsException('No member account found for this email');
          }

          // Create Directus user linked to member
          user = await usersService.createOne({
            email: email.toLowerCase(),
            entra_id: microsoftUser.oid,
            first_name: microsoftUser.given_name || member.first_name,
            last_name: microsoftUser.family_name || member.last_name,
            fontys_email: email.toLowerCase(),
            role: process.env.DEFAULT_USER_ROLE_ID,
            status: 'active',
            provider: 'entra'
          });
        } else {
          // Update user's entra_id if not set
          if (!user.entra_id) {
            await usersService.updateOne(user.id, {
              entra_id: microsoftUser.oid,
              fontys_email: email.toLowerCase()
            });
          }
        }

        // Create authentication session
        const authService = new AuthenticationService({ schema: req.schema, accountability: req.accountability });
        const { accessToken, refreshToken, expires } = await authService.login('default', {
          email: user.email,
          password: null // Skip password check for SSO
        }, {
          session: true
        });

        // Return tokens
        res.json({
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires: expires
          }
        });

      } catch (error) {
        logger.error('Entra authentication error:', error);
        next(error);
      }
    });
  }
};

// Helper function to verify Microsoft token
async function verifyMicrosoftToken(idToken) {
  try {
    // Decode token without verification (for development)
    // In production, you should verify the signature
    const decoded = jwt.decode(idToken, { complete: true });
    
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    const payload = decoded.payload;

    // Basic validation
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    // Return user info
    return {
      oid: payload.oid, // Microsoft user ID
      email: payload.email || payload.preferred_username,
      given_name: payload.given_name,
      family_name: payload.family_name,
      name: payload.name
    };

  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Token verification failed');
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
