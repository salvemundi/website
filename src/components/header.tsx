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
        <div className="relative flex flex-col items-center z-10 px-2 py-8 sm:py-12">
          <h1 className="text-beige font-bold text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[200px] text-center leading-tight">
            {title}
          </h1>
          <div className="relative w-full h-40">
            <Image
              src="/img/newlogo.svg"
              alt="Salve Mundi Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          {children}
        </div>
      </div>
    </header>
  );
};

export default Header;
