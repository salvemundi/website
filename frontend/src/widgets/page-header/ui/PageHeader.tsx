import React from "react";

interface PageHeaderProps {
    title: string;
    backgroundImage?: string;
    className?: string;
    titleClassName?: string;
    children?: React.ReactNode;
    variant?: 'centered' | 'split';
    description?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    backgroundImage = "",
    className = "",
    titleClassName = "text-4xl md:text-6xl",
    children,
    variant = 'centered',
    description
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

            <div className={`relative z-20 w-full max-w-app px-4 py-20 ${variant === 'centered' ? 'text-center' : ''}`}>
                {variant === 'centered' ? (
                    <>
                        <h1 className={`text-theme-white font-bold leading-tight drop-shadow-lg ${titleClassName}`}>
                            {title.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    {index < title.split('\n').length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </h1>
                        {description && <div className="mt-4">{description}</div>}
                        {children}
                    </>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className={`text-theme-purple font-bold leading-tight drop-shadow-lg ${titleClassName}`}>
                                {title.split('\n').map((line, index) => (
                                    <React.Fragment key={index}>
                                        {line}
                                        {index < title.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </h1>
                            {description && <div className="mt-4">{description}</div>}
                        </div>
                        <div className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default PageHeader;
