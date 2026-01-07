import React from "react";

interface HomeHeaderProps {
    title: string;
    backgroundImage?: string;
    className?: string;
    titleClassName?: string;
    children?: React.ReactNode;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
    title,
    backgroundImage = "",
    className = "",
    titleClassName = "text-4xl sm:text-6xl md:text-7xl lg:text-[120px] xl:text-[180px]",
    children,
}) => {
    return (
        <header
            className={`relative flex items-center justify-center mb-5 group ${className}`}
        >
            <div>
                <div
                    className="absolute inset-0 w-full bg-cover rounded-4xl bg-center"
                    style={{ backgroundImage: `url(${backgroundImage})`, filter: 'brightness(0.7) blur(0px)' }}
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 bg-samu/80 rounded-4xl"
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 bg-gradient-to-r from-oranje/20 to-paars/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-4xl"
                    aria-hidden="true"
                />
                {/* Content */}
                <div className="relative flex flex-col items-center z-10 px-3 py-6 sm:py-10">
                    <h1 className={`text-beige font-bold text-center leading-tight ${titleClassName}`}>
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
                            className="object-contain w-full max-w-3/4 max-h-72 sm:max-h-96"
                        />
                    </div>
                    {children}
                </div>
            </div>
        </header>
    );
};

export default HomeHeader;
