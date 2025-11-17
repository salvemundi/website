# Authentication System Setup Guide

## Overview

This application implements a dual authentication system:
1. **Microsoft Entra ID** (formerly Azure AD) for Salve Mundi members
2. **Email/Password** authentication for non-members

## Features

-  Microsoft Entra ID OAuth2 login for members
-  Email/password signup and login for guests
-  Protected routes requiring authentication
-  User account overview page
-  Event signup tracking
-  Session management with token refresh

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Directus Configuration
VITE_DIRECTUS_URL=https://your-directus-instance.com
VITE_DIRECTUS_API_KEY=your-api-key-here

# Microsoft Entra ID Configuration
VITE_ENTRA_CLIENT_ID=your-entra-client-id
VITE_ENTRA_TENANT_ID=your-tenant-id-or-common

# Default Role ID for new users (from Directus)
VITE_DEFAULT_USER_ROLE_ID=your-default-role-uuid
```

## Microsoft Entra ID Setup

### 1. Register Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: "Salve Mundi Website"
   - **Supported account types**: "Accounts in this organizational directory only"
   - **Redirect URI**: 
     - Platform: Single-page application (SPA)
     - URI: `http://localhost:5173` (for dev) and your production URL

### 2. Configure API Permissions

1. Go to **API permissions**
2. Add the following Microsoft Graph permissions:
   - `User.Read` (Delegated)
   - `openid` (Delegated)
   - `profile` (Delegated)
   - `email` (Delegated)

### 3. Get Application Details

1. Go to **Overview** tab
2. Copy **Application (client) ID** → Use as `VITE_ENTRA_CLIENT_ID`
3. Copy **Directory (tenant) ID** → Use as `VITE_ENTRA_TENANT_ID`

## Directus Backend Setup

### Required Extensions/Endpoints

The authentication system requires custom Directus endpoints. You need to create a Directus extension or hook to handle:

#### 1. Entra ID Login Endpoint

**Endpoint**: `POST /auth/login/entra`

**Request Body**:
```json
{
  "token": "microsoft-id-token",
  "email": "user@fontys.nl"
}
```

**Logic**:
1. Verify the Microsoft ID token
2. Look up user by `entra_id` or `fontys_email` in `directus_users` table
3. If user exists, create a Directus session and return access/refresh tokens
4. If user doesn't exist but has valid Fontys email, create new user and member record
5. Return authentication tokens

#### 2. Member Linking

Ensure that `directus_users` table has:
- `entra_id` field (VARCHAR, unique) - stores Microsoft user ID
- `fontys_email` field (VARCHAR) - stores Fontys email address

Link to `members` table via `entra_id` or `email` matching.

### Database Schema Updates

The following fields should exist in your `directus_users` table:
```sql
ALTER TABLE directus_users 
ADD COLUMN IF NOT EXISTS entra_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS fontys_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255);
```

The `event_signups` table should use `user_id` to link to Directus users:
```sql
-- If you have member_id, you can add user_id as well or migrate
ALTER TABLE event_signups 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES directus_users(id);
```

## Routes

### Public Routes
- `/` - Home page
- `/intro` - Introduction page
- `/activiteiten` - Events listing (view only)
- `/commissies` - Committees listing
- `/login` - Login page
- `/signup` - Signup page (non-members only)

### Protected Routes (Require Authentication)
- `/account` - User account overview
- `/inschrijven` - Event registration/signup

## Usage

### For Salve Mundi Members
1. Click "Login with Microsoft" on the login page
2. Sign in with your Fontys/Salve Mundi Microsoft account
3. System automatically links to your member profile

### For Non-Members
1. Click "Sign up" on the login page
2. Fill in registration form (name, email, password)
3. Account is created as a guest (non-member)
4. Can register for events that allow non-members

## Authentication Flow

### Microsoft Login Flow
```
User clicks "Login with Microsoft"
  ↓
MSAL popup opens
  ↓
User authenticates with Microsoft
  ↓
MSAL returns ID token
  ↓
Send token to Directus /auth/login/entra
  ↓
Directus validates token and creates session
  ↓
Return access/refresh tokens
  ↓
Store tokens in localStorage
  ↓
User is authenticated
```

### Email/Password Flow
```
User submits login form
  ↓
Send credentials to Directus /auth/login
  ↓
Directus validates credentials
  ↓
Return access/refresh tokens
  ↓
Store tokens in localStorage
  ↓
User is authenticated
```

## Components

### Context
- `AuthContext` - Manages authentication state and provides auth methods

### Pages
- `LoginPagina` - Login page with Microsoft and email/password options
- `SignupPagina` - Registration page for non-members
- `AccountPagina` - User account overview and event registrations

### Components
- `ProtectedRoute` - HOC for protecting routes requiring authentication
- `NavBar` - Updated with login/account buttons

## API Functions

Located in `src/lib/auth.ts`:

- `loginWithPassword(email, password)` - Email/password login
- `loginWithEntraId(token, email)` - Microsoft Entra ID login
- `signupWithPassword(userData)` - Create new non-member account
- `fetchUserDetails(token)` - Get current user info
- `refreshAccessToken(refreshToken)` - Refresh expired access token
- `logout(refreshToken)` - Logout and invalidate session
- `getUserEventSignups(memberId)` - Get user's event registrations

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage. For production, consider using httpOnly cookies.
2. **Token Refresh**: Implement automatic token refresh before expiration
3. **CORS**: Configure Directus CORS settings for your frontend domain
4. **Rate Limiting**: Implement rate limiting on login endpoints
5. **Password Policy**: Enforce strong passwords (min 8 chars currently)

## Testing

### Test Microsoft Login
1. Use a test Fontys/Salve Mundi account
2. Verify user profile is fetched correctly
3. Check member status is displayed

### Test Email/Password
1. Create a test non-member account
2. Verify login works
3. Check that guest status is shown

## Troubleshooting

### "Microsoft login failed"
- Check MSAL configuration in `src/config/msalConfig.ts`
- Verify redirect URI matches Azure app registration
- Check browser console for MSAL errors

### "Login failed. Please check your credentials"
- Verify Directus URL is correct
- Check network tab for API errors
- Ensure Directus auth endpoints are accessible

### User not found after Microsoft login
- Verify backend endpoint `/auth/login/entra` exists
- Check if user's email is in `directus_users` or `members` table
- Ensure `entra_id` field is being populated

## Next Steps

1. Implement the Directus backend endpoint for Entra ID authentication
2. Set up proper role-based access control in Directus
3. Add email verification for non-member signups
4. Implement password reset functionality
5. Add 2FA for enhanced security
6. Add profile editing functionality (if needed)

## Support

For questions or issues, contact the Salve Mundi development team.
