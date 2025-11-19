import { directusFetch, directusUrl } from './directus';

// Build query string for Directus API
function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();

  if (params.fields) {
    queryParams.append('fields', params.fields.join(','));
  }
  if (params.sort) {
    queryParams.append('sort', params.sort.join(','));
  }
  if (params.filter) {
    queryParams.append('filter', JSON.stringify(params.filter));
  }
  if (params.limit) {
    queryParams.append('limit', params.limit.toString());
  }

  return queryParams.toString();
}

// Events API (activities)
export const eventsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'event_date', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id'],
      sort: ['-event_date'],
      filter: {
        event_date: { _gte: new Date().toISOString().split('T')[0] }
      }
    });
    return directusFetch<any[]>(`/items/events?${query}`);
  },

  getById: async (id: string) => {
    const query = buildQueryString({
      fields: ['id', 'name', 'event_date', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id']
    });
    return directusFetch<any>(`/items/events/${id}?${query}`);
  },

  getByCommittee: async (committeeId: number) => {
    const query = buildQueryString({
      filter: { committee_id: { _eq: committeeId } },
      fields: ['id', 'name', 'event_date', 'description', 'price_members', 'price_non_members', 'image'],
      sort: ['-event_date']
    });
    return directusFetch<any[]>(`/items/events?${query}`);
  }
};

// Committees API
export const committeesApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'image', 'created_at', 'updated_at'],
      sort: ['name']
    });
    return directusFetch<any[]>(`/items/committees?${query}`);
  },

  getById: async (id: number) => {
    const query = buildQueryString({
      fields: [
        'id',
        'name',
        'image',
        'created_at',
        'updated_at',
        'members.id',
        'members.member_id.id',
        'members.member_id.first_name',
        'members.member_id.last_name',
        'members.member_id.picture',
        'members.is_visible',
        'members.is_leader'
      ]
    });
    return directusFetch<any>(`/items/committees/${id}?${query}`);
  }
};

// Members API
export const membersApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'first_name', 'last_name', 'email', 'picture', 'is_current_student'],
      sort: ['last_name', 'first_name']
    });
    return directusFetch<any[]>(`/items/members?${query}`);
  },

  getById: async (id: number) => {
    const query = buildQueryString({
      fields: ['id', 'first_name', 'last_name', 'email', 'picture', 'phone_number', 'date_of_birth', 'is_current_student']
    });
    return directusFetch<any>(`/items/members/${id}?${query}`);
  }
};

// Board API
export const boardApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: [
        'id',
        'naam',
        'image',
        'members.id',
        'members.member_id.id',
        'members.member_id.first_name',
        'members.member_id.last_name',
        'members.member_id.picture',
        'members.functie'
      ],
      sort: ['naam']
    });
    return directusFetch<any[]>(`/items/Board?${query}`);
  }
};

// Clubs API
export const clubsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'description', 'image', 'whatsapp_link', 'discord_link', 'website_link'],
      sort: ['name']
    });
    return directusFetch<any[]>(`/items/clubs?${query}`);
  },

  getById: async (id: number) => {
    const query = buildQueryString({
      fields: ['id', 'name', 'description', 'image', 'whatsapp_link', 'discord_link', 'website_link', 'created_at']
    });
    return directusFetch<any>(`/items/clubs/${id}?${query}`);
  }
};

// Pub Crawl Events API
export const pubCrawlEventsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'email', 'association', 'amount_tickets', 'name_initials', 'created_at'],
      sort: ['-created_at']
    });
    return directusFetch<any[]>(`/items/pub_crawl_events?${query}`);
  }
};

// Pub Crawl Groups API
export const pubCrawlGroupsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['group_id', 'name', 'initials', 'pub_crawl_events_id'],
      sort: ['name']
    });
    return directusFetch<any[]>(`/items/pub_crawl_groups?${query}`);
  }
};

// Sponsors API
export const sponsorsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['sponsor_id', 'image', 'website_url'],
      sort: ['sponsor_id']
    });
    return directusFetch<any[]>(`/items/sponsors?${query}`);
  }
};

// Jobs API
export const jobsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['job_id', 'name', 'description', 'pay', 'location', 'skills', 'profile_description', 'created_at'],
      sort: ['-created_at']
    });
    return directusFetch<any[]>(`/items/jobs?${query}`);
  },

  getById: async (id: number) => {
    const query = buildQueryString({
      fields: ['job_id', 'name', 'description', 'pay', 'location', 'skills', 'profile_description', 'created_at']
    });
    return directusFetch<any>(`/items/jobs/${id}?${query}`);
  }
};

// Safe Havens API
export const safeHavensApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'member_id.first_name', 'member_id.last_name', 'contact_name', 'email', 'phone_number', 'image', 'created_at'],
      sort: ['contact_name']
    });
    return directusFetch<any[]>(`/items/safe_havens?${query}`);
  }
};

// Stickers API
export const stickersApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'date_created'],
      sort: ['-date_created']
    });
    return directusFetch<any[]>(`/items/Stickers?${query}`);
  }
};

// Contacts API
export const contactsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'title', 'name', 'email', 'phone_number', 'description', 'image', 'display_order'],
      filter: { is_active: { _eq: true } },
      sort: ['display_order', 'name']
    });
    
    // Try to use auth token if available, otherwise use public API key
    const authToken = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      // Fallback to API key for public access
      const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl'}/items/contacts?${query}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch contacts: ${response.status}`);
    }
    
    const json = await response.json();
    return json.data as any[];
  }
};

// Documents API
export const documentsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'title', 'description', 'file', 'category', 'display_order'],
      filter: { is_active: { _eq: true } },
      sort: ['display_order', 'title']
    });
    return directusFetch<any[]>(`/items/documents?${query}`);
  }
};

// Helper to construct image URL
export function getImageUrl(imageId: string | undefined): string {
  if (!imageId) return '/img/backgrounds/Kroto2025.jpg';
  
  // If imageId looks like a full URL, return as-is
  if (typeof imageId === 'string' && (imageId.startsWith('http://') || imageId.startsWith('https://'))) {
    return imageId;
  }
  
  // Get the access token from localStorage for authenticated requests
  let token: string | null = null;
  try {
    // The token is stored as 'auth_token' not 'access_token'
    token = localStorage.getItem('auth_token');
  } catch (e) {
    console.warn('getImageUrl: Could not access localStorage', e);
  }
  
  // If no user token, try to use API key for public access
  if (!token) {
    const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY;
    token = apiKey;
  }
  
  // Directus v10+ uses /assets/ for serving files
  // Add access_token as query parameter for authentication
  const imageUrl = `${directusUrl}/assets/${imageId}?access_token=${token}`;
  
  return imageUrl;
}

