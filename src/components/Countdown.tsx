import React, { useState, useEffect } from 'react';

// Define the shape of the props for type safety
interface CountdownProps {
  targetDate: string; // ISO 8601 string for easy Date object creation
  title: string;
  onSignup?: () => void; // Optional callback for signup button
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, title, onSignup }) => {
  // Parse the target date string into a Date object
  const countdownDate = new Date(targetDate).getTime();

  // State to hold the countdown values
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set up an interval to update the countdown every second
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = countdownDate - now;

      // Calculate the time components
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Update the state
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [countdownDate]);

  // Helper function to format the number with a leading zero if it's a single digit
  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : `${time}`;
  };

  return (
    <section className="w-full bg-[#1A1A3C] rounded-3xl shadow-lg p-4 sm:p-8 text-white">
      <h2 className="text-xl sm:text-2xl font-bold text-[#FDD835] mb-3 sm:mb-4 text-center">Volgende Activiteit:</h2>
      <h3 className="text-2xl sm:text-4xl font-bold text-[#FDD835] mb-4 sm:mb-6 text-center">{title}</h3>
      <div className="flex w-full justify-between gap-2 sm:gap-4 text-center">
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="bg-[#5A3859] text-2xl sm:text-5xl font-bold text-white rounded-xl flex items-center justify-center w-full aspect-square sm:max-w-[140px] mx-auto">
            <span className="relative">
              {formatTime(timeLeft.days)}
              <span className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white hidden sm:block"></span>
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-[#FDD835] whitespace-nowrap">Dagen</p>
        </div>

        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="bg-[#5A3859] text-2xl sm:text-5xl font-bold text-white rounded-xl flex items-center justify-center w-full aspect-square sm:max-w-[140px] mx-auto">
            {formatTime(timeLeft.hours)}
          </div>
          <p className="mt-2 text-xs sm:text-sm text-[#FDD835] whitespace-nowrap">Uren</p>
        </div>

        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="bg-[#5A3859] text-2xl sm:text-5xl font-bold text-white rounded-xl flex items-center justify-center w-full aspect-square sm:max-w-[140px] mx-auto">
            {formatTime(timeLeft.minutes)}
          </div>
          <p className="mt-2 text-xs sm:text-sm text-[#FDD835] whitespace-nowrap">Minuten</p>
        </div>

        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="bg-[#5A3859] text-2xl sm:text-5xl font-bold text-white rounded-xl flex items-center justify-center w-full aspect-square sm:max-w-[140px] mx-auto">
            {formatTime(timeLeft.seconds)}
          </div>
          <p className="mt-2 text-xs sm:text-sm text-[#FDD835] whitespace-nowrap">Seconden</p>
        </div>
      </div>

      {onSignup && (
        <div className="flex justify-center mt-4 sm:mt-6">
          <button 
            onClick={onSignup}
            className="bg-[#5A3859] text-white py-2 px-6 rounded-lg text-base sm:text-lg hover:bg-opacity-80 hover:scale-105 transition-all duration-300 ease-in-out transform w-full sm:w-auto shadow-lg hover:shadow-xl"
          >
            Meld je Aan
          </button>
        </div>
      )}
    </section>
  );
};

export default Countdown;
