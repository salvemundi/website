import { useQuery } from '@tanstack/react-query';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { safeHavensApi, getImageUrl } from '../lib/api-clean';

interface SafeHaven {
  id: number;
  contact_name: string;
  email?: string;
  phone_number?: string;
  image?: string;
  member_id?: {
    first_name: string;
    last_name: string;
  };
}

export default function SafeHavensPagina() {
  const { data: safeHavens, isLoading, error } = useQuery({
    queryKey: ['safe-havens'],
    queryFn: safeHavensApi.getAll,
  });

  const topics = [
    { icon: '🚫', text: 'Aggressie / geweld' },
    { icon: '⚠️', text: '(Seksuele) Intimidatie' },
    { icon: '😔', text: 'Pesten' },
    { icon: '🤝', text: 'Discriminatie' },
    { icon: '🛑', text: '(Seksueel) Grensoverschrijdend gedrag' },
    { icon: '💬', text: 'Persoonlijke situaties' },
  ];

  return (
    <div className="min-h-screen bg-beige">
      <NavBar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 px-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-paars mb-4">
              Safe Havens
            </h1>
            <p className="text-lg sm:text-xl text-paars/70 max-w-3xl mx-auto">
              Een veilig aanspreekpunt voor jouw zorgen en vragen
            </p>
          </div>

          {/* Introduction Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 mb-12 border-4 border-oranje">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-oranje flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">🛡️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-paars mb-4 text-center md:text-left">
                    Wat zijn Safe Havens?
                  </h2>
                  <p className="text-paars/80 leading-relaxed mb-4 text-justify md:text-left">
                    Binnen Salve Mundi vinden wij een veilige en comfortable omgeving heel belangrijk voor al onze leden. 
                    Hierom hebben wij Safe Havens aangesteld die een luisterend oor bieden, begrip tonen, en advies geven 
                    voor jouw situatie.
                  </p>
                  <div className="bg-geel/20 border-2 border-geel rounded-xl p-4">
                    <p className="text-paars font-semibold flex items-center gap-2">
                      <span className="text-2xl">🔒</span>
                      Een Safe Haven heeft een <strong>geheimhoudingsplicht</strong>
                    </p>
                    <p className="text-paars/80 text-sm mt-2">
                      Jouw klachten of meldingen zullen nooit verspreid worden, ook niet naar het bestuur; 
                      Tenzij door jou anders aangegeven.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Topics Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 mb-12 border-4 border-geel">
            <h2 className="text-2xl font-bold text-paars mb-6 text-center px-2">
              Waar Kun Je Bij Ons Terecht?
            </h2>
            <p className="text-paars/70 text-center mb-6 px-2">
              Onze Safe Havens zijn er voor (maar niet gelimiteerd tot):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-oranje/10 rounded-xl border-2 border-oranje/20 hover:border-oranje transition-all"
                >
                  <span className="text-3xl">{topic.icon}</span>
                  <span className="text-paars font-medium">{topic.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-paars/5 rounded-xl border-2 border-paars/20">
              <p className="text-paars/80 text-center">
                We streven ernaar dat deze personen verschillen van geslacht en dat wij Safe Havens zowel binnen 
                als buiten het bestuur hebben. Zo hopen we dat er altijd iemand is waar je je veilig genoeg bij 
                voelt om je klachten of meldingen mee te delen.
              </p>
            </div>
          </div>

          {/* Safe Havens Cards Section */}
          {isLoading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-oranje border-t-transparent"></div>
              <p className="mt-4 text-paars">Safe Havens laden...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl mb-12">
              <p className="font-semibold">Er is een fout opgetreden bij het laden van de Safe Havens.</p>
              <p className="text-sm mt-2">Probeer de pagina opnieuw te laden.</p>
            </div>
          )}

          {safeHavens && safeHavens.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-paars mb-8 text-center">
                Onze Safe Havens
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {safeHavens.map((safeHaven: SafeHaven) => (
                  <div
                    key={safeHaven.id}
                    className="bg-white rounded-3xl shadow-xl p-6 border-4 border-oranje hover:border-geel transition-all hover:shadow-2xl hover:scale-105 transform"
                  >
                    {/* Profile Image */}
                    {safeHaven.image ? (
                      <img
                        src={getImageUrl(safeHaven.image)}
                        alt={safeHaven.contact_name}
                        className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-geel"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-geel flex items-center justify-center mx-auto mb-4 border-4 border-oranje">
                        <span className="text-4xl text-paars font-bold">
                          {safeHaven.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                    )}

                    {/* Badge */}
                    <div className="text-center mb-2">
                      <span className="inline-block px-3 py-1 bg-oranje text-beige text-sm font-semibold rounded-full">
                        Safe Haven
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-2xl font-bold text-paars text-center mb-4">
                      {safeHaven.contact_name}
                    </h3>

                    {/* Contact Info */}
                    {(safeHaven.email || safeHaven.phone_number) && (
                      <div className="border-t-2 border-oranje/20 pt-4 space-y-3">
                        {/* Email */}
                        {safeHaven.email && (
                          <a
                            href={`mailto:${safeHaven.email}`}
                            className="flex items-center justify-center gap-3 text-paars hover:text-oranje transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-full bg-geel flex items-center justify-center flex-shrink-0 group-hover:bg-oranje transition-colors">
                              <span className="text-lg">✉️</span>
                            </div>
                            <span className="text-sm font-medium break-all">{safeHaven.email}</span>
                          </a>
                        )}
                        
                        {/* Phone */}
                        {safeHaven.phone_number && (
                          <a
                            href={`tel:${safeHaven.phone_number}`}
                            className="flex items-center justify-center gap-3 text-paars hover:text-oranje transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-full bg-geel flex items-center justify-center flex-shrink-0 group-hover:bg-oranje transition-colors">
                              <span className="text-lg">📞</span>
                            </div>
                            <span className="text-sm font-medium">{safeHaven.phone_number}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {safeHavens && safeHavens.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-white rounded-3xl shadow-xl p-8 border-4 border-oranje">
              <div className="text-6xl mb-4">🛡️</div>
              <p className="text-xl text-paars mb-4">Safe Havens worden binnenkort toegevoegd</p>
              <p className="text-paars/70">Check deze pagina later opnieuw.</p>
            </div>
          )}

          {/* Alternative Contact Section */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-4 border-paars">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-paars flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏫</span>
              </div>
              <h2 className="text-2xl font-bold text-paars mb-4">
                Voel Je Je Niet Veilig Genoeg?
              </h2>
              <p className="text-paars/80 mb-6">
                Als je je niet veilig genoeg voelt om bij onze Safe Havens terecht te komen, 
                ben vooral niet bang om rechtstreeks naar Fontys zelf te stappen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://www.fontys.nl/fontyshelpt.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-paars text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  Fontys Vertrouwenspersoon
                </a>
                <a
                  href="mailto:bestuur@salvemundi.nl"
                  className="px-6 py-3 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  Contact Bestuur
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
