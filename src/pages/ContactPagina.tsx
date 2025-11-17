import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { documentsApi } from '../lib/api-clean';

interface Document {
  id: number;
  title: string;
  description?: string;
  file: string;
  category: string;
  display_order: number;
}

export default function ContactPagina() {
  const navigate = useNavigate();
  
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getAll,
  });

  return (
    <div className="min-h-screen bg-beige">
      <NavBar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-paars mb-4">
              Contact
            </h1>
            <p className="text-xl text-paars/70">
              Neem contact met ons op voor vragen, suggesties of informatie
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informatie Section */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-oranje">
              <h2 className="text-3xl font-bold text-paars mb-6">
                Informatie
              </h2>
              
              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-oranje flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📍</span>
                  </div>
                  <div>
                    <p className="text-paars font-medium">
                      Rachelsmolen 1, 5612MA Eindhoven
                    </p>
                  </div>
                </div>

                {/* KvK */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-oranje flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <p className="text-paars font-medium">
                      KvK nr. 70280606
                    </p>
                  </div>
                </div>

                {/* Kalender */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-oranje flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div>
                    <a 
                      href="/activiteiten"
                      className="text-paars font-medium hover:text-oranje transition-colors"
                    >
                      Kalender
                    </a>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="border-t-2 border-oranje/20 pt-6">
                  <h3 className="font-semibold text-paars mb-4 flex items-center gap-2">
                    <span className="text-2xl">📄</span>
                    Documenten
                  </h3>
                  <div className="space-y-3 ml-14">
                    {documentsLoading ? (
                      <p className="text-paars/60 text-sm">Laden...</p>
                    ) : documents && documents.length > 0 ? (
                      documents.map((doc: Document) => {
                        // Construct file download URL
                        const fileUrl = `${import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl'}/assets/${doc.file}`;
                        
                        return (
                          <a 
                            key={doc.id}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-paars/80 hover:text-oranje transition-colors group"
                            title={doc.description || doc.title}
                          >
                            <span className="group-hover:translate-x-1 inline-block transition-transform">→</span> {doc.title}
                          </a>
                        );
                      })
                    ) : (
                      <p className="text-paars/60 text-sm">Geen documenten beschikbaar</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-geel">
              <h2 className="text-3xl font-bold text-paars mb-6">
                Contact
              </h2>
              
              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-geel flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <div>
                    <a 
                      href="mailto:info@salvemundi.nl"
                      className="text-paars font-medium hover:text-oranje transition-colors"
                    >
                      info@salvemundi.nl
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-geel flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div>
                    <a 
                      href="tel:+31624827777"
                      className="text-paars font-medium hover:text-oranje transition-colors"
                    >
                      +31 6 24827777
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-geel flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <a 
                      href="https://wa.me/31624827777"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-paars font-medium hover:text-oranje transition-colors"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                {/* Safe Havens Button */}
                <div className="border-t-2 border-geel/20 pt-6">
                  <button
                    onClick={() => navigate('/safe-havens')}
                    className="w-full bg-oranje text-beige rounded-2xl p-6 font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-lg flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-beige/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">�️</span>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold">Safe Havens</div>
                        <div className="text-sm text-beige/80">Veilig aanspreekpunt voor hulp</div>
                      </div>
                    </div>
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="mt-8 bg-white rounded-3xl shadow-xl p-8 border-4 border-paars">
            <h2 className="text-2xl font-bold text-paars mb-6 text-center">
              Volg Ons Op Social Media
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://www.instagram.com/salvemundi/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-oranje/10 border-2 border-oranje rounded-full hover:bg-oranje hover:text-beige transition-all text-paars font-semibold"
              >
                <span className="text-xl">📸</span>
                Instagram
              </a>
              <a 
                href="https://www.facebook.com/salvemundi/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 bg-oranje/10 border-2 border-oranje rounded-full hover:bg-oranje hover:text-beige transition-all text-paars font-semibold"
              >
                <span className="text-xl">👍</span>
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
