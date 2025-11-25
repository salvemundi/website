import { directusFetch, directusUrl } from './directus';
import { User, SignupData } from '../contexts/AuthContext';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires: number;
  user: User;
}

async function mapDirectusUserToUser(rawUser: any): Promise<User> {
  if (!rawUser || !rawUser.id) {
    throw new Error('Invalid user data received from Directus');
  }

  // Determine membership exclusively from the user record in Directus.
  // Priority:
  // 1. Use explicit `membership_status` if present ('active'|'expired'|'none')
  // 2. If not present, use `membership_expiry` to infer active/expired
  // 3. Fallback to heuristics (entra_id or fontys_email) to consider user active
  let membershipStatus: 'active' | 'expired' | 'none' = 'none';
  let isMember = false;

  if (
    rawUser.membership_status === 'active' ||
    rawUser.membership_status === 'expired' ||
    rawUser.membership_status === 'none'
  ) {
    membershipStatus = rawUser.membership_status;
    isMember = membershipStatus === 'active';
  } else if (rawUser.membership_expiry) {
    try {
      const expiry = new Date(rawUser.membership_expiry);
      if (!isNaN(expiry.getTime()) && expiry > new Date()) {
        membershipStatus = 'active';
        isMember = true;
      } else {
        membershipStatus = 'expired';
        isMember = false;
      }
    } catch (e) {
      membershipStatus = 'none';
      isMember = false;
    }
  } else {
    const fallbackMember = !!(rawUser.entra_id || rawUser.fontys_email);
    isMember = fallbackMember;
    membershipStatus = fallbackMember ? 'active' : 'none';
  }

  return {
    id: rawUser.id,
    email: rawUser.email || '',
    first_name: rawUser.first_name || '',
    last_name: rawUser.last_name || '',
    entra_id: rawUser.entra_id,
    fontys_email: rawUser.fontys_email,
    phone_number: rawUser.phone_number,
    // Normalize avatar to a file id string when Directus returns an object
    avatar: rawUser?.avatar && typeof rawUser.avatar === 'object' && 'id' in rawUser.avatar ? rawUser.avatar.id : rawUser.avatar,
    is_member: isMember,
    member_id: undefined,
    membership_status: membershipStatus,
    membership_expiry: rawUser.membership_expiry,
    minecraft_username: rawUser.minecraft_username,
  };
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
      }),
    });
    
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
    
    // Directus wraps the response in a 'data' object
    const authData = data.data || data;
    
    // Try to use user data from login response first, fallback to fetching
    let userDetails: User;
    
    if (authData.user && authData.user.id) {
      // Use user data from login response enriched with membership info
      userDetails = await mapDirectusUserToUser(authData.user);
    } else {
      // Fallback: Fetch user details
      const fetched = await fetchUserDetails(authData.access_token);
      if (!fetched) {
        throw new Error('Failed to fetch user details after login');
      }
      userDetails = fetched;
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

    const raw = await response.json();

    // Support multiple shapes: { access_token, ... } OR { data: { access_token, ... } } OR { data: { data: { ... } } }
    const payload = raw?.data?.data || raw?.data || raw;

    // Validate we actually received an access token
    if (!payload || !payload.access_token) {
      console.error('Entra login returned unexpected payload:', raw);
      throw new Error('Microsoft login failed: no access token returned from backend');
    }

    let enrichedUser: User | null = null;
    try {
      enrichedUser = await fetchUserDetails(payload.access_token);
    } catch (error) {
      console.warn('Failed to refresh user details after Entra login. Falling back to response payload.', error);
    }

    const userDetails = enrichedUser
      ? enrichedUser
      : await mapDirectusUserToUser(payload.user || payload);

    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires: payload.expires,
      user: userDetails,
    };
  } catch (error) {
    console.error('Entra ID login error:', error);
    throw error;
  }
}

// Signup for non-members
export async function signupWithPassword(userData: SignupData): Promise<LoginResponse> {
  try {
    const roleId = import.meta.env.VITE_DEFAULT_USER_ROLE_ID;
    
    // Create the Directus user directly
    await directusFetch<any>('/users', {
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
    
    // Now login with the new credentials
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
export async function fetchUserDetails(token: string): Promise<User | null> {
  try {
    // Fetch with * to get all available fields
    const response = await fetch(`${directusUrl}/users/me?fields=*`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Try to parse JSON error payload
      let payload: any;
      try {
        payload = await response.json();
      } catch (e) {
        payload = await response.text();
      }

      console.error('❌ Failed to fetch user details:', payload);

      // Treat common invalid/expired token indicators as an expired session.
      const errorCode = payload?.errors?.[0]?.extensions?.code || payload?.errors?.[0]?.extensions?.code || payload?.code;
      const status = response.status;

      if (
        status === 401 ||
        status === 403 ||
        errorCode === 'TOKEN_EXPIRED' ||
        errorCode === 'INVALID_TOKEN' ||
        (typeof payload === 'string' && /invalid token/i.test(payload))
      ) {
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        } catch (e) {
          // ignore
        }

        try {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        } catch (e) {
          // ignore
        }

        return null;
      }

      throw new Error('Failed to fetch user details');
    }

    const userData = await response.json();
    // Directus usually wraps payload in { data: { ... } }
    const user = userData?.data || userData;

    return await mapDirectusUserToUser(user);
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
    if (!userDetails) {
      throw new Error('Failed to fetch user details after token refresh');
    }

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
    'fields': 'id,event_id.id,event_id.name,event_id.event_date,event_id.image,event_id.description,event_id.contact,event_id.committee_id,created_at',
    'sort': '-created_at',
  }).toString();
  
  const signups = await directusFetch<any[]>(`/items/event_signups?${query}`);
  
  // For each signup, fetch committee leader contact if no direct contact is provided
  const signupsWithContact = await Promise.all(
    signups.map(async (signup) => {
      if (signup.event_id && !signup.event_id.contact && signup.event_id.committee_id) {
        try {
          // Fetch committee leader's contact info
          const leaderQuery = new URLSearchParams({
            'filter[committee_id][_eq]': signup.event_id.committee_id.toString(),
            'filter[is_leader][_eq]': 'true',
            'fields': 'user_id.first_name,user_id.last_name',
            'limit': '1'
          }).toString();
          
          const leaders = await directusFetch<any[]>(`/items/committee_members?${leaderQuery}`);
          if (leaders && leaders.length > 0) {
            // Do NOT copy phone numbers from Directus user profiles into the event data.
            // Only set the contact name so the UI can show who to contact without exposing phone numbers.
            signup.event_id.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
          }
        } catch (error) {
          console.warn(`Could not fetch committee leader for event ${signup.event_id.id}`, error);
        }
      } else if (signup.event_id?.contact) {
        signup.event_id.contact_phone = signup.event_id.contact;
      }
      return signup;
    })
  );
  
  return signupsWithContact;
}

// Create event signup
export async function createEventSignup(eventId: number, userId: string, submissionFileUrl?: string) {
  // First check if user has already signed up for this event
  const existingQuery = new URLSearchParams({
    'filter[event_id][_eq]': eventId.toString(),
    'filter[directus_relations][_eq]': userId,
    'fields': 'id',
  }).toString();
  
  const existingSignups = await directusFetch<any[]>(`/items/event_signups?${existingQuery}`);
  
  if (existingSignups && existingSignups.length > 0) {
    throw new Error('Je bent al ingeschreven voor deze activiteit');
  }
  
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
