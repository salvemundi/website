import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserEventSignups } from '../lib/auth';
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
  };
}

export default function AccountPagina() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [eventSignups, setEventSignups] = useState<EventSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-paars text-xl font-semibold">Loading...</div>
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
                    {user.first_name} {user.last_name}
                  </h1>
                  <div className="flex items-center gap-2">
                    {user.is_member ? (
                      <span className="px-3 py-1 bg-geel text-paars text-sm font-semibold rounded-full">
                        Active Member
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-paars text-sm font-semibold rounded-full">
                        Guest
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-paars text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
              >
                Logout
              </button>
            </div>

            <div className="border-t-2 border-oranje/20 pt-6">
              <h2 className="text-lg font-semibold text-paars mb-4">Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-paars/70 font-semibold">Email</p>
                  <p className="font-medium text-paars">{user.email}</p>
                </div>
                
                {user.fontys_email && (
                  <div>
                    <p className="text-sm text-paars/70 font-semibold">Fontys Email</p>
                    <p className="font-medium text-paars">{user.fontys_email}</p>
                  </div>
                )}
                
                {user.phone_number && (
                  <div>
                    <p className="text-sm text-paars/70 font-semibold">Phone Number</p>
                    <p className="font-medium text-paars">{user.phone_number}</p>
                  </div>
                )}

                {user.entra_id && (
                  <div>
                    <p className="text-sm text-paars/70 font-semibold">Login Method</p>
                    <p className="font-medium text-paars">Microsoft Account</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Signups Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-oranje">
            <h2 className="text-2xl font-bold text-paars mb-6">My Event Registrations</h2>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-paars">Loading your registrations...</div>
              </div>
            ) : eventSignups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-paars mb-4">You haven't registered for any events yet.</div>
                <button
                  onClick={() => navigate('/activiteiten')}
                  className="px-6 py-3 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md"
                >
                  Browse Events
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
                      <p className="text-sm text-paars/70 mb-2">
                        Event Date: {format(new Date(signup.event_id.event_date), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-paars/50">
                        Registered on: {format(new Date(signup.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/activiteiten')}
                      className="px-4 py-2 text-oranje border-2 border-oranje rounded-full font-semibold hover:bg-oranje hover:text-beige transition-all"
                    >
                      View Details
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
