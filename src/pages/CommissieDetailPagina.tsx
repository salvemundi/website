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
  const committeeId = slug ? parseInt(slug) : undefined;

  const { data: committee, isLoading: committeeLoading, error: committeeError } = useCommittee(committeeId);
  const { data: events = [], isLoading: eventsLoading } = useEventsByCommittee(committeeId);

  // Debug logging
  React.useEffect(() => {
    console.log('=== CommissieDetailPagina Debug ===');
    console.log('slug:', slug);
    console.log('committeeId:', committeeId);
    console.log('committee data:', committee);
    console.log('loading:', committeeLoading);
    console.log('error:', committeeError);
    console.log('================================');
  }, [slug, committeeId, committee, committeeLoading, committeeError]);

  // Check for invalid ID early
  if (!slug || !committeeId || isNaN(committeeId)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-center">
          <p className="text-lg mb-2">Ongeldige commissie ID</p>
          <p className="text-sm text-gray-600">URL slug: {slug || 'geen'}</p>
        </div>
      </div>
    );
  }

  if (committeeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-center">
          <p className="text-lg mb-2">Commissie laden...</p>
          <p className="text-sm text-gray-600">ID: {committeeId}</p>
        </div>
      </div>
    );
  }

  if (committeeError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-2">Fout bij laden van commissie</p>
          <p className="text-sm text-gray-600 mb-2">ID: {committeeId}</p>
          <p className="text-xs text-gray-500">{String(committeeError)}</p>
        </div>
      </div>
    );
  }

  if (!committee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-center">
          <p className="text-lg mb-2">Commissie niet gevonden</p>
          <p className="text-sm text-gray-600">ID: {committeeId}</p>
        </div>
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
            <p className="text-gray-700 text-lg">
              Informatie over de {committee.name} komt binnenkort beschikbaar.
            </p>
          </div>
        </section>

        {/* Team Members Section */}
        {committee.committee_members && committee.committee_members.length > 0 && (
          <section className="px-10 py-16 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-geel mb-8">Teamleden</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {committee.committee_members
                  .filter((member: any) => member.is_visible && member.user_id)
                  .map((member: any) => (
                    <div key={member.id} className="text-center">
                      <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden bg-gray-200">
                        <img
                          src={getImageUrl(member.user_id.avatar)}
                          alt={`${member.user_id.first_name || ''} ${member.user_id.last_name || ''}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <svg class="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                              </svg>
                            `;
                          }}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {member.user_id.first_name} {member.user_id.last_name}
                      </h3>
                      {member.is_leader && (
                        <p className="text-geel text-sm font-semibold">Voorzitter</p>
                      )}
                      {member.user_id.title && (
                        <p className="text-gray-600 text-sm">{member.user_id.title}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Events Section */}
        {!eventsLoading && events.length > 0 && (
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
