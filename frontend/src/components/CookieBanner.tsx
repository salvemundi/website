import React, { useEffect, useState } from "react";
import { TrackingPreferences } from "../types/tracking";

interface CookieBannerProps {
  initialPreferences: TrackingPreferences;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: (preferences: TrackingPreferences) => void;
}

export default function CookieBanner({
  initialPreferences,
  onAcceptAll,
  onRejectAll,
  onSave,
}: CookieBannerProps) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [clarityAllowed, setClarityAllowed] = useState(initialPreferences.clarity);
  const [posthogAllowed, setPosthogAllowed] = useState(initialPreferences.posthog);

  useEffect(() => {
    setClarityAllowed(initialPreferences.clarity);
    setPosthogAllowed(initialPreferences.posthog);
  }, [initialPreferences.clarity, initialPreferences.posthog]);

  const handleSave = () => {
    onSave({ clarity: clarityAllowed, posthog: posthogAllowed });
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
      <div className="relative overflow-hidden rounded-2xl border border-samu/15 bg-beige/95 shadow-2xl backdrop-blur-lg">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-oranje/15 via-beige/70 to-samu/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex-1">
              <p className="text-base font-semibold text-samu">Cookies voor analytics (Clarity & PostHog)</p>
              <p className="mt-1 text-sm text-samu/80">
                We gebruiken Microsoft Clarity en PostHog om te begrijpen hoe bezoekers de site gebruiken. Als je bent ingelogd delen we je
                naam, e-mailadres, lidmaatschapsstatus en inlogmethode zodat we sneller problemen kunnen oplossen. Noodzakelijke cookies
                staan altijd aan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowPreferences((prev) => !prev)}
                className="rounded-xl border border-samu/20 bg-white/70 px-4 py-2 text-sm font-semibold text-samu transition hover:-translate-y-0.5 hover:border-samu/30 hover:shadow-md"
              >
                {showPreferences ? "Verberg voorkeuren" : "Pas voorkeuren aan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setClarityAllowed(true);
                  setPosthogAllowed(true);
                  onAcceptAll();
                }}
                className="rounded-xl bg-samu px-4 py-2 text-sm font-semibold text-beige shadow-lg transition hover:-translate-y-0.5 hover:bg-samu/90 hover:shadow-xl"
              >
                Accepteer alles
              </button>
            </div>
          </div>

          {showPreferences && (
            <div className="rounded-xl border border-samu/15 bg-white/65 px-4 py-4 shadow-inner sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-samu">Analytics (Microsoft Clarity)</p>
                  <p className="text-xs text-samu/75">
                    Helpt ons de site te verbeteren door gebruiksstatistieken te verzamelen. Bij ingelogde gebruikers koppelen we sessies aan
                    je account-ID, lidmaatschapsstatus en contactgegevens voor betere ondersteuning.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={clarityAllowed}
                    onChange={(e) => setClarityAllowed(e.target.checked)}
                    aria-label="Schakel Clarity cookies in of uit"
                  />
                  <div className="h-6 w-11 rounded-full border border-samu/20 bg-beige transition peer-checked:border-samu peer-checked:bg-samu">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-samu/40 transition peer-checked:translate-x-5 peer-checked:bg-beige" />
                  </div>
                </label>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-samu">Product analytics (PostHog)</p>
                  <p className="text-xs text-samu/75">
                    Meet paginaweergaven en interacties zodat we bugs of drempels snel zien. Bij ingelogde gebruikers koppelen we events aan
                    je account-ID, naam, e-mail en lidmaatschapsstatus.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={posthogAllowed}
                    onChange={(e) => setPosthogAllowed(e.target.checked)}
                    aria-label="Schakel PostHog cookies in of uit"
                  />
                  <div className="h-6 w-11 rounded-full border border-samu/20 bg-beige transition peer-checked:border-samu peer-checked:bg-samu">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-samu/40 transition peer-checked:translate-x-5 peer-checked:bg-beige" />
                  </div>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setClarityAllowed(false);
                    setPosthogAllowed(false);
                    onRejectAll();
                  }}
                  className="rounded-lg border border-samu/20 bg-beige/70 px-4 py-2 text-sm font-semibold text-samu transition hover:-translate-y-0.5 hover:border-samu/30 hover:shadow-md"
                >
                  Alleen noodzakelijk
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-samu px-4 py-2 text-sm font-semibold text-beige shadow-md transition hover:-translate-y-0.5 hover:bg-samu/90 hover:shadow-lg"
                >
                  Bewaar keuze
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
