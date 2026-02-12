import { getCombinedSiteSettings } from "@/shared/api/salvemundi-server";
import Header from "./Header";

export default async function HeaderWrapper() {
    // Fetch all required site settings in one server-side request
    const settings = await getCombinedSiteSettings(['intro', 'kroegentocht', 'reis']);

    return <Header initialSettings={settings} />;
}
