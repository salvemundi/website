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

  // Check if committee is visible on website
  if (committee.is_visible === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-center">
          <p className="text-lg mb-2">Deze commissie is momenteel niet zichtbaar</p>
          <p className="text-sm text-gray-600">Commissie: {committee.name}</p>
        </div>
      </div>
    );
  }

  // Separate leaders from regular members
  const visibleMembers = committee.committee_members?.filter((member: any) => member.is_visible && member.user_id) || [];
  const leaders = visibleMembers.filter((member: any) => member.is_leader);
  const regularMembers = visibleMembers.filter((member: any) => !member.is_leader);

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
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-geel mb-6">
              Over {committee.name}
            </h2>
            {committee.description ? (
              <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                {committee.description}
              </div>
            ) : (
              <p className="text-gray-700 text-lg leading-relaxed">
                Informatie over de {committee.name} komt binnenkort beschikbaar.
              </p>
            )}
          </div>
        </section>

        {/* Team Members Section */}
        {visibleMembers.length > 0 && (
          <section className="px-10 py-16 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-geel mb-12 text-center">Het Team</h2>
              
              {/* Committee Leaders */}
              {leaders.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-center mb-8">
                    <div className="h-px bg-geel flex-grow max-w-xs"></div>
                    <h3 className="text-2xl font-bold text-paars px-6">
                      {leaders.length === 1 ? 'Commissie Voorzitter' : 'Commissie Voorzitters'}
                    </h3>
                    <div className="h-px bg-geel flex-grow max-w-xs"></div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-12">
                    {leaders.map((member: any) => (
                      <div key={member.id} className="text-center group">
                        <div className="relative mb-6">
                          <div className="w-40 h-40 rounded-full mx-auto overflow-hidden bg-gradient-to-br from-geel to-paars p-1 shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                              <img
                                src={getImageUrl(member.user_id.avatar)}
                                alt={`${member.user_id.first_name || ''} ${member.user_id.last_name || ''}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `
                                    <svg class="w-full h-full text-gray-400 p-8" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                    </svg>
                                  `;
                                }}
                              />
                            </div>
                          </div>
                          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-geel text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                              ⭐ Voorzitter
                            </span>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mt-4 mb-1">
                          {member.user_id.first_name} {member.user_id.last_name}
                        </h3>
                        {member.user_id.title && (
                          <p className="text-paars text-base font-medium">{member.user_id.title}</p>
                        )}
                        {member.user_id.email && (
                          <p className="text-gray-500 text-sm mt-2">{member.user_id.email}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Team Members */}
              {regularMembers.length > 0 && (
                <div>
                  {leaders.length > 0 && (
                    <div className="flex items-center justify-center mb-8">
                      <div className="h-px bg-gray-300 flex-grow max-w-xs"></div>
                      <h3 className="text-xl font-semibold text-gray-700 px-6">Teamleden</h3>
                      <div className="h-px bg-gray-300 flex-grow max-w-xs"></div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {regularMembers.map((member: any) => (
                      <div key={member.id} className="text-center group">
                        <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden bg-gray-200 shadow-lg group-hover:shadow-xl transition-shadow duration-300 ring-2 ring-gray-200 group-hover:ring-geel">
                          <img
                            src={getImageUrl(member.user_id.avatar)}
                            alt={`${member.user_id.first_name || ''} ${member.user_id.last_name || ''}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `
                                <svg class="w-full h-full text-gray-400 p-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                </svg>
                              `;
                            }}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {member.user_id.first_name} {member.user_id.last_name}
                        </h3>
                        {member.user_id.title && (
                          <p className="text-gray-600 text-sm mt-1">{member.user_id.title}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Events Section */}
        {!eventsLoading && events.length > 0 && (
          <section className="px-10 py-16 bg-beige">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-geel mb-12 text-center">Aankomende Evenementen</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-t-4 border-geel"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 flex-1">
                        {event.name}
                      </h3>
                      <span className="bg-paars text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4">
                        {new Date(event.event_date).toLocaleDateString('nl-NL', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <span className="text-2xl font-bold text-geel">
                          €{(Number(event.price_members) || 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">leden</span>
                      </div>
                      {event.price_non_members && (
                        <div className="text-right">
                          <span className="text-lg font-semibold text-gray-500">
                            €{(Number(event.price_non_members) || 0).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">niet-leden</span>
                        </div>
                      )}
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
