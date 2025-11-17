import React from "react";


interface HeaderProps {
  title: string;
  backgroundImage?: string;
  className?: string;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  backgroundImage = "",
  className = "",
  
  children,
}) => {
  return (
    <header
      className={`relative flex items-center max-h-full h-full justify-center mb-5 ${className}`}
    >
      <div>
        <div
          className="absolute inset-0 w-full  bg-cover rounded-4xl bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-samu/80 rounded-4xl"
          aria-hidden="true"
        />
        {/* Content */}
        <div className="relative flex flex-col items-center z-10 px-2 py-8 sm:py-12">
          <h1 className="text-beige font-bold text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[180px] text-center">
            {title.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < title.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </h1>
          <div className="relative flex justify-center items-center ">
            <img
              src="/img/newlogo.svg"
              alt="Salve Mundi Logo"

              className="object-contain w-full max-w-3/4 max-h-96 "
            />
          </div>
          {children}
        </div>
      </div>
    </header>
  );
};

export default Header;
