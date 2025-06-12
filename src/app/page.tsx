import Navbar from '../components/navbar';
import Header from '../components/header';
import SamuCard from '@/components/card';

export default function Home() {
  return (
    <main>
      <div className="flex flex-col h-screen">
        <Navbar />
        <Header
          title="SALVE MUNDI"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
          className="rounded-lg"
        />
      </div>

      <div className="flex flex-row h-3/4 gap-5 px-10  items-center justify-center  bg-beige">
        <SamuCard
          description="Card 1 Description"
          image="/img/backgrounds/Kroto2025.jpg"
        />
        <SamuCard
          description="Card 2 Description"
          image="/img/backgrounds/Kroto2025.jpg"
        />
        <SamuCard
          description="Card 3 Description"
          image="/img/backgrounds/Kroto2025.jpg"
        />
      </div>
    </main>
  );
}
