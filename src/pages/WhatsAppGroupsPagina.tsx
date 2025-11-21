import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWhatsAppGroups } from '../lib/auth';
import { WhatsAppGroup } from '../types';

export default function WhatsAppGroupsPagina() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user?.id) {
      loadWhatsAppGroups();
    }
  }, [user]);

  const loadWhatsAppGroups = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const data = await getWhatsAppGroups(token, true);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load WhatsApp groups:', error);
      // Don't show error if it's just that the collection doesn't exist yet
      if (error instanceof Error && error.message.includes('Failed to fetch WhatsApp groups')) {
        setGroups([]);
      } else {
        setError('Kon WhatsApp groepen niet laden. Probeer het later opnieuw.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = (inviteLink: string) => {
    window.open(inviteLink, '_blank', 'noopener,noreferrer');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-paars text-xl font-semibold">Laden...</div>
      </div>
    );
  }

  // Extra check for membership status
  if (user.membership_status !== 'active') {
    return (
      <div className="min-h-screen bg-beige">

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-oranje text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-3xl font-bold text-paars mb-4">Actief Lidmaatschap Vereist</h1>
              <p className="text-paars/70 mb-6">
                WhatsApp groepen zijn alleen beschikbaar voor leden met een actief lidmaatschap.
                Vernieuw je lidmaatschap om toegang te krijgen tot deze groepen.
              </p>
              <button
                onClick={() => navigate('/account')}
                className="px-6 py-3 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
              >
                Terug naar Account
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige">

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/account')}
              className="mb-4 flex items-center gap-2 text-paars hover:text-oranje transition-colors"
            >
              <span>←</span>
              <span>Terug naar Account</span>
            </button>
            <h1 className="text-4xl font-bold text-paars mb-2">WhatsApp Groepen</h1>
            <p className="text-paars/70">Word lid van onze WhatsApp groepen om verbonden te blijven</p>
          </div>

          {/* Info Banner */}
          <div className="bg-geel/20 border-2 border-geel rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-3xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-paars mb-2">Over WhatsApp Groepen</h3>
                <p className="text-paars/80 text-sm">
                  Deze groepen zijn exclusief voor actieve leden. Klik op een groep om via WhatsApp lid te worden.
                  Wees respectvol en volg de groepsregels.
                </p>
              </div>
            </div>
          </div>

          {/* Groups Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-oranje">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-paars">WhatsApp groepen worden geladen...</div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={loadWhatsAppGroups}
                  className="px-6 py-3 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  Probeer Opnieuw
                </button>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <div className="text-paars mb-4 font-semibold">Momenteel geen WhatsApp groepen beschikbaar.</div>
                <p className="text-paars/70 text-sm mb-4">
                  Kom later terug voor nieuwe groepen om lid van te worden!
                </p>
                <div className="mt-6 p-4 bg-geel/10 rounded-xl max-w-md mx-auto">
                  <p className="text-xs text-paars/60">
                    💡 Let op: WhatsApp groepen worden binnenkort toegevoegd. Je kunt lid worden van groepen zodra deze door de beheerders zijn ingesteld.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-6 border-2 border-oranje/20 rounded-2xl hover:border-oranje transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-geel flex items-center justify-center flex-shrink-0 border-2 border-oranje">
                        <span className="text-3xl">💬</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-paars mb-2">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-paars/70">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-oranje/10">
                      <div className="flex items-center gap-2 text-sm text-paars/70">
                        <span className="px-2 py-1 bg-geel/30 rounded-full text-xs font-semibold">
                          Alleen Leden
                        </span>
                      </div>
                      <button
                        onClick={() => handleJoinGroup(group.invite_link)}
                        className="px-6 py-2 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md flex items-center gap-2"
                      >
                        <span>Word Lid</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-white rounded-2xl p-6 border-2 border-oranje/20">
            <h3 className="font-semibold text-paars mb-3">Groepsregels</h3>
            <ul className="space-y-2 text-sm text-paars/80">
              <li className="flex items-start gap-2">
                <span className="text-geel mt-1">•</span>
                <span>Wees respectvol naar alle leden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-geel mt-1">•</span>
                <span>Houd gesprekken relevant voor het groepsonderwerp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-geel mt-1">•</span>
                <span>Geen spam of promotionele inhoud</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-geel mt-1">•</span>
                <span>Volg de gedragscode van Salve Mundi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
