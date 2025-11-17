import { directusFetch, directusUrl } from './directus';
import { User, SignupData } from '../contexts/AuthContext';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires: number;
  user: User;
}

// Login with email and password (for non-members)
export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${directusUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        mode: 'cookie', // Optional: use session mode
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.errors?.[0]?.message || errorData.message || 'Invalid user credentials.';
      
      // Provide helpful error messages
      if (response.status === 401) {
        if (errorMsg.includes('Invalid user credentials')) {
          throw new Error('Email or password is incorrect. If you signed up with Microsoft, please use "Login with Microsoft" instead.');
        }
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    console.log('Login response:', data);
    
    // Directus wraps the response in a 'data' object
    const authData = data.data || data;
    
    // Fetch full user details including member data
    const userDetails = await fetchUserDetails(authData.access_token);
    
    return {
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      expires: authData.expires,
      user: userDetails,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Login with Microsoft Entra ID
export async function loginWithEntraId(entraIdToken: string, userEmail: string): Promise<LoginResponse> {
  try {
    console.log('📤 Sending login request:', {
      url: `${directusUrl}/directus-extension-entra-auth/auth/login/entra`,
      tokenPresent: !!entraIdToken,
      tokenLength: entraIdToken?.length,
      email: userEmail
    });
    
    // This endpoint should be created on your Directus backend
    // It will verify the Entra ID token and match it with the user's entra_id field
    const response = await fetch(`${directusUrl}/directus-extension-entra-auth/auth/login/entra`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: entraIdToken,
        email: userEmail,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.errors?.[0]?.message || 'Microsoft login failed');
    }

    const data = await response.json();
    console.log('📦 Received from backend:', data);
    
    // The backend returns the data directly, not nested in data.data
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires: data.expires,
      user: data.user, // Backend already returns full user details
    };
  } catch (error) {
    console.error('Entra ID login error:', error);
    throw error;
  }
}

// Signup for non-members
export async function signupWithPassword(userData: SignupData): Promise<LoginResponse> {
  try {
    // Create the Directus user directly
    await directusFetch<any>('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        role: import.meta.env.VITE_DEFAULT_USER_ROLE_ID, // Set a default user role
        status: 'active',
      }),
    });

    // Now login with the new credentials
    return await loginWithPassword(userData.email, userData.password);
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

// Fetch current user details
export async function fetchUserDetails(token: string): Promise<User> {
  try {
    const response = await fetch(`${directusUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    const userData = await response.json();
    const user = userData.data;

    // Determine if user is a member based on having entra_id or fontys_email
    const isMember = !!(user.entra_id || user.fontys_email);

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      entra_id: user.entra_id,
      fontys_email: user.fontys_email,
      phone_number: user.phone_number,
      avatar: user.avatar,
      is_member: isMember,
      member_id: undefined, // No longer using members table
    };
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    throw error;
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${directusUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const userDetails = await fetchUserDetails(data.data.access_token);
    
    return {
      access_token: data.data.access_token,
      refresh_token: data.data.refresh_token,
      expires: data.data.expires,
      user: userDetails,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

// Logout
export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${directusUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw - logout should succeed even if API call fails
  }
}

// Get user's event signups
export async function getUserEventSignups(userId: string) {
  const query = new URLSearchParams({
    'filter[directus_relations][_eq]': userId,
    'fields': 'id,event_id.id,event_id.name,event_id.event_date,event_id.image,event_id.description,created_at',
    'sort': '-created_at',
  }).toString();
  
  return directusFetch<any[]>(`/items/event_signups?${query}`);
}

// Create event signup
export async function createEventSignup(eventId: number, userId: string, submissionFileUrl?: string) {
  return directusFetch<any>('/items/event_signups', {
    method: 'POST',
    body: JSON.stringify({
      event_id: eventId,
      directus_relations: userId,
      submission_file_url: submissionFileUrl,
    }),
  });
}
