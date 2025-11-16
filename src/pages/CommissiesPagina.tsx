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

export default function CommissiesPagina() {
  // Fetch committees with member details
  const { data: committeesWithMembers = [], isLoading, error } = useQuery<Committee[]>({
    queryKey: ['committees-with-members'],
    queryFn: () => committeesApi.getAllWithMembers(),
    staleTime: 5 * 60 * 1000
  });

  // Debug logging
  React.useEffect(() => {
    console.log('=== CommissiesPagina Debug ===');
    console.log('committees count:', committeesWithMembers.length);
    console.log('committees:', committeesWithMembers);
    console.log('loading:', isLoading);
    console.log('error:', error);
    if (committeesWithMembers.length > 0) {
      console.log('First committee:', committeesWithMembers[0]);
      console.log('First committee_members:', committeesWithMembers[0].committee_members);
    }
    console.log('============================');
  }, [committeesWithMembers, isLoading, error]);

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
          {isLoading ? (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-600">Commissies laden...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-red-600 mb-2">Fout bij laden van commissies</p>
              <p className="text-sm text-gray-600">{String(error)}</p>
            </div>
          ) : committeesWithMembers.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-600">Geen commissies gevonden</p>
            </div>
          ) : (
            committeesWithMembers.map((committee) => {
              // Get member images from committee_members
              const memberImages = committee.committee_members
                ?.filter((member: any) => member.is_visible && member.user_id?.avatar)
                .map((member: any) => getImageUrl(member.user_id.avatar)) || [];
              
              console.log(`Committee ${committee.name}:`, {
                hasMembers: !!committee.committee_members,
                membersCount: committee.committee_members?.length || 0,
                visibleCount: committee.committee_members?.filter((m: any) => m.is_visible).length || 0,
                memberImages: memberImages
              });
              
              return (
                <CommissieCard
                  key={committee.id}
                  title={committee.name}
                  description=""
                  buttonText="Meer Lezen"
                  buttonLink={`/commissies/${committee.id}`}
                  image={getImageUrl(committee.image)}
                  memberImages={memberImages}
                />
              );
            })
          )}
        </div>

        <Footer />
      </main>
      <BackToTopButton />
    </>
  );
}
