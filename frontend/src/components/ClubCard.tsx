import React from "react";
import { Globe } from "lucide-react";

interface ClubCardProps {
  title: string;
  description?: string;
  image?: string;
  whatsappLink?: string;
  discordLink?: string;
  websiteLink?: string;
}

const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    role="presentation"
    aria-hidden="true"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <circle cx="12" cy="11" r="8" />
    <path d="M6.5 16L5.5 20l4-1" />
    <path
      d="M10.5 8.7c0 1.7 1.7 3.8 3.4 4.7l1.6-.8L17 14"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg
    viewBox="0 0 24 24"
    role="presentation"
    aria-hidden="true"
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      d="M4.5 15.5c1 1.5 2.6 2.5 4.6 3l1.4-1.4c1 .2 2 .2 3 0l1.4 1.4c2-.5 3.6-1.5 4.6-3V9.5c-1-1.5-2.6-2.5-4.6-3l-1.4 1.3c-1-.2-2-.2-3 0L9.1 6.5c-2 .5-3.6 1.5-4.6 3Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const ClubCard: React.FC<ClubCardProps> = ({
  title,
  description,
  image,
  whatsappLink,
  discordLink,
  websiteLink,
}) => {
  interface LinkCandidate {
    label: string;
    href?: string;
    icon?: React.ReactNode;
  }

  interface LinkInfo extends LinkCandidate {
    href: string;
  }

  const linkCandidates: LinkCandidate[] = [
    { label: "WhatsApp", href: whatsappLink, icon: <WhatsAppIcon /> },
    { label: "Discord", href: discordLink, icon: <DiscordIcon /> },
    { label: "Website", href: websiteLink, icon: <Globe className="w-4 h-4" /> },
  ];

  const links: LinkInfo[] = linkCandidates.filter(
    (link): link is LinkInfo => Boolean(link.href)
  );

  return (
    <article className="h-full bg-paars text-beige rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
      <img
        src={image || '/img/placeholder.svg'}
        alt={title}
        className="w-full h-48 object-cover rounded-t-3xl"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/img/placeholder.svg';
        }}
      />

      <div className="flex flex-col gap-4 p-6 flex-1">
        <header>
          <h3 className="text-geel font-bold text-xl">{title}</h3>
        </header>
        {description && (
          <div
            className="text-base leading-relaxed text-beige/90 [&>p:last-child]:mb-0 [&>p]:mb-3"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {links.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-geel text-samu font-semibold px-4 py-2 text-sm hover:bg-yellow-400 transition-colors"
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export default ClubCard;
