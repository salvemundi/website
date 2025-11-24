import { useParams, Link } from "react-router-dom";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import { useCommittee, useEventsByCommittee } from "../hooks/useApi";
import { getImageUrl, committeesApi } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { slugify } from "../lib/slug";

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
  return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

// Helper function to split committee name for header display
function formatCommitteeNameForHeader(name: string): string {
  const cleanName = cleanCommitteeName(name).toUpperCase();
  // Replace "COMMISSIE" with a line break before it (handles both with and without spaces)
  return cleanName.replace(/\s*COMMISSIE/g, '\nCOMMISSIE');
}

// Helper function to get a default committee image with variety
function getDefaultCommitteeImage(committeeId: number): string {
  // Use committee ID to consistently assign one of two group gifs
  return committeeId % 2 === 0 ? '/img/group-jump.gif' : '/img/groupgif.gif';
}

export default function CommissieDetailPagina() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-center">
          <p className="text-lg mb-2">Ongeldige commissie URL</p>
        </div>
      </div>
    );
  }

  // If the slug is numeric, treat as ID; otherwise resolve by slugified name
  const numericId = !isNaN(Number(slug)) ? Number(slug) : undefined;

  const { data: committeeById, isLoading: committeeLoading, error: committeeError } = useCommittee(numericId);

  const { data: committeesWithMembers = [], isLoading: listLoading } = useQuery({
    queryKey: ['committees-with-members'],
    queryFn: () => committeesApi.getAllWithMembers(),
    enabled: numericId === undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Resolve committee: prefer numeric lookup, otherwise find by slugified cleaned name
  const committee = numericId !== undefined
    ? committeeById
    : committeesWithMembers.find((c: any) => slugify(cleanCommitteeName(c.name)) === slug);

  // Use resolved committee id for hooks and image fallbacks
  const resolvedCommitteeId = committee?.id;

  // Fetch events for the resolved committee id
  const { data: events = [], isLoading: eventsLoading } = useEventsByCommittee(resolvedCommitteeId);

  // Loading states
  if (numericId !== undefined) {
    if (committeeLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-beige">
          <div className="text-center">
            <p className="text-lg mb-2">Commissie laden...</p>
            <p className="text-sm text-gray-600">ID: {numericId}</p>
          </div>
        </div>
      );
    }
    if (committeeError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-beige">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-2">Fout bij laden van commissie</p>
            <p className="text-sm text-gray-600 mb-2">ID: {numericId}</p>
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
            <p className="text-sm text-gray-600">ID: {numericId}</p>
          </div>
        </div>
      );
    }
  } else {
    if (listLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-beige">
          <div className="text-center">
            <p className="text-lg mb-2">Commissie laden...</p>
            <p className="text-sm text-gray-600">Slug: {slug}</p>
          </div>
        </div>
      );
    }
    if (!committee) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-beige">
          <div className="text-center">
            <p className="text-lg mb-2">Commissie niet gevonden</p>
            <p className="text-sm text-gray-600">Slug: {slug}</p>
          </div>
        </div>
      );
    }
  }

  // Check if committee is visible on website
  if (committee.is_visible === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-beige">
        <div className="text-center">
          <p className="text-lg mb-2">Deze commissie is momenteel niet zichtbaar</p>
          <p className="text-sm text-gray-600">Commissie: {cleanCommitteeName(committee.name)}</p>
        </div>
      </div>
    );
  }

  // Get all visible members and sort so leaders come first
  const visibleMembers = committee.committee_members
    ?.filter((member: any) => member.is_visible && member.user_id)
    .sort((a: any, b: any) => {
      // Leaders first
      if (a.is_leader && !b.is_leader) return -1;
      if (!a.is_leader && b.is_leader) return 1;
      return 0;
    }) || [];

  return (
    <>
      <div className="flex flex-col w-full">
        <Header
          title={formatCommitteeNameForHeader(committee.name)}
          backgroundImage={committee.image ? getImageUrl(committee.image) : getDefaultCommitteeImage(resolvedCommitteeId ?? 0)}
          titleClassName="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
          className="px-4"
        />
      </div>

      <main className="bg-beige min-h-screen">
        {/* About Section */}
        <section className="px-4 sm:px-6 lg:px-10 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-geel mb-6">
              Over {cleanCommitteeName(committee.name)}
            </h2>

            {/* Responsive two-column: image left, description right (stack on small screens) */}
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="w-full aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 shadow-md">
                  <img
                    src={committee.image ? getImageUrl(committee.image) : getDefaultCommitteeImage(resolvedCommitteeId ?? 0)}
                    alt={`Foto van ${cleanCommitteeName(committee.name)}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/img/placeholder.svg';
                    }}
                  />
                </div>
              </div>

              <div className="w-full md:w-2/3 text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                {committee.description ? (
                  <div>{committee.description}</div>
                ) : (
                  <p>
                    Informatie over de {cleanCommitteeName(committee.name)} komt binnenkort beschikbaar.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Team Members Section */}
        {visibleMembers.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-10 py-12 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-geel mb-10 text-center">
                {cleanCommitteeName(committee.name).toLowerCase().includes('bestuur') ? 'Het Bestuur' : 'De Commissie'}
              </h2>

              {/* All Team Members (Leaders and Regular Members together) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {visibleMembers.map((member: any) => (
                  <div key={member.id} className="text-center group">
                    {/* Profile Picture */}
                    <div className={`w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden bg-gray-200 shadow-lg group-hover:shadow-xl transition-shadow duration-300 ring-2 ${member.is_leader
                      ? 'ring-geel ring-4'
                      : 'ring-gray-200 group-hover:ring-geel'
                      }`}>
                      <img
                        src={getImageUrl(member.user_id.avatar)}
                        alt={`${member.user_id.first_name || ''} ${member.user_id.last_name || ''}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/img/avatar-placeholder.svg';
                        }}
                      />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800">
                      {member.user_id.first_name} {member.user_id.last_name}
                    </h3>

                    {member.is_leader && (
                      <p className="text-geel text-sm font-bold mt-1 flex items-center justify-center gap-1">

                        <span>Commissieleider</span>
                      </p>
                    )}

                    {member.user_id.title && (
                      <p className="text-gray-600 text-sm mt-1">{member.user_id.title}</p>
                    )}
                  </div>
                ))}
              </div>
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
                  <Link
                    key={event.id}
                    to={`/activiteiten?event=${event.id}`}
                    className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-t-4 border-geel hover:scale-[1.02] cursor-pointer block"
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
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
      <BackToTopButton />
    </>
  );
}
