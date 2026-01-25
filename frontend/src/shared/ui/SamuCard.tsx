import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SamuCardProps {
    description: string;
    image?: string;
    button: string;
    link: string;
}

const SamuCard: React.FC<SamuCardProps> = ({
    description,
    image,
    button,
    link,
}) => {
    const isExternal = link.startsWith("http");

    return (
        <div className="bg-gradient-theme text-theme-white rounded-3xl p-6 flex h-full flex-col items-center gap-5 shadow-lg">
            {image && (
                <div className="relative w-full h-64">
                    <Image
                        src={image}
                        alt="Card illustration"
                        fill
                        className="rounded-2xl object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                    />
                </div>
            )}
            <p className="text-center text-base leading-relaxed sm:text-lg flex-1 text-theme-text-subtle dark:text-theme-text-subtle">
                {description}
            </p>

            {isExternal ? (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full rounded-2xl bg-theme-purple-lighter px-6 py-4 text-center text-xl font-bold text-theme-purple-darker transition hover:-translate-y-0.5 hover:bg-theme-purple-light sm:text-2xl"
                >
                    {button}
                </a>
            ) : (
                <Link
                    href={link}
                    className="mt-auto w-full rounded-2xl bg-theme-purple-lighter px-6 py-4 text-center text-xl font-bold text-theme-purple-darker transition hover:-translate-y-0.5 hover:bg-theme-purple-light sm:text-2xl"
                >
                    {button}
                </Link>
            )}
        </div>
    );
};

export default SamuCard;
