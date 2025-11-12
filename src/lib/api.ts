import { directusFetch } from './directus';

function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  if (params.fields) queryParams.append('fields', params.fields.join(','));
  if (params.sort) queryParams.append('sort', params.sort.join(','));
  if (params.filter) queryParams.append('filter', JSON.stringify(params.filter));
  if (params.limit) queryParams.append('limit', params.limit.toString());
  return queryParams.toString();
}

export const eventsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'event_date', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id'],
      sort: ['-event_date'],
      filter: { event_date: { _gte: new Date().toISOString().split('T')[0] } }
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
      fields: ['id', 'name', 'image', 'created_at', 'updated_at', 'members.id', 'members.member_id.id', 'members.member_id.first_name', 'members.member_id.last_name', 'members.member_id.picture', 'members.is_visible', 'members.is_leader']
    });
    return directusFetch<any>(`/items/committees/${id}?${query}`);
  }
};

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

export const boardApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'naam', 'image', 'members.id', 'members.member_id.id', 'members.member_id.first_name', 'members.member_id.last_name', 'members.member_id.picture', 'members.functie'],
      sort: ['naam']
    });
    return directusFetch<any[]>(`/items/Board?${query}`);
  }
};

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

export const pubCrawlEventsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'email', 'association', 'amount_tickets', 'name_initials', 'created_at'],
      sort: ['-created_at']
    });
    return directusFetch<any[]>(`/items/pub_crawl_events?${query}`);
  }
};

export const pubCrawlGroupsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['group_id', 'name', 'initials', 'pub_crawl_events_id'],
      sort: ['name']
    });
    return directusFetch<any[]>(`/items/pub_crawl_groups?${query}`);
  }
};

export const sponsorsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['sponsor_id', 'image', 'website_url'],
      sort: ['sponsor_id']
    });
    return directusFetch<any[]>(`/items/sponsors?${query}`);
  }
};

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

export const safeHavensApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'member_id.first_name', 'member_id.last_name', 'contact_name', 'phone_number', 'image', 'created_at'],
      sort: ['contact_name']
    });
    return directusFetch<any[]>(`/items/safe_havens?${query}`);
  }
};

export const stickersApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'date_created'],
      sort: ['-date_created']
    });
    return directusFetch<any[]>(`/items/Stickers?${query}`);
  }
};

export function getImageUrl(imageId: string | undefined | any): string {
  // Handle null/undefined
  if (!imageId) {
    console.log('[getImageUrl] No imageId provided, using default');
    return '/img/backgrounds/Kroto2025.jpg';
  }

  // Handle if imageId is an object (sometimes Directus returns file objects)
  let actualImageId: string;
  if (typeof imageId === 'object' && imageId !== null) {
    console.log('[getImageUrl] Image is an object:', imageId);
    actualImageId = imageId.id || imageId.filename_disk || imageId.filename_download;
    if (!actualImageId) {
      console.error('[getImageUrl] Could not extract image ID from object:', imageId);
      return '/img/backgrounds/Kroto2025.jpg';
    }
  } else {
    actualImageId = String(imageId);
  }

  // Use proxy when running on localhost (both dev and preview) to avoid CORS
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const baseUrl = isLocalhost
    ? '/api'  // Uses /api/assets proxy (no auth header, no CORS)
    : (import.meta.env.VITE_DIRECTUS_URL || '/api');

  // Add access token as query parameter for authenticated access
  const apiKey = import.meta.env.VITE_DIRECTUS_API_KEY || 'nEnHgseLaPzNgUQ0kCPQvjj2kFhA3kL3';
  const imageUrl = `${baseUrl}/assets/${actualImageId}?access_token=${apiKey}`;
  console.log('[getImageUrl] Generated URL:', imageUrl, 'for imageId:', actualImageId);
  return imageUrl;
}

