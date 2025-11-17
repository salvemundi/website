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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <NavBar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                {user.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-purple-200 flex items-center justify-center border-4 border-purple-300">
                    <span className="text-3xl font-bold text-purple-600">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </span>
                  </div>
                )}
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.first_name} {user.last_name}
                  </h1>
                  <div className="flex items-center gap-2">
                    {user.is_member ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                        Active Member
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                        Guest
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
                
                {user.fontys_email && (
                  <div>
                    <p className="text-sm text-gray-600">Fontys Email</p>
                    <p className="font-medium text-gray-900">{user.fontys_email}</p>
                  </div>
                )}
                
                {user.phone_number && (
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium text-gray-900">{user.phone_number}</p>
                  </div>
                )}

                {user.entra_id && (
                  <div>
                    <p className="text-sm text-gray-600">Login Method</p>
                    <p className="font-medium text-gray-900">Microsoft Account</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Signups Section */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Event Registrations</h2>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading your registrations...</div>
              </div>
            ) : eventSignups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-600 mb-4">You haven't registered for any events yet.</div>
                <button
                  onClick={() => navigate('/activiteiten')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {eventSignups.map((signup) => (
                  <div
                    key={signup.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    {signup.event_id.image ? (
                      <img
                        src={getImageUrl(signup.event_id.image)}
                        alt={signup.event_id.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 text-2xl">📅</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {signup.event_id.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Event Date: {format(new Date(signup.event_id.event_date), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Registered on: {format(new Date(signup.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/activiteiten')}
                      className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
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
