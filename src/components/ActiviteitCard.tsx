import React from "react";

// Assuming CardSidebar is a separate component and doesn't need to be imported here based on the original code
// import CardSidebar from "./CardSidebar";

// Define the shape of the props for type safety
interface ActiviteitCardProps {
  description: string;
  image?: string;
  date?: string;
  title: string;
  price: number;
  onSignup?: (data: { title: string; date?: string; description: string; price: number }) => void;
  onShowDetails?: () => void;
}

const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
  description,
  image,
  title,
  date,
  price,
  onSignup,
  onShowDetails,
}) => {
  return (
  <div className="bg-paars p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col max-w-full mx-auto overflow-hidden">
      {/* Image with rounded corners at the top */}
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-40 sm:h-48 object-cover rounded-xl mb-4"
        />
      )}

      {/* Content Section */}
      <div className="flex flex-col flex-grow text-white">
        {/* Header - Title, Date, and Price */}
        <div className="flex flex-row justify-between items-start mb-2 gap-3 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-geel leading-tight pr-2 sm:pr-4 break-words w-full sm:flex-1">
            {title}
          </h1>
          <div className="flex flex-col items-end whitespace-nowrap text-right ml-auto">
            {date && (
              <p className="text-xs sm:text-sm font-semibold text-white">{date}</p>
            )}
            <span className="text-base sm:text-lg font-bold text-white">€{price.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Description */}
  <p className="text-white text-sm sm:text-base mb-4 sm:mb-6 flex-grow break-words">{description}</p>
        
        {/* Footer - Buttons */}
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-auto w-full">
          {/* Details Button */}
          <button
            onClick={onShowDetails}
      className="bg-white text-paars font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-opacity-90 w-full sm:w-auto"
          >
            MEER INFO
          </button>
          
          {/* Sign-up Button */}
          <button
            onClick={() => onSignup?.({ title, date, description, price })}
      className="bg-geel text-white font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-opacity-80 w-full sm:w-auto"
          >
            AANMELDEN
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiviteitCard;