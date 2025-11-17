import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserEventSignups, updateMinecraftUsername } from '../lib/auth';
import { getImageUrl } from '../lib/api-clean';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { format } from 'date-fns';

interface EventSignup {
  id: number;
  created_at: string;
  event_id: {
    id: number;
    name: string;
    event_date: string;
    description: string;
    image?: string;
    contact_phone?: string;
    contact_name?: string;
  };
}

export default function AccountPagina() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser } = useAuth();
  const [eventSignups, setEventSignups] = useState<EventSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [isEditingMinecraft, setIsEditingMinecraft] = useState(false);
  const [isSavingMinecraft, setIsSavingMinecraft] = useState(false);

  useEffect(() => {
    if (user?.minecraft_username) {
      setMinecraftUsername(user.minecraft_username);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user?.id) {
      loadEventSignups();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadEventSignups = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const signups = await getUserEventSignups(user.id);
      setEventSignups(signups);
    } catch (error) {
      console.error('Failed to load event signups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveMinecraftUsername = async () => {
    if (!user?.id) return;
    
    setIsSavingMinecraft(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');
      
      await updateMinecraftUsername(user.id, minecraftUsername, token);
      await refreshUser();
      setIsEditingMinecraft(false);
    } catch (error) {
      console.error('Failed to update minecraft username:', error);
      alert('Kon Minecraft gebruikersnaam niet bijwerken. Probeer het opnieuw.');
    } finally {
      setIsSavingMinecraft(false);
    }
  };

  const getMembershipStatusDisplay = () => {
    if (!user?.membership_status || user.membership_status === 'none') {
      return { text: 'Geen Actief Lidmaatschap', color: 'bg-gray-400', textColor: 'text-white' };
    }
    if (user.membership_status === 'active') {
      return { text: 'Actief Lid', color: 'bg-geel', textColor: 'text-paars' };
    }
    return { text: 'Lidmaatschap Verlopen', color: 'bg-oranje/50', textColor: 'text-paars' };
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-paars text-xl font-semibold">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige">
      <NavBar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Profile Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-4 border-oranje">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                {user.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-oranje"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-geel flex items-center justify-center border-4 border-oranje">
                    <span className="text-3xl font-bold text-paars">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </span>
                  </div>
                )}
                
                <div>
                  <h1 className="text-3xl font-bold text-paars mb-2">
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.email || 'User'}
                  </h1>
                  {(!user.first_name || !user.last_name) && (
                    <p className="text-sm text-paars/70 mb-2">
                      (Naam niet ingesteld)
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.is_member ? (
                      <span className="px-3 py-1 bg-geel text-paars text-sm font-semibold rounded-full">
                        Fontys Student
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-oranje/20 text-paars text-sm font-semibold rounded-full">
                        Geregistreerde Gebruiker
                      </span>
                    )}
                    <span className={`px-3 py-1 ${getMembershipStatusDisplay().color} ${getMembershipStatusDisplay().textColor} text-sm font-semibold rounded-full`}>
                      {getMembershipStatusDisplay().text}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Admin Panel Button - Only for Microsoft users */}
                {user.entra_id && (
                  <a
                    href="https://admin.salvemundi.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-geel text-paars rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md text-center"
                  >
                    Admin Panel
                  </a>
                )}
                
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-paars text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  Uitloggen
                </button>
              </div>
            </div>

            <div className="border-t-2 border-oranje/20 pt-6">
              <h2 className="text-lg font-semibold text-paars mb-4">Account Informatie</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-paars/70 font-semibold">E-mail</p>
                  <p className="font-medium text-paars">{user.email}</p>
                </div>
                
                {user.fontys_email && (
                  <div>
                    <p className="text-sm text-paars/70 font-semibold">Fontys E-mail</p>
                    <p className="font-medium text-paars">{user.fontys_email}</p>
                  </div>
                )}
                
                {user.phone_number && (
                  <div>
                    <p className="text-sm text-paars/70 font-semibold">Telefoonnummer</p>
                    <p className="font-medium text-paars">{user.phone_number}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-paars/70 font-semibold">Inlogmethode</p>
                  <p className="font-medium text-paars">
                    {user.entra_id ? 'Microsoft Account' : 'E-mail & Wachtwoord'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-paars/70 font-semibold mb-1">Minecraft Gebruikersnaam</p>
                  {isEditingMinecraft ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={minecraftUsername}
                        onChange={(e) => setMinecraftUsername(e.target.value)}
                        className="flex-1 px-3 py-1 text-sm border-2 border-oranje rounded-lg focus:outline-none focus:border-paars"
                        placeholder="Minecraft gebruikersnaam"
                      />
                      <button
                        onClick={handleSaveMinecraftUsername}
                        disabled={isSavingMinecraft}
                        className="px-3 py-1 text-sm bg-geel text-paars rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50"
                      >
                        {isSavingMinecraft ? '...' : '✓'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingMinecraft(false);
                          setMinecraftUsername(user.minecraft_username || '');
                        }}
                        className="px-3 py-1 text-sm bg-gray-200 text-paars rounded-lg font-semibold hover:bg-gray-300 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <p className="font-medium text-paars text-sm flex-1">
                        {user.minecraft_username || 'Niet ingesteld'}
                      </p>
                      <button
                        onClick={() => setIsEditingMinecraft(true)}
                        className="px-3 py-1 text-xs bg-oranje/20 text-paars rounded-lg font-semibold hover:bg-oranje/30 transition-all"
                      >
                        {user.minecraft_username ? 'Bewerken' : 'Toevoegen'}
                      </button>
                    </div>
                  )}
                </div>

                {user.membership_expiry && (
                  <div>
                    <p className="text-sm text-paars/70 font-semibold">Lidmaatschap Geldig Tot</p>
                    <p className="font-medium text-paars">
                      {format(new Date(user.membership_expiry), 'd MMMM yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="border-t-2 border-oranje/20 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-paars mb-4">Snelle Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/account/transactions')}
                  className="p-4 border-2 border-oranje rounded-xl hover:bg-oranje/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💳</span>
                    <div>
                      <h3 className="font-semibold text-paars">Transacties</h3>
                      <p className="text-sm text-paars/70">Bekijk je betalingsgeschiedenis</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/account/whatsapp-groups')}
                  className="p-4 border-2 border-oranje rounded-xl hover:bg-oranje/10 transition-all text-left relative"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💬</span>
                    <div>
                      <h3 className="font-semibold text-paars flex items-center gap-2">
                        WhatsApp Groepen
                        {user.membership_status !== 'active' && (
                          <span className="text-xs px-2 py-0.5 bg-oranje/20 rounded-full">🔒</span>
                        )}
                      </h3>
                      <p className="text-sm text-paars/70">
                        {user.membership_status === 'active' ? 'Word lid van groepen' : 'Vereist actief lidmaatschap'}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/stickers')}
                  className="p-4 border-2 border-oranje rounded-xl hover:bg-oranje/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🗺️</span>
                    <div>
                      <h3 className="font-semibold text-paars">Sticker Map</h3>
                      <p className="text-sm text-paars/70">Bekijk en voeg sticker locaties toe</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Event Signups Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-oranje">
            <h2 className="text-2xl font-bold text-paars mb-6">Mijn Evenement Inschrijvingen</h2>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-paars">Je inschrijvingen worden geladen...</div>
              </div>
            ) : eventSignups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-paars mb-4">Je hebt je nog niet ingeschreven voor evenementen.</div>
                <button
                  onClick={() => navigate('/activiteiten')}
                  className="px-6 py-3 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  Bekijk Evenementen
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {eventSignups.map((signup) => (
                  <div
                    key={signup.id}
                    className="flex items-center gap-4 p-4 border-2 border-oranje/20 rounded-xl hover:border-oranje transition-all hover:shadow-md"
                  >
                    {signup.event_id.image ? (
                      <img
                        src={getImageUrl(signup.event_id.image)}
                        alt={signup.event_id.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-oranje"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-geel flex items-center justify-center border-2 border-oranje">
                        <span className="text-paars text-2xl">📅</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-paars mb-1">
                        {signup.event_id.name}
                      </h3>
                      <p className="text-sm text-paars/70 mb-1">
                        Evenement Datum: {format(new Date(signup.event_id.event_date), 'd MMMM yyyy')}
                      </p>
                      {signup.event_id.contact_phone && (
                        <p className="text-sm text-paars/70 mb-1">
                          📞 Contact: {signup.event_id.contact_name && `${signup.event_id.contact_name} - `}
                          <a href={`tel:${signup.event_id.contact_phone}`} className="underline hover:text-oranje">
                            {signup.event_id.contact_phone}
                          </a>
                        </p>
                      )}
                      <p className="text-xs text-paars/50">
                        Ingeschreven op: {format(new Date(signup.created_at), 'd MMMM yyyy')}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/activiteiten')}
                      className="px-4 py-2 text-oranje border-2 border-oranje rounded-full font-semibold hover:bg-oranje hover:text-beige transition-all"
                    >
                      Bekijk Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
