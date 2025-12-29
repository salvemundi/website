'use client';

import React from 'react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import SafeHavenCard from '@/entities/safe-haven/ui/SafeHavenCard';
import { useSalvemundiSafeHavens } from '@/shared/lib/hooks/useSalvemundiApi';
import {
  Shield,
  Lock,
  AlertTriangle,
  UserX,
  Users,
  MessageSquare,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { SafeHavenCardSkeleton } from '@/shared/ui/skeletons';

export default function SafeHavensPage() {
  const { data: safeHavens, isLoading, error } = useSalvemundiSafeHavens();

  const topics = [
    { Icon: AlertTriangle, text: 'Aggressie, geweld' },
    { Icon: AlertTriangle, text: 'Seksuele intimidatie' },
    { Icon: UserX, text: 'Pesten' },
    { Icon: Users, text: 'Discriminatie' },
    { Icon: Shield, text: 'Grensoverschrijdend gedrag' },
    { Icon: MessageSquare, text: 'Persoonlijke situaties' },
  ];

  return (
    <div>
      <PageHeader
        title="Safe Havens"
      >
        <p className="mx-auto mt-4 max-w-3xl text-lg sm:text-xl text-white/90">
          Een veilig aanspreekpunt voor jouw zorgen en vragen.
        </p>
      </PageHeader>

      <div className="mx-auto max-w-app px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 lg:space-y-12">
          {/* Intro */}
          <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] p-5 sm:p-7 md:p-8 shadow-lg">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="mx-auto sm:mx-0 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-theme flex items-center justify-center shrink-0">
                  <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-theme-white" />
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-theme">
                    Wat zijn Safe Havens
                  </h2>

                  <p className="mt-3 text-sm sm:text-base lg:text-lg text-theme-muted leading-relaxed">
                    Binnen Salve Mundi vinden wij een veilige en comfortabele omgeving belangrijk.
                    Safe Havens zijn aangewezen personen die luisteren, meedenken, en je helpen met een volgende stap.
                  </p>

                  <div className="mt-5 rounded-2xl bg-theme-purple/10 p-4 sm:p-5">
                    <div className="flex items-start gap-2">
                      <Lock className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 text-theme-purple shrink-0" />
                      <p className="text-sm sm:text-base font-semibold text-theme">
                        Een Safe Haven heeft geheimhoudingsplicht.
                      </p>
                    </div>
                    <p className="mt-2 pl-6 sm:pl-7 text-xs sm:text-sm text-theme-muted leading-relaxed">
                      Jouw melding blijft vertrouwelijk, ook richting bestuur, tenzij jij aangeeft dat het gedeeld mag worden.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Topics */}
          <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] p-5 sm:p-7 md:p-8 shadow-lg">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-theme">
                  Waar kun je bij ons terecht
                </h2>
                <p className="mt-2 text-sm sm:text-base text-theme-muted">
                  Onze Safe Havens zijn er voor, maar niet gelimiteerd tot.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl bg-theme-purple/5 p-4 hover:bg-theme-purple/10 transition"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-theme flex items-center justify-center shrink-0">
                      <topic.Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-theme">
                      {topic.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 sm:mt-8 rounded-2xl bg-theme-purple/5 p-4 sm:p-5">
                <p className="mx-auto max-w-3xl text-center text-sm sm:text-base text-theme-muted leading-relaxed">
                  We streven naar Safe Havens met verschillende achtergronden en geslachten,
                  en zowel binnen als buiten het bestuur. Zo is er sneller iemand waarbij jij je prettig voelt.
                </p>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] p-5 sm:p-7 md:p-8 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme">
                  Onze Safe Havens
                </h2>
                <p className="mt-1 text-sm text-theme-muted">
                  Kies iemand waarbij jij je comfortabel voelt.
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl bg-theme-purple/10 px-5 sm:px-6 py-4">
                <p className="font-semibold text-theme-purple">
                  Er is een fout opgetreden bij het laden van de Safe Havens.
                </p>
                <p className="mt-2 text-sm text-theme-muted">
                  Laad de pagina opnieuw.
                </p>
              </div>
            ) : null}

            {isLoading ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SafeHavenCardSkeleton key={i} />
                ))}
              </div>
            ) : safeHavens && safeHavens.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                {safeHavens.map((safeHaven: any) => (
                  <SafeHavenCard key={safeHaven.id} safeHaven={safeHaven} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-white/30 p-8 text-center border border-theme-purple/10">
                <Shield className="mx-auto h-14 w-14 sm:h-16 sm:w-16 text-theme-purple" />
                <p className="mt-4 text-lg sm:text-xl font-semibold text-theme">
                  Safe Havens worden binnenkort toegevoegd
                </p>
                <p className="mt-2 text-sm sm:text-base text-theme-muted">
                  Check deze pagina later opnieuw.
                </p>
              </div>
            )}
          </section>

          {/* Alternative contact */}
          <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] p-5 sm:p-7 md:p-8 shadow-lg">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-4 h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-theme flex items-center justify-center">
                <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-theme-white" />
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-theme">
                Voel je je niet veilig genoeg
              </h2>

              <p className="mt-3 text-sm sm:text-base text-theme-muted leading-relaxed">
                Wil je liever met iemand buiten Salve Mundi praten, stap dan naar Fontys.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <a
                  href="https://www.fontys.nl/fontyshelpt.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-theme px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  Fontys vertrouwenspersoon
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </a>

                <a
                  href="mailto:bestuur@salvemundi.nl"
                  className="inline-flex items-center justify-center rounded-full bg-theme-purple px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition hover:opacity-90"
                >
                  Contact bestuur
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
