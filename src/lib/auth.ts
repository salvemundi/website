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
    console.log('🔐 Attempting login with email:', email);
    console.log('� Password length:', password?.length);
    console.log('�📡 Directus URL:', directusUrl);
    console.log('📦 Request body:', JSON.stringify({ email, password: '***' }));
    
    const response = await fetch(`${directusUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log('📥 Login response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Login error response:', errorData);
      console.error('❌ Full error details:', {
        status: response.status,
        statusText: response.statusText,
        errors: errorData.errors,
        message: errorData.message,
        fullResponse: JSON.stringify(errorData, null, 2)
      });
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
    
    console.log('✅ Login response:', data);
    console.log('✅ Login response keys:', Object.keys(data));
    console.log('✅ data.data keys:', data.data ? Object.keys(data.data) : 'no data.data');
    
    // Directus wraps the response in a 'data' object
    const authData = data.data || data;
    
    console.log('🔑 authData keys:', Object.keys(authData));
    console.log('🔑 Access token received:', authData.access_token ? 'Yes' : 'No');
    console.log('👤 User data in login response:', authData.user);
    console.log('👤 User keys:', authData.user ? Object.keys(authData.user) : 'no user');
    
    // Try to use user data from login response first, fallback to fetching
    let userDetails: User;
    
    if (authData.user && authData.user.email) {
      // Use user data from login response
      console.log('✅ Using user data from login response');
      const isMember = !!(authData.user.entra_id || authData.user.fontys_email);
      userDetails = {
        id: authData.user.id,
        email: authData.user.email,
        first_name: authData.user.first_name || '',
        last_name: authData.user.last_name || '',
        entra_id: authData.user.entra_id,
        fontys_email: authData.user.fontys_email,
        phone_number: authData.user.phone_number,
        avatar: authData.user.avatar,
        is_member: isMember,
        member_id: undefined,
      };
    } else {
      // Fallback: Fetch user details
      console.log('⚠️ No user data in login response, fetching from /users/me');
      userDetails = await fetchUserDetails(authData.access_token);
    }
    
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
    console.log('📝 Creating new user:', { email: userData.email, firstName: userData.first_name });
    
    const roleId = import.meta.env.VITE_DEFAULT_USER_ROLE_ID;
    console.log('🔑 Using role ID:', roleId);
    
    if (!roleId) {
      console.warn('⚠️ No default role ID configured. User might not have proper permissions.');
    }
    
    // Create the Directus user directly
    const createUserResponse = await directusFetch<any>('/users', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        role: roleId || null, // Set a default user role or null
        status: 'active',
      }),
    });
    
    console.log('✅ User created successfully:', createUserResponse);

    // Now login with the new credentials
    console.log('🔐 Attempting login with new credentials...');
    return await loginWithPassword(userData.email, userData.password);
  } catch (error: any) {
    console.error('❌ Signup error:', error);
    
    // Check for duplicate email error
    const errorMessage = error.message || '';
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
      throw new Error('This email address is already registered. Please login instead or use a different email.');
    }
    
    // Check for specific Directus error codes
    if (errorMessage.includes('RECORD_NOT_UNIQUE')) {
      throw new Error('This email address is already registered. Please login instead or use a different email.');
    }
    
    throw error;
  }
}

// Fetch current user details
export async function fetchUserDetails(token: string): Promise<User> {
  try {
    console.log('👤 Fetching user details...');
    
    // Fetch with * to get all available fields
    const response = await fetch(`${directusUrl}/users/me?fields=*`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch user details:', errorText);
      throw new Error('Failed to fetch user details');
    }

    const userData = await response.json();
    console.log('📦 Raw user data from Directus (with * fields):', userData);
    console.log('📦 All available fields:', Object.keys(userData.data || {}));
    const user = userData.data;

    // Determine if user is a member based on having entra_id or fontys_email
    const isMember = !!(user.entra_id || user.fontys_email);

    const userDetails = {
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
      membership_status: user.membership_status,
      membership_expiry: user.membership_expiry,
      minecraft_username: user.minecraft_username,
    };
    
    console.log('✅ Processed user details:', {
      name: `${userDetails.first_name} ${userDetails.last_name}`,
      email: userDetails.email,
      is_member: userDetails.is_member
    });

    return userDetails;
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

// Update minecraft username
export async function updateMinecraftUsername(userId: string, minecraftUsername: string, token: string) {
  const response = await fetch(`${directusUrl}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      minecraft_username: minecraftUsername,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update minecraft username');
  }

  return response.json();
}

// Get user transactions
export async function getUserTransactions(userId: string, token: string) {
  const query = new URLSearchParams({
    'filter[user_id][_eq]': userId,
    'sort': '-created_at',
  }).toString();

  const response = await fetch(`${directusUrl}/items/transactions?${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // If 403, the collection might not exist or user doesn't have permission
    if (response.status === 403) {
      console.warn('Transactions collection not accessible. Returning empty array.');
      return [];
    }
    throw new Error('Failed to fetch transactions');
  }

  const data = await response.json();
  return data.data || [];
}

// Get WhatsApp groups
export async function getWhatsAppGroups(token: string, memberOnly: boolean = false) {
  const filter = memberOnly 
    ? { is_active: { _eq: true }, requires_membership: { _eq: true } }
    : { is_active: { _eq: true } };
  
  const query = new URLSearchParams({
    'filter': JSON.stringify(filter),
    'sort': 'name',
  }).toString();

  const response = await fetch(`${directusUrl}/items/whatsapp_groups?${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // If 403, the collection might not exist or user doesn't have permission
    if (response.status === 403) {
      console.warn('WhatsApp groups collection not accessible. Returning empty array.');
      return [];
    }
    throw new Error('Failed to fetch WhatsApp groups');
  }

  const data = await response.json();
  return data.data || [];
}
