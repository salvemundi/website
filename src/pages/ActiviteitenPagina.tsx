import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import ActiviteitCard from "../components/ActiviteitCard";
// Fixed import casing (file is Countdown.tsx)
import Countdown from "../components/Countdown";
import CartSidebar from "../components/CardSidebar";
import Footer from "../components/Footer";
import ActiviteitDetailModal from "../components/ActiviteitDetailModal";
import { useEvents } from "../hooks/useApi";
import { getImageUrl } from "../lib/api";
import { createEventSignup } from "../lib/auth";

export default function ActiviteitenPagina() {
  const { data: events = [], isLoading, error } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [userSignups, setUserSignups] = useState<number[]>([]);

  // Cart: array of { activity, email, name, studentNumber }
  const [cart, setCart] = useState<Array<{ activity: any; email: string; name: string; studentNumber: string }>>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Toggle for showing past activities
  const [showPastActivities, setShowPastActivities] = useState(false);

  // Calculate next activity and sort events
  const { nextActivity, upcomingEvents, pastEvents } = useMemo(() => {
    if (!events || events.length === 0) {
      return { nextActivity: null, upcomingEvents: [], pastEvents: [] };
    }
    
    const now = new Date();
    const upcoming = events
      .filter(event => new Date(event.event_date) > now)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    
    const past = events
      .filter(event => new Date(event.event_date) <= now)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    
    return {
      nextActivity: upcoming.length > 0 ? upcoming[0] : null,
      upcomingEvents: upcoming,
      pastEvents: past
    };
  }, [events]);

  // Combine events based on toggle
  const displayedEvents = useMemo(() => {
    if (showPastActivities) {
      return [...upcomingEvents, ...pastEvents];
    }
    return upcomingEvents;
  }, [upcomingEvents, pastEvents, showPastActivities]);

  // Check for event query parameter and open modal automatically
  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === parseInt(eventId));
      if (event) {
        handleShowDetails(event);
        // Clear the query parameter after opening the modal without adding to history
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, events]);

  // Load current user's signups to mark cards
  useEffect(() => {
    let mounted = true;
    async function loadSignups() {
      if (!user) {
        if (mounted) setUserSignups([]);
        return;
      }
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_DIRECTUS_URL}/items/event_signups?filter[directus_relations][_eq]=${user.id}&fields=event_id.id&limit=-1`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } }
        );
        const data = await resp.json();
        const ids = (data.data || []).map((s: any) => s.event_id?.id || s.event_id).filter(Boolean);
        if (mounted) setUserSignups(ids);
      } catch (e) {
        console.error('Failed to load user signups', e);
        if (mounted) setUserSignups([]);
      }
    }
    loadSignups();
    return () => { mounted = false; };
  }, [user]);

  // Add ticket to cart (quick signup without modal)
  const handleSignup = async (activity: any) => {
    // Check if activity is already in the cart
    const isInCart = cart.some(item => 
      (item.activity.id && item.activity.id === activity.id) ||
      (item.activity.title === (activity.name || activity.title))
    );
    
    if (isInCart) {
      // Show modal that activity is already in cart
      handleShowDetails(activity);
      return;
    }

    // Check if user is already signed up for this activity
    if (user && activity.id) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_DIRECTUS_URL}/items/event_signups?filter[event_id][_eq]=${activity.id}&filter[user_id][_eq]=${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          }
        );
        
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
          // User is already signed up, show modal
          handleShowDetails(activity);
          return;
        }
      } catch (error) {
        console.error('Error checking signup status:', error);
        // Continue with signup even if check fails
      }
    }
    
    // Normalize the activity object to ensure consistent naming
    const normalizedActivity = {
      ...activity,
      title: activity.name || activity.title,
      price: Number(activity.price_members) || 0
    };
    
    // Pre-fill with user data if logged in
    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
    
    setCart((prev) => [...prev, { 
      activity: normalizedActivity, 
      email: user?.email || "", 
      name: fullName || "", 
      studentNumber: "" 
    }]);
  };

  // Open modal with activity details
  const handleShowDetails = (activity: any) => {
    // Process the activity data to include the full image URL
    const processedActivity = {
      ...activity,
      image: getImageUrl(activity.image)
    };
    setSelectedActivity(processedActivity);
    setIsModalOpen(true);
  };

  // Handle signup from modal
  const handleModalSignup = async (data: { activity: any; email: string; name: string; studentNumber: string }) => {
    // Check if activity is already in the cart
    const isInCart = cart.some(item => 
      (item.activity.id && item.activity.id === data.activity.id) ||
      (item.activity.title === (data.activity.name || data.activity.title))
    );
    
    if (isInCart) {
      // Activity already in cart, just close modal
      setIsModalOpen(false);
      return;
    }

    // Check if user is already signed up for this activity
    if (user && data.activity.id) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_DIRECTUS_URL}/items/event_signups?filter[event_id][_eq]=${data.activity.id}&filter[user_id][_eq]=${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          }
        );
        
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
          // User is already signed up, don't add to cart
          setIsModalOpen(false);
          return;
        }
      } catch (error) {
        console.error('Error checking signup status:', error);
        // Continue with signup even if check fails
      }
    }
    
    // Normalize the activity object to ensure consistent naming
    const normalizedData = {
      ...data,
      activity: {
        ...data.activity,
        title: data.activity.name || data.activity.title,
        price: Number(data.activity.price_members) || Number(data.activity.price) || 0
      }
    };
    
    // Pre-fill email and name if not provided
    if (!normalizedData.email && user?.email) {
      normalizedData.email = user.email;
    }
    if (!normalizedData.name && user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      if (fullName) {
        normalizedData.name = fullName;
      }
    }
    
    setCart((prev) => [...prev, normalizedData]);
  };

  // Update email for a ticket
  const handleEmailChange = (index: number, email: string) => {
    setCart((prev) => prev.map((item, i) => i === index ? { ...item, email } : item));
  };

  // Update name for a ticket
  const handleNameChange = (index: number, name: string) => {
    setCart((prev) => prev.map((item, i) => i === index ? { ...item, name } : item));
  };

  // Update student number for a ticket
  const handleStudentNumberChange = (index: number, studentNumber: string) => {
    setCart((prev) => prev.map((item, i) => i === index ? { ...item, studentNumber } : item));
  };

  // Remove ticket from cart
  const handleRemoveTicket = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="flex h-screen flex-col w-full">
        <Navbar activePage="Activiteiten" />
        <Header
          title="ACTIVITEITEN"
          backgroundImage="/img/backgrounds/Kroto2025.jpg"
        />
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 bg-beige">
        <div className="flex flex-col gap-6 w-full">
          {nextActivity && (
            <Countdown 
              targetDate={nextActivity.event_date} 
              title={nextActivity.name}
              onSignup={() => handleShowDetails(nextActivity)}
            />
          )}
          <section className="w-full rounded-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-geel">
                {showPastActivities ? 'Alle Activiteiten' : 'Komende Activiteiten'}
              </h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowPastActivities(prev => !prev);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 shadow-md ${
                  showPastActivities 
                    ? 'bg-paars text-white hover:bg-opacity-90' 
                    : 'bg-geel text-paars hover:bg-opacity-90'
                }`}
              >
                {showPastActivities ? 'Verberg Afgelopen' : 'Toon Afgelopen'}
              </button>
            </div>

            
            <div className="flex flex-row md:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-6">
                {isLoading ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-gray-600">Activiteiten laden...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-red-600">Fout bij laden van activiteiten</p>
                  </div>
                ) : displayedEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-gray-600">Geen activiteiten gevonden</p>
                  </div>
                ) : (
                  <>
                    {/* Upcoming Activities */}
                    {upcomingEvents.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {upcomingEvents.map((event) => (
                          <ActiviteitCard
                            key={event.id}
                            description={event.description}
                            image={getImageUrl(event.image)}
                            date={event.event_date}
                            title={event.name}
                            price={Number(event.price_members) || 0}
                            isPast={false}
                            onSignup={() => handleSignup(event)}
                            onShowDetails={() => handleShowDetails(event)}
                            isSignedUp={isAuthenticated && userSignups.includes(event.id)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Separator */}
                    {showPastActivities && upcomingEvents.length > 0 && pastEvents.length > 0 && (
                      <div className="border-t-4 border-dashed border-paars opacity-50"></div>
                    )}
                    
                    {/* Past Activities */}
                    {showPastActivities && pastEvents.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {pastEvents.map((event) => (
                          <ActiviteitCard
                            key={event.id}
                            description={event.description}
                            image={getImageUrl(event.image)}
                            date={event.event_date}
                            title={event.name}
                            price={Number(event.price_members) || 0}
                            isPast={true}
                            onSignup={() => handleSignup(event)}
                            onShowDetails={() => handleShowDetails(event)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* Sidebar */}
              <div className="lg:w-80 w-full order-first lg:order-none">
                <CartSidebar
                  cart={cart}
                  onEmailChange={handleEmailChange}
                  onNameChange={handleNameChange}
                  onStudentNumberChange={handleStudentNumberChange}
                  onRemoveTicket={handleRemoveTicket}
                  onCheckoutComplete={() => setCart([])}
                />
              </div>
            </div>
      
          </section>
        </div>
        
      </main>

      <Footer />

      <BackToTopButton />

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <ActiviteitDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activity={selectedActivity}
          isPast={selectedActivity.event_date ? new Date(selectedActivity.event_date) <= new Date() : false}
          onSignup={handleModalSignup}
        />
      )}
    </>
  );
}