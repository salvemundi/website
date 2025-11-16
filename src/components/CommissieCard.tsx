import React from "react";
import { Link } from "react-router-dom";

interface MemberData {
  image: string;
  firstName: string;
}

interface CommissieCardProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  image?: string;
  memberImages?: string[];
  members?: MemberData[];
  isBestuur?: boolean;
}

const CommissieCard: React.FC<CommissieCardProps> = ({
  title,
  description,
  buttonText = "Meer Lezen",
  buttonLink = "#",
  image,
  memberImages = [],
  members = [],
  isBestuur = false,
}) => {
  return (
    <Link to={buttonLink} className="block h-full group">
      <div className="bg-paars text-beige rounded-3xl p-8 flex flex-col items-center space-y-6 h-full shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
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
        <h3 
          className="text-geel font-bold text-center break-words hyphens-auto leading-tight px-2"
          style={{
            fontSize: title.length > 30 ? '1.125rem' : title.length > 20 ? '1.5rem' : '1.5rem',
          }}
        >
          {title}
        </h3>

        {/* Team member images */}
        {isBestuur && members.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {members.map((member, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-20 h-20 bg-beige rounded-full overflow-hidden ring-2 ring-geel mb-2">
                  <img
                    src={member.image}
                    alt={member.firstName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-geel text-sm font-semibold">{member.firstName}</span>
              </div>
            ))}
          </div>
        ) : memberImages.length > 0 ? (
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
        ) : null}

        {/* Description */}
        <p className="text-center text-base flex-grow">{description}</p>

        {/* Button */}
        <div className="text-samu bg-geel group-hover:bg-yellow-400 text-lg rounded-full font-bold py-3 px-8 transition-colors">
          {buttonText}
        </div>
      </div>
    </Link>
  );
};

export default CommissieCard;
