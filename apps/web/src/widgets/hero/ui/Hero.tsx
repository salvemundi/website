import { getHeroBanners } from '@/shared/api/salvemundi-server';
import HeroClient from './HeroClient';

export default async function Hero() {
    const heroBanners = await getHeroBanners();

    return <HeroClient heroBanners={heroBanners} />;
}
