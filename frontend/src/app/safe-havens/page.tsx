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
  Heart,
  Phone,
} from 'lucide-react';
import { SafeHavenCardSkeleton } from '@/shared/ui/skeletons';

function BentoCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        'rounded-2xl sm:rounded-3xl',
        'bg-[var(--bg-card)] dark:border dark:border-white/10',
        'shadow-lg',
        'p-5 sm:p-7 md:p-8',
        'transition-all duration-300 hover:shadow-xl',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}

export default function SafeHavensPage() {
  const { data: safeHavens, isLoading, error } = useSalvemundiSafeHavens();

  const topics = [
    { Icon: AlertTriangle, text: 'Agressie & geweld', color: 'from-red-500 to-orange-500' },
    { Icon: Heart, text: 'Seksuele intimidatie', color: 'from-pink-500 to-rose-500' },
    { Icon: UserX, text: 'Pesten & uitsluiting', color: 'from-purple-500 to-indigo-500' },
    { Icon: Users, text: 'Discriminatie', color: 'from-blue-500 to-cyan-500' },
    { Icon: Shield, text: 'Grensoverschrijdend gedrag', color: 'from-emerald-500 to-teal-500' },
    { Icon: MessageSquare, text: 'Persoonlijke situaties', color: 'from-amber-500 to-yellow-500' },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader title="Safe Havens">
        <p className="mx-auto mt-4 max-w-3xl text-lg sm:text-xl text-white/90 leading-relaxed">
          Een veilig aanspreekpunt waar je terechtkunt met zorgen, vragen of problemen. 
          Wij luisteren zonder te oordelen.
        </p>
      </PageHeader>

      <div className="mx-auto max-w-app px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          {/* Bento grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:auto-rows-[minmax(160px,auto)]">
            
            {/* Intro section - spanning more space */}
            <BentoCard className="lg:col-span-8 lg:row-span-2">
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Wat zijn Safe Havens?
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-theme-muted leading-relaxed">
                      Binnen Salve Mundi College vinden wij een veilige en respectvolle omgeving essentieel. 
                      Safe Havens zijn zorgvuldig geselecteerde personen die voor jou klaarstaan: 
                      ze luisteren zonder te oordelen, denken met je mee, en helpen je een passende vervolgstap te vinden.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/50 dark:border-purple-800/30 p-5">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <p className="text-base font-bold text-theme">
                          Volledige vertrouwelijkheid
                        </p>
                        <p className="mt-1.5 text-sm text-theme-muted leading-relaxed">
                          Safe Havens hebben geheimhoudingsplicht. Wat je deelt blijft tussen jullie, 
                          tenzij jij expliciet toestemming geeft om informatie te delen.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200/50 dark:border-indigo-800/30 p-5">
                    <div className="flex items-start gap-3">
                      <Users className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <p className="text-base font-bold text-theme">
                          Diverse achtergronden
                        </p>
                        <p className="mt-1.5 text-sm text-theme-muted leading-relaxed">
                          We streven naar Safe Havens met verschillende geslachten en achtergronden, 
                          zodat er sneller iemand is waarbij jij je comfortabel voelt.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Topics section - more compact */}
            <BentoCard className="lg:col-span-4 lg:row-span-2">
              <div className="h-full flex flex-col">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-theme">
                    Waar kun je terecht?
                  </h2>
                  <p className="mt-2 text-sm text-theme-muted">
                    Onder andere bij de volgende onderwerpen:
                  </p>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {topics.map((topic, index) => (
                    <li
                      key={index}
                      className="group flex items-center gap-3 rounded-xl bg-theme-purple/5 dark:bg-white/5 border border-theme-purple/10 dark:border-white/10 p-3 hover:bg-theme-purple/10 dark:hover:bg-white/10 hover:border-theme-purple/20 dark:hover:border-white/20 transition-all duration-200"
                    >
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${topic.color} flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                        <topic.Icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-theme">
                        {topic.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3.5">
                  <p className="text-xs text-theme-muted leading-relaxed">
                    <strong className="text-theme">Let op:</strong> Deze lijst is niet uitputtend. 
                    Heb je een zorg die hier niet staat? Neem gerust contact op.
                  </p>
                </div>
              </div>
            </BentoCard>

            {/* Safe Havens list */}
            <BentoCard className="lg:col-span-8 lg:row-span-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme">
                      Onze Safe Havens
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-theme-muted">
                      Kies een persoon waarbij jij je het meest comfortabel voelt om mee te praten.
                    </p>
                  </div>
                  
                  {safeHavens && safeHavens.length > 0 && (
                    <div className="px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700">
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        {safeHavens.length} beschikbaar
                      </p>
                    </div>
                  )}
                </div>

                {error ? (
                  <div className="mt-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-5 sm:px-6 py-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-200">
                          Er ging iets mis bij het laden
                        </p>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                          Probeer de pagina opnieuw te laden. Als het probleem aanhoudt, neem dan contact op met bestuur@salvemundi.nl
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {isLoading ? (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <SafeHavenCardSkeleton key={i} />
                    ))}
                  </div>
                ) : safeHavens && safeHavens.length > 0 ? (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {safeHavens.map((safeHaven: any) => (
                      <SafeHavenCard key={safeHaven.id} safeHaven={safeHaven} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800 p-10 text-center">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <p className="mt-5 text-lg sm:text-xl font-bold text-theme">
                      Safe Havens worden binnenkort toegevoegd
                    </p>
                    <p className="mt-2 text-sm sm:text-base text-theme-muted max-w-md mx-auto">
                      We zijn bezig met het samenstellen van ons Safe Haven team. 
                      Check deze pagina binnenkort opnieuw of contacteer het bestuur voor vragen.
                    </p>
                  </div>
                )}
              </div>
            </BentoCard>

            {/* External help section */}
            <BentoCard className="lg:col-span-4 lg:row-span-4">
              <div className="h-full flex flex-col">
                <div className="text-center">
                  <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-theme">
                    Hulp buiten Salve Mundi
                  </h2>

                  <p className="mt-3 text-sm sm:text-base text-theme-muted leading-relaxed">
                    Wil je liever met iemand buiten onze vereniging praten? 
                    Er zijn professionele instanties die je kunnen helpen.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <a
                    href="https://www.fontys.nl/fontyshelpt.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold text-sm sm:text-base">
                        Fontys Vertrouwenspersoon
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                  </a>

                  <a
                    href="mailto:bestuur@salvemundi.nl"
                    className="group flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl"
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-semibold text-sm sm:text-base">
                      Contact met bestuur
                    </span>
                  </a>
                </div>

                <div className="mt-6 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <p className="font-bold text-red-900 dark:text-red-200">
                      Noodgeval
                    </p>
                  </div>
                  <p className="text-center text-sm text-red-800 dark:text-red-300">
                    Bij direct gevaar of spoedeisende situaties, bel onmiddellijk <strong>112</strong>
                  </p>
                </div>

                <div className="mt-auto pt-6">
                  <div className="rounded-xl bg-theme-purple/5 dark:bg-white/5 border border-theme-purple/10 dark:border-white/10 p-4">
                    <p className="text-xs text-center text-theme-muted leading-relaxed">
                      Alle gesprekken zijn vertrouwelijk en worden met respect behandeld. 
                      Jouw welzijn staat voorop.
                    </p>
                  </div>
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </div>
    </div>
  );
}