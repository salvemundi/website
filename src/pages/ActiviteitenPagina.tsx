import React, { useState } from "react";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import ActiviteitCard from "../components/ActiviteitCard";
import Countdown from "../components/CountDown";
import CartSidebar from "../components/CardSidebar";
import Footer from "../components/Footer";
import ActiviteitDetailModal from "../components/ActiviteitDetailModal";
import { useEvents } from "../hooks/useApi";
import { getImageUrl } from "../lib/api";

export default function ActiviteitenPagina() {
  const { data: events = [], isLoading, error } = useEvents();

  // Cart: array of { activity, email, name, studentNumber }
  const [cart, setCart] = useState<Array<{ activity: any; email: string; name: string; studentNumber: string }>>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);


  // Add ticket to cart (quick signup without modal)
  const handleSignup = (activity: any) => {
    setCart((prev) => [...prev, { activity, email: "", name: "", studentNumber: "" }]);
  };

  // Open modal with activity details
  const handleShowDetails = (activity: any) => {
    setSelectedActivity(activity);
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

      <main className="flex w-full gap-6 p-6 sm:p-10 bg-beige">
        <div className="flex-1 flex flex-col gap-6">
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
              
                        <CartSidebar
              cart={cart}
              onEmailChange={handleEmailChange}
              onRemoveTicket={handleRemoveTicket}
                        />
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