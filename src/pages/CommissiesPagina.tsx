import React from "react";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import CommissieCard from "../components/CommissieCard";
import Footer from "../components/Footer";

export default function CommissiesPagina() {
  const commissies = [
    {
      title: "ICT Commissie",
      description: "De commissie die zich bezighoudt met alle IT-gerelateerde zaken binnen de vereniging.",
      slug: "ict-commissie",
      image: "/img/backgrounds/Kroto2025.jpg",
    },
    {
      title: "Studie Commissie",
      description: "regelt alles rondom studie gerelateerde zaken voor de leden.",
      slug: "studie-commissie",
      image: "/img/backgrounds/Kroto2025.jpg",
    },
    {
      title: "Reis Commissie",
      description: "De commissie die reizen en excursies voor de leden organiseert.",
      slug: "reis-commissie",
      image: "/img/backgrounds/Kroto2025.jpg",
    },
    {
      title: "Feest Commissie",
      description: "Zorgt voor de leukste feesten en evenementen binnen de vereniging.",
      slug: "feest-commissie",
      image: "/img/backgrounds/Kroto2025.jpg",
    },
    {
      title: "Activiteiten Commissie",
      description: "alle soorten activiteiten voor de leden organiseert.",
      slug: "activiteiten-commissie",
      image: "/img/backgrounds/Kroto2025.jpg",
    },
    {
      title: "Marketing Commissie",
      description: "regelt de leuke social posts en promoot de vereniging.",
      slug: "marketing-commissie",
      image: "/img/backgrounds/Kroto2025.jpg",
    },
  ];

  return (
    <>
      <div className="flex h-screen flex-col w-full">
        <Navbar activePage="Commissies" />
        <Header
          title="COMMISSIES"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
        />
      </div>

      <main className="bg-beige min-h-screen">
        {/* Commissies Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-10 py-16 bg-beige">
          {commissies.map((commissie, index) => (
            <CommissieCard
              key={index}
              title={commissie.title}
              description={commissie.description}
              buttonText="Meer Lezen"
              buttonLink={`/commissies/${commissie.slug}`}
              image={commissie.image}
            />
          ))}
        </div>

        <Footer />
      </main>
      <BackToTopButton />
    </>
  );
}
