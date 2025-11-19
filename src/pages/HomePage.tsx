// src/pages/Home.tsx
import React from "react";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import SamuCard from "../components/JoinCard";
import Footer from "../components/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
} from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Home() {
  return (
    <>
      <main>
    <div className="flex flex-col min-h-[60vh] lg:min-h-screen">
          <Navbar activePage="Home" />
          <Header
            title="SALVE MUNDI"
            backgroundImage=" /img/backgrounds/homepage-banner.jpg"
            className=""
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-4 sm:px-6 lg:px-10 py-10 bg-beige">
          <SamuCard
            description="Word lid van Salve Mundi en ontdek de wereld van ICT! Sluit je aan bij onze exclusieve activiteiten en mis niets!"
            image="/img/backgrounds/Kroto2025.jpg"
            button="WORD LID"
            link="https://www.salmundi.nl/lid-worden"
          />
          <SamuCard
            description="Doe mee aan onze geweldige introweek! Een week vol spannende activiteiten en onvergetelijke ervaringen."
            image="/img/backgrounds/Kroto2025.jpg"
            button="INTRO WEEK"
            link="https://www.salmundi.nl/intro"
          />
          <SamuCard
            description="Wil je deelnemen aan de volgende activiteit? Meld je dan nu aan en zorg ervoor dat je niets mist van deze."
            image="/img/backgrounds/Kroto2025.jpg"
            button="ACTIVITEITEN"
            link="https://www.salmundi.nl/activiteiten"
          />
        </div>

        {/* About section with swiper */}
        <section className="flex flex-col-reverse lg:flex-row justify-between gap-10 px-4 sm:px-6 lg:px-10 py-10">
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <h1 className="text-4xl text-oranje font-bold mb-4">
              OVER SALVE MUNDI
            </h1>
            <p className="text-xl">
              Salve Mundi is de studievereniging van{" "}
              <span className="text-oranje font-bold">
                <a href="https://fontys.nl">Hogeschool Fontys ICT</a>
              </span>{" "}
              in{" "}
              <span className="text-oranje font-bold">
                <a href="https://www.eindhoven.nl" target="_blank">
                  Eindhoven
                </a>
              </span>
              , opgericht in 2017. De naam, Latijn voor &quot;Hello World&quot;,
              is een welbekende code die elke programmeur in zijn hart draagt!
              <br /> <br />
            </p>
            <p className="text-xl">
              💻🌍 Bij Salve Mundi draait alles om plezier, leren en het
              verbinden van studenten. Van studie-gerelateerde activiteiten tot
              gewoon een gezellige tijd met vrienden, wij organiseren het
              allemaal! 🎉📚
            </p>
          </div>

          <div className="flex-1 h-full w-full max-w-2xl mx-auto lg:mx-0">
            <Swiper
              modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
              spaceBetween={30}
              speed={900}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="h-8/12 rounded-3xl overflow-hidden"
            >
              {["Slide 1", "Slide 2", "Slide 3"].map((alt, idx) => (
                <SwiperSlide key={idx}>
                  <img
                    src="/img/backgrounds/Kroto2025.jpg"
                    alt={alt}
                    width={700}
                    height={700}
                    className="object-cover w-full h-full"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* Contact */}
        <div className="flex items-center justify-center w-full px-4">
          <h2 className="text-oranje font-black text-4xl">
            Kom in contact met Salve Mundi
          </h2>
        </div>
        <section className="flex flex-col lg:flex-row justify-center items-stretch m-6 sm:m-10 p-6 sm:p-10 gap-10 rounded-3xl bg-paars">
          <div className="w-full text-start">
            <h1 className="text-3xl font-bold text-geel ">CONTACT</h1>
            <p className="text-xl mt-4 text-beige">
              Heb jij een vraag voor ons of wil je voor iets anders met ons in
              contact komen? Dat kan! Je kan ons bereiken op de volgende
              gegevens: <br />
              <strong>Adres:</strong> Rachelsmolen 1, 5612MA Eindhoven, Lokaal
              R10 2.17 <br />
              <strong>E-mail:</strong> info@salvemundi.nl
            </p>
          </div>

          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2486.3762423950466!2d5.477010676986035!3d51.4512482148034!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6d9a14c2598a7%3A0x749672e4952620b8!2sSalve%20Mundi!5e0!3m2!1sen!2sfr!4v1749761290183!5m2!1sen!2sfr"
            className="w-full h-72 sm:h-96 rounded-3xl border-none"
            loading="lazy"
          />
        </section>

        {/* Partners */}
        <div className="flex items-center justify-center w-full px-4">
          <h2 className="text-oranje font-black text-4xl">Partners</h2>
        </div>

        <Footer />
      </main>
      <BackToTopButton />
    </>
  );
}
