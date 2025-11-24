import { directusFetch } from './directus';
import { SiteSettings } from '../types';

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

    // For each event, fetch committee info and leader contact
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        // Fetch committee name if committee_id exists
        if (event.committee_id) {
          try {
            const committee = await directusFetch<any>(`/items/committees/${event.committee_id}?fields=id,name`);
            if (committee) {
              event.committee_name = committee.name;
            }
          } catch (error) {
            console.warn(`Could not fetch committee for event ${event.id}`, error);
          }
        }

        // Fetch committee leader contact if no direct contact is provided
        if (!event.contact && event.committee_id) {
          try {
            const leaderQuery = buildQueryString({
              filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
              fields: ['user_id.first_name', 'user_id.last_name'],
              limit: 1
            });
            const leaders = await directusFetch<any[]>(`/items/committee_members?${leaderQuery}`);
            if (leaders && leaders.length > 0) {
              // Do NOT expose committee leader phone numbers fetched from Directus users.
              // Only use the leader's name so UI can show who to contact without leaking phone numbers.
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

    return eventsWithDetails;
  },
  getById: async (id: string) => {
    const query = buildQueryString({
      fields: ['id', 'name', 'event_date', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id', 'contact']
    });
    const event = await directusFetch<any>(`/items/events/${id}?${query}`);

    // Fetch committee name if committee_id exists
    if (event.committee_id) {
      try {
        const committee = await directusFetch<any>(`/items/committees/${event.committee_id}?fields=id,name`);
        if (committee) {
          event.committee_name = committee.name;
        }
      } catch (error) {
        console.warn(`Could not fetch committee for event ${event.id}`, error);
      }
    }

    // Fetch committee leader contact if no direct contact is provided
    if (!event.contact && event.committee_id) {
      try {
        const leaderQuery = buildQueryString({
          filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
          fields: ['user_id.first_name', 'user_id.last_name'],
          limit: 1
        });
        const leaders = await directusFetch<any[]>(`/items/committee_members?${leaderQuery}`);
        if (leaders && leaders.length > 0) {
          // Do NOT expose committee leader phone numbers fetched from Directus users.
          // Only set the contact name; the phone number should not be copied from user profiles.
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
  createSignup: async (signupData: { event_id: number; email: string; name: string; phone_number?: string; user_id?: string; event_name?: string; event_date?: string; event_price?: number }) => {
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
      participant_name: signupData.name || null,
      participant_email: signupData.email || null,
      participant_phone: signupData.phone_number ?? null,
    };

    const signup = await directusFetch<any>(`/items/event_signups`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Generate and update QR token immediately after creation
    if (signup && signup.id) {
      try {
        const { generateQRToken, updateSignupWithQRToken } = await import('./qr-service');
        const qrToken = generateQRToken(signup.id, signupData.event_id);

        // Update the signup with QR token in database
        await updateSignupWithQRToken(signup.id, qrToken);

        // Add to returned object so caller has it immediately
        signup.qr_token = qrToken;
      } catch (error) {
        console.error('Failed to generate QR token:', error);
        // Don't fail the signup if QR generation fails
      }
    }

    return signup;
  }
};

export const committeesApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'name', 'image.id', 'is_visible', 'short_description', 'created_at', 'updated_at'],
      sort: ['name']
    });
    return directusFetch<any[]>(`/items/committees?${query}`);
  },
  getAllWithMembers: async () => {
    try {
      // Try to fetch with is_visible and description fields
      const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,image.id,is_visible,short_description,created_at,updated_at&sort=name`);

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
      const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,image.id,created_at,updated_at&sort=name`);

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
      const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image.id,is_visible,short_description,description,created_at,updated_at`);

      // Always fetch member details from junction table
      const members = await directusFetch<any[]>(
        `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
      );
      committee.committee_members = members;

      return committee;
    } catch (error) {
      // If new fields don't exist, fall back to fetching without them
      const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image.id,created_at,updated_at`);

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
      fields: ['id', 'name', 'email', 'association', 'amount_tickets', 'date', 'description', 'image', 'created_at', 'updated_at'],
      sort: ['-created_at']
    });
    return directusFetch<any[]>(`/items/pub_crawl_events?${query}`);
  }
};

export const pubCrawlSignupsApi = {
  getAll: async () => {
    const query = buildQueryString({
      fields: ['id', 'pub_crawl_event_id', 'name', 'email', 'association', 'amount_tickets', 'name_initials', 'created_at', 'updated_at'],
      sort: ['-created_at']
    });
    return directusFetch<any[]>(`/items/pub_crawl_signups?${query}`);
  },
  create: async (data: { name: string; email: string; association?: string; amount_tickets: number; pub_crawl_event_id: number; name_initials?: string }) => {
    // Prevent duplicate signups per event/email combo by updating the existing record
    const existingQuery = buildQueryString({
      filter: {
        pub_crawl_event_id: { _eq: data.pub_crawl_event_id },
        email: { _eq: data.email }
      },
      fields: ['id'],
      limit: 1
    });
    const existing = await directusFetch<any[]>(`/items/pub_crawl_signups?${existingQuery}`);
    if (existing && existing.length > 0) {
      return directusFetch<any>(`/items/pub_crawl_signups/${existing[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    }

    return directusFetch<any>(`/items/pub_crawl_signups`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
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

export const siteSettingsApi = {
  get: async (): Promise<SiteSettings | null> => {
    const query = buildQueryString({
      fields: ['id', 'show_intro', 'intro_disabled_message'],
      limit: 1
    });

    const data = await directusFetch<SiteSettings | SiteSettings[] | null>(`/items/site_settings?${query}`);
    if (Array.isArray(data)) {
      return data[0] || null;
    }
    return data ?? null;
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
    return '/img/placeholder.svg';
  }

  // Handle if imageId is an object (sometimes Directus returns file objects)
  let actualImageId: string;
  if (typeof imageId === 'object' && imageId !== null) {
    actualImageId = imageId.id || imageId.filename_disk || imageId.filename_download;
    if (!actualImageId) {
      // Only log errors, not info messages
      console.error('[getImageUrl] Could not extract image ID from object:', imageId);
      return '/img/placeholder.svg';
    }
  } else {
    actualImageId = String(imageId);
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

  // Use proxy when running on localhost (both dev and preview) to avoid CORS
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const baseUrl = isLocalhost
    ? '/api'  // Uses /api proxy
    : (import.meta.env.VITE_DIRECTUS_URL || '/api');
  // If token is falsy (missing or 'null'), omit the access_token query parameter so public files load.
  const cleanedToken = token && token !== 'null' && token !== 'undefined' ? token : null;
  const imageUrl = cleanedToken
    ? `${baseUrl}/assets/${actualImageId}?access_token=${cleanedToken}`
    : `${baseUrl}/assets/${actualImageId}`;

  return imageUrl;
}
