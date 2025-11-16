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
      sort: ['-event_date']
      // Removed filter to allow fetching all events (past and future)
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
  },
  createSignup: async (signupData: { event_id: number; email: string; name: string; student_number?: string }) => {
    return directusFetch<any>(`/items/event_signups`, {
      method: 'POST',
      body: JSON.stringify(signupData)
    });
  }
};

export const committeesApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'image', 'is_visible', 'short_description', 'created_at', 'updated_at'],
      sort: ['name']
    });
    return directusFetch<any[]>(`/items/committees?${query}`);
  },
  getAllWithMembers: async () => {
    try {
      // Try to fetch with is_visible and description fields
      const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,image,is_visible,short_description,created_at,updated_at&sort=name`);
      console.log('[committeesApi.getAllWithMembers] Committees:', committees);
      
      // Filter only visible committees (if is_visible field exists)
      const visibleCommittees = committees.filter(c => c.is_visible !== false);
      
      // For each committee, fetch the full member details from junction table
      const committeesWithMembers = await Promise.all(
        visibleCommittees.map(async (committee) => {
          // Always try to fetch members from junction table
          const members = await directusFetch<any[]>(
            `/items/committee_members?filter[committee_id][_eq]=${committee.id}&fields=*,user_id.*`
          );
          return { ...committee, committee_members: members };
        })
      );
      
      console.log('[committeesApi.getAllWithMembers] With members:', committeesWithMembers);
      return committeesWithMembers;
    } catch (error) {
      // If new fields don't exist, fall back to fetching without them
      console.log('[committeesApi.getAllWithMembers] Trying without optional fields:', error);
      const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,image,created_at,updated_at&sort=name`);
      console.log('[committeesApi.getAllWithMembers] Committees (fallback):', committees);
      
      // For each committee, fetch the full member details from junction table
      const committeesWithMembers = await Promise.all(
        committees.map(async (committee) => {
          const members = await directusFetch<any[]>(
            `/items/committee_members?filter[committee_id][_eq]=${committee.id}&fields=*,user_id.*`
          );
          return { ...committee, committee_members: members };
        })
      );
      
      console.log('[committeesApi.getAllWithMembers] With members (fallback):', committeesWithMembers);
      return committeesWithMembers;
    }
  },
  getById: async (id: number) => {
    try {
      // Try to fetch with all fields including descriptions
      const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image,is_visible,short_description,description,created_at,updated_at`);
      console.log('[committeesApi.getById] Committee:', committee);
      
      // Always fetch member details from junction table
      const members = await directusFetch<any[]>(
        `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
      );
      committee.committee_members = members;
      console.log('[committeesApi.getById] Committee members:', members);
      
      return committee;
    } catch (error) {
      // If new fields don't exist, fall back to fetching without them
      console.log('[committeesApi.getById] Trying without optional fields:', error);
      const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image,created_at,updated_at`);
      console.log('[committeesApi.getById] Committee (fallback):', committee);
      
      const members = await directusFetch<any[]>(
        `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
      );
      committee.committee_members = members;
      console.log('[committeesApi.getById] Committee members (fallback):', members);
      
      return committee;
    }
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
  // Handle null/undefined - silently return default
  if (!imageId) {
    return '/img/backgrounds/Kroto2025.jpg';
  }

  // Handle if imageId is an object (sometimes Directus returns file objects)
  let actualImageId: string;
  if (typeof imageId === 'object' && imageId !== null) {
    actualImageId = imageId.id || imageId.filename_disk || imageId.filename_download;
    if (!actualImageId) {
      // Only log errors, not info messages
      console.error('[getImageUrl] Could not extract image ID from object:', imageId);
      return '/img/backgrounds/Kroto2025.jpg';
    }
  } else {
    actualImageId = String(imageId);
  }

  // Use proxy when running on localhost (both dev and preview) to avoid CORS
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const baseUrl = isLocalhost
    ? '/api'  // Uses /api proxy
    : (import.meta.env.VITE_DIRECTUS_URL || '/api');

  // Try without access_token first - assets might be public
  // If this doesn't work, we need to configure Directus to make assets public
  const imageUrl = `${baseUrl}/assets/${actualImageId}`;
  return imageUrl;
}

