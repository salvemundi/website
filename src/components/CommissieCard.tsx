import React from "react";
import { Link } from "react-router-dom";

interface CommissieCardProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
}

const CommissieCard: React.FC<CommissieCardProps> = ({
  title,
  description,
  buttonText = "Meer Lezen",
  buttonLink = "#",
  image,
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
      
      {/* Icon/Image placeholder - showing the generic team icon */}
      <div className="w-full flex flex-col items-center space-y-3">
        <div className="text-center">
          <h3 className="text-white font-semibold text-xl mb-2">ICT COMMISSIE</h3>
          <div className="flex justify-center gap-3 mb-4">
            {/* Team member icons */}
            <div className="w-12 h-12 bg-beige rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-paars" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="w-12 h-12 bg-beige rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-paars" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="w-12 h-12 bg-beige rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-paars" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="w-12 h-12 bg-beige rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-paars" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-white text-sm font-medium">STUDIEVERENIGING</p>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-geel text-xl font-bold text-center">{title}</h4>

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
