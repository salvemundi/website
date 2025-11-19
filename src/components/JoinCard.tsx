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
          className="w-full h-auto object-contain rounded-2xl"
        />
      )}
      <p className="text-center text-base leading-relaxed sm:text-lg">{description}</p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full rounded-2xl bg-geel px-6 py-4 text-center text-xl font-bold text-samu transition hover:-translate-y-0.5 hover:bg-yellow-400 sm:text-2xl"
      >
        {button}
      </a>
    </div>
  );
};

export default JoinCard;
