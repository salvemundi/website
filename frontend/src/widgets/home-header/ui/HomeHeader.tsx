import React from "react";
import Image from "next/image";

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
                    className="absolute inset-0 bg-theme-purple/80 rounded-4xl"
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 bg-gradient-to-r from-theme-purple-light/20 to-theme-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-4xl"
                    aria-hidden="true"
                />
                {/* Content */}
                <div className="relative flex flex-col items-center z-10 px-3 py-6 sm:py-10">
                    <h1 className={`text-theme-white font-bold text-center leading-tight ${titleClassName}`}>
                        {title.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                                {line}
                                {index < title.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </h1>
                    <div className="relative flex justify-center items-center w-full max-w-3/4 h-72 sm:h-96 mx-auto">
                        <Image
                            src="/img/newlogo.svg"
                            alt="Salve Mundi Logo"
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 75vw, 384px"
                            priority
                        />
                    </div>
                    {children}
                </div>
            </div>
        </header>
    );
};

export default HomeHeader;
