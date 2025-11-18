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
      fields: ['id', 'name', 'event_date', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id', 'contact'],
      sort: ['-event_date']
      // Removed filter to allow fetching all events (past and future)
    });
    const events = await directusFetch<any[]>(`/items/events?${query}`);
    
    // For each event, fetch committee leader contact if no direct contact is provided
    const eventsWithContact = await Promise.all(
      events.map(async (event) => {
        if (!event.contact && event.committee_id) {
          try {
            // Fetch committee leader's contact info
            const leaderQuery = buildQueryString({
              filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
              fields: ['user_id.phone_number', 'user_id.first_name', 'user_id.last_name'],
              limit: 1
            });
            const leaders = await directusFetch<any[]>(`/items/committee_members?${leaderQuery}`);
            if (leaders && leaders.length > 0 && leaders[0].user_id?.phone_number) {
              event.contact_phone = leaders[0].user_id.phone_number;
              event.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
            }
          } catch (error) {
            console.warn(`Could not fetch committee leader for event ${event.id}`, error);
          }
        } else if (event.contact) {
          // Use the contact field from events table
          event.contact_phone = event.contact;
        }
        return event;
      })
    );
    
    return eventsWithContact;
  },
  getById: async (id: string) => {
    const query = buildQueryString({
      fields: ['id', 'name', 'event_date', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id', 'contact']
    });
    const event = await directusFetch<any>(`/items/events/${id}?${query}`);
    
    // Fetch committee leader contact if no direct contact is provided
    if (!event.contact && event.committee_id) {
      try {
        const leaderQuery = buildQueryString({
          filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
          fields: ['user_id.phone_number', 'user_id.first_name', 'user_id.last_name'],
          limit: 1
        });
        const leaders = await directusFetch<any[]>(`/items/committee_members?${leaderQuery}`);
        if (leaders && leaders.length > 0 && leaders[0].user_id?.phone_number) {
          event.contact_phone = leaders[0].user_id.phone_number;
          event.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
        }
      } catch (error) {
        console.warn(`Could not fetch committee leader for event ${event.id}`, error);
      }
    } else if (event.contact) {
      event.contact_phone = event.contact;
    }
    
    return event;
  },
  getByCommittee: async (committeeId: number) => {
    const query = buildQueryString({
      filter: { committee_id: { _eq: committeeId } },
      fields: ['id', 'name', 'event_date', 'description', 'price_members', 'price_non_members', 'image'],
      sort: ['-event_date']
    });
    return directusFetch<any[]>(`/items/events?${query}`);
  },
  createSignup: async (signupData: { event_id: number; email: string; name: string; student_number?: string; user_id?: string; event_name?: string; event_date?: string; event_price?: number }) => {
    // First check if user has already signed up for this event
    if (signupData.user_id) {
      const existingQuery = buildQueryString({
        filter: { 
          event_id: { _eq: signupData.event_id },
          directus_relations: { _eq: signupData.user_id }
        },
        fields: ['id']
      });
      
      const existingSignups = await directusFetch<any[]>(`/items/event_signups?${existingQuery}`);
      
      if (existingSignups && existingSignups.length > 0) {
        throw new Error('Je bent al ingeschreven voor deze activiteit');
      }
    }
    
    const payload: any = {
      event_id: signupData.event_id,
      directus_relations: signupData.user_id || null,
    };
    
    // Only add optional fields if they exist
    if (signupData.student_number) {
      payload.submission_file_url = signupData.student_number;
    }
    
    return directusFetch<any>(`/items/event_signups`, {
      method: 'POST',
      body: JSON.stringify(payload)
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
      
      return committeesWithMembers;
    } catch (error) {
      // If new fields don't exist, fall back to fetching without them
      const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,image,created_at,updated_at&sort=name`);
      
      // For each committee, fetch the full member details from junction table
      const committeesWithMembers = await Promise.all(
        committees.map(async (committee) => {
          const members = await directusFetch<any[]>(
            `/items/committee_members?filter[committee_id][_eq]=${committee.id}&fields=*,user_id.*`
          );
          return { ...committee, committee_members: members };
        })
      );
      
      return committeesWithMembers;
    }
  },
  getById: async (id: number) => {
    try {
      // Try to fetch with all fields including descriptions
      const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image,is_visible,short_description,description,created_at,updated_at`);
      
      // Always fetch member details from junction table
      const members = await directusFetch<any[]>(
        `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
      );
      committee.committee_members = members;
      
      return committee;
    } catch (error) {
      // If new fields don't exist, fall back to fetching without them
      const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image,created_at,updated_at`);
      
      const members = await directusFetch<any[]>(
        `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
      );
      committee.committee_members = members;
      
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
  },
  create: async (data: { name: string; email: string; association: string; amount_tickets: number }) => {
    return directusFetch<any>(`/items/pub_crawl_events`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
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

export const introSignupsApi = {
  create: async (data: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    date_of_birth: string;
    email: string;
    phone_number: string;
    favorite_gif?: string;
  }) => {
    return directusFetch<any>(`/items/intro_signups`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
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

