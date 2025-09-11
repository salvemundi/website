import React from "react";

interface JoinCardProps {
  description: string;
  image?: string;
  button: string;
  link: string;
}

const JoinCard: React.FC<JoinCardProps> = ({
  description,
  image,
  button,
  link,
}) => {
  return (
    <div className="bg-paars text-beige rounded-3xl p-6 flex flex-col items-center space-y-5 h-full shadow-lg">
      {image && (
        <img
          src={image}
          alt="Card illustration"
          className="w-full h-auto object-contain rounded-3xl"
        />
      )}
      <p className="text-center text-lg">{description}</p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-samu bg-geel hover:bg-yellow-400 text-3xl rounded-3xl font-bold py-4 px-6 transition-colors"
      >
        {button}
      </a>
    </div>
  );
};

export default JoinCard;
