import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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

export default function ActiviteitenPagina() {
  const { data: events = [], isLoading, error } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();

  // Cart: array of { activity, email, name, studentNumber }
  const [cart, setCart] = useState<Array<{ activity: any; email: string; name: string; studentNumber: string }>>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

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

  // Add ticket to cart (quick signup without modal)
  const handleSignup = (activity: any) => {
    setCart((prev) => [...prev, { activity, email: "", name: "", studentNumber: "" }]);
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
  const handleModalSignup = (data: { activity: any; email: string; name: string; studentNumber: string }) => {
    setCart((prev) => [...prev, data]);
  };

  // Update email for a ticket
  const handleEmailChange = (index: number, email: string) => {
    setCart((prev) => prev.map((item, i) => i === index ? { ...item, email } : item));
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

      <main className="w-full p-4 sm:p-6 lg:p-10 bg-beige">
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
          <Countdown targetDate="2025-09-11T15:00:00Z" title="BIERPROEVERIJ" />
          <section className="w-full rounded-3xl">
            <h2 className="text-2xl font-bold text-geel mb-4">
              Komende Activiteiten
            </h2>

            
            <div className="flex flex-row md:flex-row gap-6">
              <div className=" grid grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="col-span-3 text-center py-10">
                    <p className="text-lg text-gray-600">Activiteiten laden...</p>
                  </div>
                ) : error ? (
                  <div className="col-span-3 text-center py-10">
                    <p className="text-lg text-red-600">Fout bij laden van activiteiten</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="col-span-3 text-center py-10">
                    <p className="text-lg text-gray-600">Geen aankomende activiteiten</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <ActiviteitCard
                      key={event.id}
                      description={event.description}
                      image={getImageUrl(event.image)}
                      date={event.event_date}
                      title={event.name}
                      price={Number(event.price_members) || 0}
                      onSignup={() => handleSignup(event)}
                      onShowDetails={() => handleShowDetails(event)}
                    />
                  ))
                )}
              </div>
              {/* Sidebar */}
              <div className="lg:w-80 w-full order-first lg:order-none">
                <CartSidebar
                  cart={cart}
                  onEmailChange={handleEmailChange}
                  onRemoveTicket={handleRemoveTicket}
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
          onSignup={handleModalSignup}
        />
      )}
    </>
  );
}