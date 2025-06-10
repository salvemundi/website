import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  title: string;
  backgroundImage?: string;
  className?: string;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  backgroundImage = '',
  className = '',
  children,
}) => {
  return (
    <header
      className={`relative flex items-center h-full justify-center mx-10 mb-10 ${className}`}
    >
      <div>
        <div
          className="absolute inset-0 w-full h-full bg-cover rounded-4xl bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-samu/80 rounded-4xl"
          aria-hidden="true"
        />
        {/* Content */}
        <div className="relative flex flex-col items-center z-10">
          <h1 className="text-beige text-[200px] font-bold ">{title}</h1>
          <Image
            src="/img/newlogo.svg"
            alt="Salve Mundi Logo"
            width={80}
            height={80}
            className="w-auto h-full mb-2"
            priority
          />
          {children}
        </div>
      </div>
    </header>
  );
};

export default Header;
