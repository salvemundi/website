import React from "react";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import CommissieCard from "../components/CommissieCard";
import Footer from "../components/Footer";
import { getImageUrl } from "../lib/api";
import { committeesApi } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { Committee } from "../types";

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
  return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

export default function CommissiesPagina() {
  // Fetch committees with member details
  const { data: committeesData = [], isLoading, error } = useQuery<Committee[]>({
    queryKey: ['committees-with-members'],
    queryFn: () => committeesApi.getAllWithMembers(),
    staleTime: 5 * 60 * 1000
  });

  // Sort committees so Bestuur is first
  const committeesWithMembers = React.useMemo(() => {
    return [...committeesData].sort((a, b) => {
      const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
      const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');
      
      if (aIsBestuur && !bIsBestuur) return -1;
      if (!aIsBestuur && bIsBestuur) return 1;
      return 0;
    });
  }, [committeesData]);

  return (
    <>
      <div className="flex flex-col w-full min-h-[65vh] lg:min-h-screen">
        <Navbar activePage="Commissies" />
        <Header
          title="COMMISSIES"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
        />
      </div>

      <main className="bg-beige min-h-screen">
        {/* Bento Grid Layout */}
        <div className="px-4 sm:px-6 lg:px-10 py-10 sm:py-16">
          {isLoading ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">Commissies laden...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-lg text-red-600 mb-2">Fout bij laden van commissies</p>
              <p className="text-sm text-gray-600">{String(error)}</p>
            </div>
          ) : committeesWithMembers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg text-gray-600">Geen commissies gevonden</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
              {committeesWithMembers.map((committee) => {
                // Get member images from committee_members
                const memberImages = committee.committee_members
                  ?.filter((member: any) => member.is_visible && member.user_id?.avatar)
                  .map((member: any) => getImageUrl(member.user_id.avatar)) || [];
                
                const isBestuur = cleanCommitteeName(committee.name).toLowerCase().includes('bestuur');
                
                // Prepare member data with names for Bestuur
                const membersWithNames = committee.committee_members
                  ?.filter((member: any) => member.is_visible && member.user_id?.avatar)
                  .map((member: any) => ({
                    image: getImageUrl(member.user_id.avatar),
                    firstName: member.user_id.first_name || ''
                  })) || [];
                
                return (
                  <div
                    key={committee.id}
                    className={`${isBestuur ? 'md:col-span-2 lg:col-span-2' : ''}`}
                  >
                    <div className={`h-full ${isBestuur ? 'ring-4 ring-geel rounded-3xl' : ''}`}>
                      <CommissieCard
                        title={cleanCommitteeName(committee.name)}
                        description={committee.short_description || ""}
                        buttonText="Meer Lezen"
                        buttonLink={`/commissies/${committee.id}`}
                        image={getImageUrl(committee.image)}
                        memberImages={memberImages}
                        members={membersWithNames}
                        isBestuur={isBestuur}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Footer />
      </main>
      <BackToTopButton />
    </>
  );
}
