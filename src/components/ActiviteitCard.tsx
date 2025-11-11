import React from "react";

// Assuming CardSidebar is a separate component and doesn't need to be imported here based on the original code
// import CardSidebar from "./CardSidebar";

// Define the shape of the props for type safety
interface ActiviteitCardProps {
  description: string;
  image?: string;
  date?: string;
  title: string;
  price?: number;
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
    <div className="bg-paars p-6 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl duration-300 flex flex-col max-w-full mx-auto">
      {/* Image with rounded corners at the top */}
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      )}

      {/* Content Section */}
      <div className="flex flex-col flex-grow text-white">
        {/* Header - Title, Date, and Price */}
        <div className="flex flex-row justify-between items-start mb-2">
          <h1 className="text-xl font-bold text-geel leading-tight pr-4">{title}</h1>
          <div className="flex flex-col items-end whitespace-nowrap">
            {date && (
              <p className="text-sm font-semibold text-white">{date}</p>
            )}
            <span className="text-lg font-bold text-white">€{(Number(price) || 0).toFixed(2)}</span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-white text-base mb-6 flex-grow">{description}</p>
        
        {/* Footer - Buttons */}
        <div className="flex justify-between items-center gap-3 mt-auto">
          {/* Details Button */}
          <button
            onClick={onShowDetails}
            className="bg-white text-paars font-semibold px-6 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-opacity-90 flex-shrink-0"
          >
            MEER INFO
          </button>
          
          {/* Sign-up Button */}
          <button
            onClick={() => onSignup?.({ title, date, description, price })}
            className="bg-geel text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-opacity-80 flex-shrink-0"
          >
            AANMELDEN
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiviteitCard;