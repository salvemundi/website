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
    <div className="bg-paars text-beige rounded-3xl p-6 flex h-full flex-col items-center gap-5 shadow-lg">
      {image && (
        <img
          src={image}
          alt="Card illustration"
          className="w-full h-auto rounded-2xl object-contain"
        />
      )}
      <p className="text-center text-base leading-relaxed sm:text-lg flex-1">
        {description}
      </p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto w-full rounded-2xl bg-geel px-6 py-4 text-center text-xl font-bold text-samu transition hover:-translate-y-0.5 hover:bg-yellow-400 sm:text-2xl"
      >
        {button}
      </a>
    </div>
  );
};

export default JoinCard;
