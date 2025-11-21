// src/pages/Home.tsx
import React, { useRef } from "react";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import SamuCard from "../components/JoinCard";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
} from "swiper/modules";
import { ArrowRight, CalendarRange, MapPin, Users } from "lucide-react";
import { useSiteSettings, useSponsors } from "../hooks/useApi";
import { getImageUrl } from "../lib/api";
import useHomeScrollAnimations from "../hooks/useHomeScrollAnimations";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Home() {
  const {
    data: sponsors = [],
    isLoading: isSponsorsLoading,
    error: sponsorsError,
  } = useSponsors();
  const { data: siteSettings } = useSiteSettings();
  const introEnabled = siteSettings?.show_intro ?? true;
  const pageRef = useRef<HTMLElement | null>(null);

  useHomeScrollAnimations(pageRef);

  return (
    <>
      <main ref={pageRef} className="bg-beige text-samu">
        <section className="relative overflow-hidden">
          <div className="absolute -left-10 top-12 h-40 w-40 bg-geel/30 blur-3xl lg:hidden" aria-hidden="true" />
          <div className="absolute -right-10 top-0 h-52 w-52 bg-oranje/25 blur-3xl lg:hidden" aria-hidden="true" />
          <div className="absolute left-10 bottom-0 h-40 w-56 bg-paars/25 blur-3xl lg:hidden" aria-hidden="true" />

          <div className="relative flex flex-col">
            <div className="px-2 sm:px-6 pb-8">
              <Header
                title="SALVE MUNDI"
                backgroundImage="/img/backgrounds/homepage-banner.jpg"
              >
                <div className="lg:hidden" data-scroll-fade>
                  <p className="mt-4 max-w-2xl text-center text-lg sm:text-xl text-beige">
                    Dé studievereniging voor Fontys ICT. Samen ontdekken we nieuwe technologie, bouwen we community en maken we impact op én buiten de campus.
                  </p>
                  <div className="mt-6 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <a
                      href="/inschrijven"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-geel px-5 py-3 text-lg font-bold text-samu transition hover:-translate-y-0.5 hover:bg-yellow-400 sm:w-auto"
                    >
                      Word lid
                      <ArrowRight className="h-5 w-5" />
                    </a>
                    <a
                      href="/activiteiten"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-beige/30 bg-beige/10 px-5 py-3 text-base font-semibold text-beige transition hover:-translate-y-0.5 hover:border-beige/50 sm:w-auto"
                    >
                      Bekijk activiteiten
                    </a>
                  </div>
                  <div className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-beige/25 bg-beige/10 px-3 py-3 backdrop-blur">
                      <Users className="h-5 w-5 text-geel" />
                      <div className="leading-tight">
                        <p className="text-[11px] uppercase tracking-wide text-beige/80">Community</p>
                        <p className="text-sm font-semibold text-beige">Voor en door ICT-studenten</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-beige/25 bg-beige/10 px-3 py-3 backdrop-blur">
                      <CalendarRange className="h-5 w-5 text-geel" />
                      <div className="leading-tight">
                        <p className="text-[11px] uppercase tracking-wide text-beige/80">Events</p>
                        <p className="text-sm font-semibold text-beige">Workshops, borrels & trips</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 rounded-2xl border border-beige/25 bg-beige/10 px-3 py-3 backdrop-blur sm:col-span-1">
                      <MapPin className="h-5 w-5 text-geel" />
                      <div className="leading-tight">
                        <p className="text-[11px] uppercase tracking-wide text-beige/80">Locatie</p>
                        <p className="text-sm font-semibold text-beige">Rachelsmolen, Eindhoven</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Header>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="bg-beige px-4 sm:px-6 lg:px-10 py-10">
          <div className="mb-6 flex items-center justify-between gap-3" data-scroll-fade>
            <div>
              <p className="text-sm uppercase tracking-wide text-oranje/80">Snel aan de slag</p>
              <h2 className="text-3xl font-bold text-samu">Kies je volgende stap</h2>
            </div>
          </div>
          <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
            <div className="min-w-[260px] max-w-[320px] snap-start md:min-w-0 md:max-w-none">
              <SamuCard
                description="Word lid van Salve Mundi en ontdek de wereld van ICT. Pak exclusieve events, borrels en trips mee."
                image="/img/backgrounds/Kroto2025.jpg"
                button="WORD LID"
                link="/inschrijven"
              />
            </div>
            {introEnabled && (
              <div className="min-w-[260px] max-w-[320px] snap-start md:min-w-0 md:max-w-none">
                <SamuCard
                  description="Doe mee aan de introweek: de snelste manier om nieuwe mensen, de stad en de vereniging te leren kennen."
                  image="/img/backgrounds/Kroto2025.jpg"
                  button="INTRO WEEK"
                  link="/intro"
                />
              </div>
            )}
            <div className="min-w-[260px] max-w-[320px] snap-start md:min-w-0 md:max-w-none">
              <SamuCard
                description="Plan je week met onze agenda. Meld je aan voor de volgende activiteit en blijf op de hoogte."
                image="/img/backgrounds/Kroto2025.jpg"
                button="ACTIVITEITEN"
                link="/activiteiten"
              />
            </div>
          </div>
        </section>

        {/* About section with swiper */}
        <section className="px-4 sm:px-6 lg:px-10 pb-12">
          <div className="flex flex-col-reverse items-center gap-10 rounded-3xl border border-samu/5 bg-white/80 p-6 shadow-xl backdrop-blur lg:flex-row lg:justify-between lg:p-10">
            <div className="flex flex-1 flex-col justify-center space-y-4" data-scroll-fade>
              <h1 className="text-3xl font-bold text-oranje sm:text-4xl">
                OVER SALVE MUNDI
              </h1>
              <p className="text-base leading-relaxed sm:text-lg">
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
                is een welbekende code die elke programmeur in zijn hart draagt.
              </p>
              <p className="text-base leading-relaxed sm:text-lg">
                💻🌍 We bouwen aan een hechte ICT-community. Van studie-gerelateerde
                workshops tot gezellige borrels en studietrips: maak kennis met
                gelijkgestemden en groei mee.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Workshops", "Studietrips", "Netwerken"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-samu/15 bg-samu/5 px-3 py-1 text-sm font-semibold text-samu"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex w-full max-w-2xl flex-1 overflow-hidden rounded-3xl border border-samu/10 shadow-lg">
              <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                spaceBetween={24}
                speed={900}
                slidesPerView={1}
                loop
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                className="h-full w-full"
              >
                {["Borrel", "Trip", "Workshop"].map((alt, idx) => (
                  <SwiperSlide key={idx}>
                    <img
                      src="/img/backgrounds/Kroto2025.jpg"
                      alt={alt}
                      width={700}
                      height={700}
                      className="h-full w-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="px-4 sm:px-6 lg:px-10 pb-12">
          <div className="mb-4 flex items-center justify-center" data-scroll-fade>
            <h2 className="text-3xl font-black text-oranje sm:text-4xl">
              Kom in contact met Salve Mundi
            </h2>
          </div>
          <div className="flex flex-col gap-8 rounded-3xl bg-samu p-6 text-beige shadow-2xl sm:p-8 lg:flex-row lg:items-stretch">
            <div className="w-full space-y-4" data-scroll-fade>
              <h3 className="text-2xl font-bold text-geel">CONTACT</h3>
              <p className="text-base leading-relaxed sm:text-lg">
                Heb jij een vraag voor ons of wil je voor iets anders met ons in contact komen?
                Stuur ons een bericht of loop binnen op de campus.
              </p>
              <div className="space-y-2 text-base sm:text-lg">
                <p>
                  <strong>Adres:</strong> Rachelsmolen 1, 5612MA Eindhoven, Lokaal R10 2.17
                </p>
                <p>
                  <strong>E-mail:</strong>{" "}
                  <a className="underline decoration-geel decoration-2" href="mailto:info@salvemundi.nl">
                    info@salvemundi.nl
                  </a>
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href="mailto:info@salvemundi.nl"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-geel px-4 py-3 text-center text-samu font-semibold transition hover:-translate-y-0.5 hover:bg-yellow-400"
                >
                  Stuur een mail
                </a>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Salve%20Mundi%2C%20Rachelsmolen%201%2C%205612MA%20Eindhoven"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-beige/30 bg-beige/10 px-4 py-3 text-center text-beige font-semibold transition hover:-translate-y-0.5 hover:border-beige/60"
                >
                  Open in Maps
                </a>
              </div>
            </div>

            <div
              className="w-full overflow-hidden rounded-3xl border border-beige/15 shadow-lg"
              data-scroll-fade
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2486.3762423950466!2d5.477010676986035!3d51.4512482148034!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c6d9a14c2598a7%3A0x749672e4952620b8!2sSalve%20Mundi!5e0!3m2!1sen!2sfr!4v1749761290183!5m2!1sen!2sfr"
                className="h-72 w-full border-none sm:h-96"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="px-4 sm:px-6 lg:px-10 pb-16">
          <div className="flex flex-col items-center justify-center gap-6">
            <h2 className="text-3xl font-black text-oranje sm:text-4xl" data-scroll-fade>Partners</h2>
            <div className="w-full max-w-5xl rounded-3xl border border-samu/5 bg-white/80 p-4 shadow-lg">
              {sponsorsError && (
                <p className="text-center text-red-600">
                  Kan partners niet laden, probeer het later opnieuw.
                </p>
              )}
              {!sponsorsError && (
                <div className="flex snap-x snap-mandatory items-center gap-6 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
                  {isSponsorsLoading && sponsors.length === 0 && (
                    <p className="text-center text-gray-500">Partners worden geladen…</p>
                  )}
                  {!isSponsorsLoading && sponsors.length === 0 && (
                    <p className="text-center text-gray-500">
                      Er zijn momenteel geen partners om te tonen.
                    </p>
                  )}
                  {sponsors.map((sponsor) => (
                    <a
                      key={sponsor.sponsor_id}
                      href={sponsor.website_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-[160px] max-w-[220px] snap-start items-center justify-center rounded-2xl border border-samu/5 bg-beige/60 px-4 py-3 transition hover:-translate-y-1 hover:shadow-md sm:min-w-0 sm:max-w-[240px]"
                    >
                      <img
                        src={getImageUrl(sponsor.image)}
                        alt="Sponsor logo"
                        className="max-h-16 w-full object-contain"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>
      <BackToTopButton />
    </>
  );
}
