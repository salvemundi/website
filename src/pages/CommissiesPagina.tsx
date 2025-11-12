import React from "react";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import CommissieCard from "../components/CommissieCard";
import Footer from "../components/Footer";
import { useCommittees } from "../hooks/useApi";
import { getImageUrl } from "../lib/api";

export default function CommissiesPagina() {
  const { data: committees = [], isLoading, error } = useCommittees();

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
              <p className="text-lg text-red-600">Fout bij laden van commissies</p>
            </div>
          ) : committees.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-600">Geen commissies gevonden</p>
            </div>
          ) : (
            committees.map((committee) => (
              <CommissieCard
                key={committee.id}
                title={committee.name}
                description=""
                buttonText="Meer Lezen"
                buttonLink={`/commissies/${committee.id}`}
                image={getImageUrl(committee.image)}
              />
            ))
          )}
        </div>

        <Footer />
      </main>
      <BackToTopButton />
    </>
  );
}
