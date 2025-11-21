import React from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import ClubCard from "../components/ClubCard";
import { clubsApi, getImageUrl } from "../lib/api";
import { Club } from "../types";

export default function ClubsPagina() {
  const {
    data: clubs = [],
    isLoading,
    error,
  } = useQuery<Club[]>({
    queryKey: ["clubs"],
    queryFn: clubsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const sortedClubs = React.useMemo(() => {
    return [...clubs].sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs]);

  return (
    <>
      <div className="flex flex-col w-full">
        <Header title="CLUBS" backgroundImage="/img/backgrounds/Kroto2025.jpg" />
      </div>

      <main className="bg-beige min-h-screen">
        <section className="px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">Clubs laden...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-lg text-red-600 mb-2">Fout bij laden van clubs</p>
              <p className="text-sm text-gray-600">{String(error)}</p>
            </div>
          ) : sortedClubs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">Geen clubs gevonden</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  title={club.name}
                  description={club.description || ""}
                  image={getImageUrl(club.image)}
                  whatsappLink={club.whatsapp_link || undefined}
                  discordLink={club.discord_link || undefined}
                  websiteLink={club.website_link || undefined}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      <BackToTopButton />
    </>
  );
}
