import Navbar from '../components/navbar';
import Header from '../components/header';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <Header
        title="SALVE MUNDI"
        backgroundImage="/img/backgrounds/Kroto2025.jpg"
        className="rounded-lg"
      />
    </div>
  );
}
