import { getSponsors } from '@/shared/api/salvemundi-server';
import SponsorsSectionClient from './SponsorsSectionClient';

export default async function SponsorsSection() {
    // Fetch data directly on the server during rendering
    // This uses the internal DIRECTUS_ADMIN_TOKEN and INTERNAL_DIRECTUS_URL
    const sponsors = await getSponsors();

    if (!sponsors || sponsors.length === 0) {
        return null;
    }

    return <SponsorsSectionClient sponsors={sponsors} />;
}
