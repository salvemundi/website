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
      fields: ['id', 'member_id.first_name', 'member_id.last_name', 'contact_name', 'phone_number', 'image', 'created_at'],
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

// Helper to construct image URL
export function getImageUrl(imageId: string | undefined): string {
  if (!imageId) return '/img/backgrounds/Kroto2025.jpg';
  return `${directusUrl}/assets/${imageId}`;
}

