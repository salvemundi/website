import React, { useState } from "react";
import Navbar from "../components/NavBar";
import Header from "../components/header";
import BackToTopButton from "../components/backtotop";
import ActiviteitCard from "../components/ActiviteitCard";
import Countdown from "../components/CountDown";
import CartSidebar from "../components/CardSidebar";

export default function ActiviteitenPagina() {
  // Cart: array of { activity, email }
  const [cart, setCart] = useState<Array<{ activity: any; email: string }>>([]);

  // Add ticket to cart
  const handleSignup = (activity: any) => {
    setCart((prev) => [...prev, { activity, email: "" }]);
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
                  description="Pubquiz & borrel in de Kroto! Doe mee met de gezelligste quiz van het jaar."
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="15 september 2025"
                  title="Pubquiz & Borrel"
                  price={5.00}
                  onSignup={handleSignup}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
                />
                <ActiviteitCard
                  description="Nog een activiteit met veel gezelligheid!"
                  image="/img/backgrounds/Kroto2025.jpg"
                  date="20 september 2025"
                  title="Feestavond"
                  price={7.50}
                  onSignup={handleSignup}
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

      <BackToTopButton />
    </>
  );
}