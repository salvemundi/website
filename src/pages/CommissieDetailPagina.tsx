import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import Footer from "../components/Footer";
import { useCommittee, useEventsByCommittee } from "../hooks/useApi";
import { getImageUrl } from "../lib/api";

export default function CommissieDetailPagina() {
  const { slug } = useParams<{ slug: string }>();
  const committeeId = parseInt(slug || '0');

  const { data: committee, isLoading: committeeLoading } = useCommittee(committeeId);
  const { data: events = [], isLoading: eventsLoading } = useEventsByCommittee(committeeId);

  if (committeeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Commissie niet gevonden</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col w-full">
        <Navbar activePage="Commissies" />
        <Header
          title={committee.name.toUpperCase()}
          backgroundImage={getImageUrl(committee.image)}
        />
      </div>

      <main className="bg-beige min-h-screen">
        {/* About Section */}
        <section className="px-10 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-geel mb-6">
              Over {committee.name}
            </h2>
          </div>
        </section>

        {/* Team Members Section */}
        {committee.members && committee.members.length > 0 && (
          <section className="px-10 py-16 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-geel mb-8">Teamleden</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {committee.members
                  .filter(member => member.is_visible)
                  .map((member) => (
                    <div key={member.id} className="text-center">
                      <img
                        src={getImageUrl(member.member_id.picture)}
                        alt={`${member.member_id.first_name} ${member.member_id.last_name}`}
                        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                      />
                      <h3 className="text-xl font-semibold text-gray-800">
                        {member.member_id.first_name} {member.member_id.last_name}
                      </h3>
                      {member.is_leader && (
                        <p className="text-gray-600 text-sm">Voorzitter</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Events Section */}
        {events.length > 0 && (
          <section className="px-10 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-geel mb-8">Evenementen</h2>
              <div className="space-y-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white p-6 rounded-lg shadow-md"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{event.event_date}</p>
                    <p className="text-gray-700">{event.description}</p>
                    <div className="mt-4">
                      <span className="text-lg font-bold text-paars">
                        €{(Number(event.price_members) || 0).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">voor leden</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>
      <BackToTopButton />
    </>
  );
}
