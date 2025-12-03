import React from "react";

interface PageHeaderProps {
    title: string;
    backgroundImage?: string;
    className?: string;
    titleClassName?: string;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    backgroundImage = "",
    className = "",
    titleClassName = "text-4xl md:text-6xl",
    children
}) => {
    return (
        <header className={`relative flex items-center justify-center mb-5 ${className}`}>
            <div
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    filter: 'brightness(0.7)'
                }}
            />
            <div className="absolute inset-0 bg-gradient-theme/40 z-10" />

            <div className="relative z-20 text-center py-20 px-4">
                <h1 className={`text-theme-white font-bold text-center leading-tight drop-shadow-lg ${titleClassName}`}>
                    {title.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                            {line}
                            {index < title.split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </h1>
                {children}
            </div>
        </header>
    );
};

export default PageHeader;
