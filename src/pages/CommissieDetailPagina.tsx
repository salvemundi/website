import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import Footer from "../components/Footer";

interface Event {
  title: string;
  date: string;
  description: string;
}

interface TeamMember {
  name: string;
  role?: string;
  image: string;
}

interface CommissieData {
  name: string;
  description: string;
  aboutText: string;
  aboutImage: string;
  teamMembers: TeamMember[];
  events: Event[];
}

const commissiesData: { [key: string]: CommissieData } = {
  "ict-commissie": {
    name: "ICT COMISSIE",
    description: "De ICT Commissie beheert de technische infrastructuur van Salve Mundi",
    aboutText:
      "Salve Mundi is de studievereniging van Fontys ICT, opgericht in 2017. De naam, Latijn voor \"Hello World\", is een welbekende code die elke programmeur in zijn hart draagt! 💻🌍\n\nBij Salve Mundi draait alles om plezier, leren en het verbinden van studenten. Van studie-gerelateerde activiteiten tot gewoon een gezellige tijd met vrienden, wij organiseren het allemaal! 🎉📚\nDenk aan:",
    aboutImage: "/img/backgrounds/Kroto2025.jpg",
    teamMembers: [
      { name: "Member 1", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 2", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 3", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 4", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 5", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 6", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 7", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 8", image: "/img/backgrounds/Kroto2025.jpg" },
    ],
    events: [
      {
        title: "Software Tools",
        date: "21-5-2025",
        description:
          "De ICT Commissie heeft nieuwe softwaretools geïmplementeerd om de samenwerking tussen studenten en docenten te verbeteren. Ook zijn er workshops gepland om digitale vaardigheden van studenten te versterken. Houd onze nieuwsfeed in de gaten voor meer info. Wij moedigen iedereen aan om deel te nemen en feedback te geven.",
      },
      {
        title: "Digitale Tools",
        date: "15-6-2025",
        description:
          "De ICT Commissie heeft recent innovatieve digitale tools geïntroduceerd om de interactie tussen studenten en docenten te optimaliseren. Daarnaast zijn er diverse workshops ingepland om de digitale vaardigheden van studenten verder te ontwikkelen. Hou onze nieuwsfeed voor meer updates! Wij nodigen iedereen uit om deel te nemen en hun ervaringen te delen.",
      },
      {
        title: "Online Leerplatform",
        date: "30-7-2025",
        description:
          "De ICT Commissie heeft een nieuw online leerplatform gelanceerd dat de toegang tot leermaterialen vergankelijkt maakt. Hier kunnen studenten trainingen en docenten te helpen het platform optimaal te benutten. Volg onze nieuwsfeed voor meer informatie en tips! Wij verwelkomen alle input en suggesties.",
      },
      {
        title: "E-learning Initiatieven",
        date: "10-8-2025",
        description:
          "De ICT Commissie introduceert nieuwe e-learning initiatieven gericht op gepersonaliseerd leren en het gebruik van multimedia in het onderwijs. We organiseren webinars waarin experts hun inzichten delen over de toekomst van digitaal leren. Blijf op de hoogte via onze nieuwsfeed en neem deel aan de gesprekken! Jouw mening is waardevol voor ons.",
      },
    ],
  },
  "studie-commissie": {
    name: "STUDIE COMMISSIE",
    description: "De Studie Commissie organiseert studiegerichte activiteiten",
    aboutText:
      "Salve Mundi is de studievereniging van Fontys ICT, opgericht in 2017. De naam, Latijn voor \"Hello World\", is een welbekende code die elke programmeur in zijn hart draagt! 💻🌍\n\nBij Salve Mundi draait alles om plezier, leren en het verbinden van studenten. Van studie-gerelateerde activiteiten tot gewoon een gezellige tijd met vrienden, wij organiseren het allemaal! 🎉📚\nDenk aan:",
    aboutImage: "/img/backgrounds/Kroto2025.jpg",
    teamMembers: [
      { name: "Member 1", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 2", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 3", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 4", image: "/img/backgrounds/Kroto2025.jpg" },
    ],
    events: [
      {
        title: "Tentamen Training",
        date: "15-5-2025",
        description:
          "De Studie Commissie organiseert tentamen trainingen om studenten voor te bereiden op hun examens. Kom langs en oefen samen!",
      },
      {
        title: "Studiemiddagen",
        date: "20-6-2025",
        description:
          "Elke week organiseren wij studiemiddagen waar je samen met medestudenten kunt leren in een gezellige omgeving.",
      },
    ],
  },
  "reis-commissie": {
    name: "REIS COMMISSIE",
    description: "De Reis Commissie organiseert studiereizen en uitstapjes",
    aboutText:
      "Salve Mundi is de studievereniging van Fontys ICT, opgericht in 2017. De naam, Latijn voor \"Hello World\", is een welbekende code die elke programmeur in zijn hart draagt! 💻🌍\n\nBij Salve Mundi draait alles om plezier, leren en het verbinden van studenten. Van studie-gerelateerde activiteiten tot gewoon een gezellige tijd met vrienden, wij organiseren het allemaal! 🎉📚\nDenk aan:",
    aboutImage: "/img/backgrounds/Kroto2025.jpg",
    teamMembers: [
      { name: "Member 1", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 2", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 3", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 4", image: "/img/backgrounds/Kroto2025.jpg" },
    ],
    events: [
      {
        title: "Stedentrip Barcelona",
        date: "10-9-2025",
        description:
          "Plan een onvergetelijke reis naar Barcelona! Ontdek de cultuur, architectuur en het nachtleven van deze prachtige stad.",
      },
    ],
  },
  "feest-commissie": {
    name: "FEEST COMMISSIE",
    description: "De Feest Commissie organiseert feesten en borrels",
    aboutText:
      "Salve Mundi is de studievereniging van Fontys ICT, opgericht in 2017. De naam, Latijn voor \"Hello World\", is een welbekende code die elke programmeur in zijn hart draagt! 💻🌍\n\nBij Salve Mundi draait alles om plezier, leren en het verbinden van studenten. Van studie-gerelateerde activiteiten tot gewoon een gezellige tijd met vrienden, wij organiseren het allemaal! 🎉📚\nDenk aan:",
    aboutImage: "/img/backgrounds/Kroto2025.jpg",
    teamMembers: [
      { name: "Member 1", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 2", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 3", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 4", image: "/img/backgrounds/Kroto2025.jpg" },
    ],
    events: [
      {
        title: "Zomerfeest",
        date: "25-6-2025",
        description:
          "Vier het einde van het semester met ons grote zomerfeest! Muziek, drankjes en gezelligheid gegarandeerd.",
      },
    ],
  },
  "activiteiten-commissie": {
    name: "ACTIVITEITEN COMMISSIE",
    description: "De Activiteiten Commissie organiseert diverse activiteiten",
    aboutText:
      "Salve Mundi is de studievereniging van Fontys ICT, opgericht in 2017. De naam, Latijn voor \"Hello World\", is een welbekende code die elke programmeur in zijn hart draagt! 💻🌍\n\nBij Salve Mundi draait alles om plezier, leren en het verbinden van studenten. Van studie-gerelateerde activiteiten tot gewoon een gezellige tijd met vrienden, wij organiseren het allemaal! 🎉📚\nDenk aan:",
    aboutImage: "/img/backgrounds/Kroto2025.jpg",
    teamMembers: [
      { name: "Member 1", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 2", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 3", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 4", image: "/img/backgrounds/Kroto2025.jpg" },
    ],
    events: [
      {
        title: "Lasergamen",
        date: "5-7-2025",
        description:
          "Kom lasergamen met de Activiteiten Commissie! Een avond vol actie en teamwerk.",
      },
    ],
  },
  "marketing-commissie": {
    name: "MARKETING COMMISSIE",
    description: "De Marketing Commissie zorgt voor de promotie van Salve Mundi",
    aboutText:
      "Salve Mundi is de studievereniging van Fontys ICT, opgericht in 2017. De naam, Latijn voor \"Hello World\", is een welbekende code die elke programmeur in zijn hart draagt! 💻🌍\n\nBij Salve Mundi draait alles om plezier, leren en het verbinden van studenten. Van studie-gerelateerde activiteiten tot gewoon een gezellige tijd met vrienden, wij organiseren het allemaal! 🎉📚\nDenk aan:",
    aboutImage: "/img/backgrounds/Kroto2025.jpg",
    teamMembers: [
      { name: "Member 1", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 2", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 3", image: "/img/backgrounds/Kroto2025.jpg" },
      { name: "Member 4", image: "/img/backgrounds/Kroto2025.jpg" },
    ],
    events: [
      {
        title: "Social Media Campagne",
        date: "1-6-2025",
        description:
          "De Marketing Commissie lanceert een nieuwe social media campagne om meer studenten te bereiken.",
      },
    ],
  },
};

export default function CommissieDetailPagina() {
  const { slug } = useParams<{ slug: string }>();
  const commissie = slug ? commissiesData[slug] : null;

  if (!commissie) {
    return (
      <>
        <Navbar activePage="Commissies" />
        <div className="min-h-screen bg-beige flex items-center justify-center">
          <h1 className="text-4xl font-bold text-paars">Commissie niet gevonden</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col w-full">
        <Navbar activePage="Commissies" />
        <Header
          title={commissie.name}
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
        />
      </div>

      <main className="bg-beige min-h-screen">
        {/* Over Ons Section */}
        <section className="px-10 py-16">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Text Content */}
            <div className="flex-1">
              <h2 className="text-oranje text-4xl font-bold mb-6">OVER ONS</h2>
              <div className="text-lg space-y-4">
                <p>
                  <span className="font-bold text-oranje">Salve Mundi</span> is de
                  studievereniging van Fontys ICT, opgericht in 2017. De naam, Latijn
                  voor{" "}
                  <span className="font-bold text-oranje">"Hello World"</span>, is
                  een welbekende code die elke programmeur in zijn hart draagt! 💻🌍
                </p>
                <p>
                  Bij Salve Mundi draait alles om{" "}
                  <span className="font-bold text-oranje">plezier</span>,{" "}
                  <span className="font-bold text-oranje">leren</span> en het{" "}
                  <span className="font-bold text-oranje">verbinden</span> van
                  studenten. Van studie-gerelateerde activiteiten tot gewoon een
                  gezellige tijd met vrienden, wij organiseren het allemaal! 🎉📚
                  Denk aan:
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1">
              <img
                src={commissie.aboutImage}
                alt="Over ons"
                className="w-full h-auto rounded-3xl shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Main Content Grid - Events and Team Members */}
        <section className="px-10 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Events */}
            <div className="space-y-6">
              {commissie.events.length > 0 ? (
                commissie.events.map((event, index) => (
                  <div
                    key={index}
                    className="bg-paars rounded-3xl p-6 text-beige shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-geel text-2xl font-bold">{event.title}</h3>
                      <span className="text-geel text-xl font-bold">
                        {event.date}
                      </span>
                    </div>
                    <p className="text-base leading-relaxed">{event.description}</p>
                  </div>
                ))
              ) : (
                <div className="bg-paars rounded-3xl p-6 text-beige shadow-lg">
                  <p className="text-center text-lg">Geen events beschikbaar</p>
                </div>
              )}
            </div>

            {/* Right Column - Team Members */}
            <div>
              <h2 className="text-geel text-4xl font-bold mb-6">LEDEN</h2>
              <div className="grid grid-cols-2 gap-6">
                {commissie.teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-paars rounded-3xl overflow-hidden shadow-lg"
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-64 object-cover"
                    />
                    {member.name && (
                      <div className="p-4 text-center">
                        <h4 className="text-beige font-bold">{member.name}</h4>
                        {member.role && (
                          <p className="text-geel text-sm">{member.role}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
      <BackToTopButton />
    </>
  );
}
