import React from "react";
import { Link } from "react-router-dom";

interface CommissieCardProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
  memberImages?: string[];
}

const CommissieCard: React.FC<CommissieCardProps> = ({
  title,
  description,
  buttonText = "Meer Lezen",
  buttonLink = "#",
  image,
  memberImages = [],
}) => {
  return (
    <div className="bg-paars text-beige rounded-3xl p-8 flex flex-col items-center space-y-6 h-full shadow-lg">
      {/* Image Section */}
      {image && (
        <div className="w-full">
          <img
            src={image}
            alt={title}
            className="w-full h-48 object-cover rounded-2xl"
          />
        </div>
      )}
      
      {/* Title */}
      <h3 className="text-geel text-2xl font-bold text-center">{title}</h3>

      {/* Team member images */}
      {memberImages.length > 0 && (
        <div className="flex justify-center gap-3 mb-4">
          {memberImages.slice(0, 4).map((memberImage, index) => (
            <div key={index} className="w-12 h-12 bg-beige rounded-full overflow-hidden">
              <img
                src={memberImage}
                alt={`Team member ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-center text-base flex-grow">{description}</p>

      {/* Button */}
      <Link
        to={buttonLink}
        className="text-samu bg-geel hover:bg-yellow-400 text-lg rounded-full font-bold py-3 px-8 transition-colors"
      >
        {buttonText}
      </Link>
    </div>
  );
};

export default CommissieCard;
