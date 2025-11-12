import React, { useState } from "react";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import ActiviteitCard from "../components/ActiviteitCard";
import Countdown from "../components/CountDown";
import CartSidebar from "../components/CardSidebar";
import Footer from "../components/Footer";
import ActiviteitDetailModal from "../components/ActiviteitDetailModal";

export default function ActiviteitenPagina() {
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
                <ActiviteitCard
                  description="Pubquiz & borrel in de Kroto! Doe mee met de gezelligste quiz van het jaar. Test je kennis, win geweldige prijzen en geniet van een gezellige avond met medestudenten!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="15 september 2025"
                  title="Pubquiz & Borrel"
                  price={5.00}
                  onSignup={handleSignup}
                  onShowDetails={() => handleShowDetails({
                    title: "Pubquiz & Borrel",
                    date: "15 september 2025",
                    time: "20:00 - 23:30",
                    location: "Café de Kroto",
                    description: "Pubquiz & borrel in de Kroto! Doe mee met de gezelligste quiz van het jaar. Test je kennis, win geweldige prijzen en geniet van een gezellige avond met medestudenten! De quiz bestaat uit verschillende rondes met gevarieerde onderwerpen. Aansluitend is er een borrel waar je kunt napraten over de vragen en antwoorden.",
                    price: 5.00,
                    capacity: 80,
                    organizer: "Feestcommissie",
                    image: "/img/backgrounds/Kroto2025.jpg"
                  })}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                  onShowDetails={() => handleShowDetails({
                    title: "Feestavond",
                    date: "20 september 2025",
                    time: "21:00 - 02:00",
                    location: "Studentenvereniging",
                    description: "Nog een activiteit met veel gezelligheid! Dans de hele nacht door op de beste hits en geniet van goede sfeer met je medestudenten.",
                    price: 7.50,
                    capacity: 120,
                    organizer: "Feestcommissie",
                    image: "/img/backgrounds/Kroto2025.jpg"
                  })}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                  onShowDetails={() => handleShowDetails({
                    title: "Feestavond",
                    date: "20 september 2025",
                    time: "21:00 - 02:00",
                    location: "Studentenvereniging",
                    description: "Nog een activiteit met veel gezelligheid! Dans de hele nacht door op de beste hits en geniet van goede sfeer met je medestudenten.",
                    price: 7.50,
                    capacity: 120,
                    organizer: "Feestcommissie",
                    image: "/img/backgrounds/Kroto2025.jpg"
                  })}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                  onShowDetails={() => handleShowDetails({
                    title: "Feestavond",
                    date: "20 september 2025",
                    time: "21:00 - 02:00",
                    location: "Studentenvereniging",
                    description: "Nog een activiteit met veel gezelligheid! Dans de hele nacht door op de beste hits en geniet van goede sfeer met je medestudenten.",
                    price: 7.50,
                    capacity: 120,
                    organizer: "Feestcommissie",
                    image: "/img/backgrounds/Kroto2025.jpg"
                  })}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                  onShowDetails={() => handleShowDetails({
                    title: "Feestavond",
                    date: "20 september 2025",
                    time: "21:00 - 02:00",
                    location: "Studentenvereniging",
                    description: "Nog een activiteit met veel gezelligheid! Dans de hele nacht door op de beste hits en geniet van goede sfeer met je medestudenten.",
                    price: 7.50,
                    capacity: 120,
                    organizer: "Feestcommissie",
                    image: "/img/backgrounds/Kroto2025.jpg"
                  })}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                  onShowDetails={() => handleShowDetails({
                    title: "Feestavond",
                    date: "20 september 2025",
                    time: "21:00 - 02:00",
                    location: "Studentenvereniging",
                    description: "Nog een activiteit met veel gezelligheid! Dans de hele nacht door op de beste hits en geniet van goede sfeer met je medestudenten.",
                    price: 7.50,
                    capacity: 120,
                    organizer: "Feestcommissie",
                    image: "/img/backgrounds/Kroto2025.jpg"
                  })}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                  onShowDetails={() => handleShowDetails({
                    title: "Feestavond",
                    date: "20 september 2025",
                    time: "21:00 - 02:00",
                    location: "Studentenvereniging",
                    description: "Nog een activiteit met veel gezelligheid! Dans de hele nacht door op de beste hits en geniet van goede sfeer met je medestudenten.",
                    price: 7.50,
                    capacity: 120,
                    organizer: "Feestcommissie",
                    image: "/img/backgrounds/Kroto2025.jpg"
                  })}
                />
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