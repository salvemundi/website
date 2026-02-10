'use client';

import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';

export interface SocialLink {
  provider: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'website';
  href: string;
  label?: string;
}

export interface AuthorCardProps {
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  phone?: string;
  socials?: SocialLink[];
  compact?: boolean;
}

export default function AuthorCard({
  name,
  avatar,
  bio,
  email,
  phone,
  socials,
  compact = false,
}: AuthorCardProps) {
  const getSocialIcon = (provider: string) => {
    // You can replace these with actual icon components if needed
    const icons: Record<string, string> = {
      twitter: '𝕏',
      linkedin: 'in',
      instagram: '📷',
      facebook: 'f',
      website: '🌐',
    };
    return icons[provider] || '🔗';
  };

  return (
    <div
      className={`bg-[var(--bg-card)] rounded-xl lg:rounded-2xl shadow-lg p-4 lg:p-6 ${compact ? 'max-w-sm' : 'max-w-md'
        }`}
    >
      <div className={`flex ${compact ? 'items-center gap-3' : 'flex-col items-center text-center'}`}>
        {/* Avatar */}
        {avatar ? (
          <div className={`relative ${compact ? 'w-12 h-12 lg:w-16 lg:h-16' : 'w-20 h-20 lg:w-24 lg:h-24'
            } rounded-full overflow-hidden border-2 border-theme-purple shadow-md`}>
            <Image
              src={avatar}
              alt={name}
              fill
              sizes={compact ? "64px" : "96px"}
              className="object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjZWVlIi8+PC9zdmc+"
            />
          </div>
        ) : (
          <div
            className={`${compact ? 'w-12 h-12 lg:w-16 lg:h-16' : 'w-20 h-20 lg:w-24 lg:h-24'
              } rounded-full bg-gradient-theme flex items-center justify-center text-white font-bold ${compact ? 'text-lg lg:text-xl' : 'text-2xl lg:text-3xl'
              } shadow-md`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className={`${compact ? 'flex-1' : 'mt-3 lg:mt-4 w-full'}`}>
          <h3 className={`font-bold text-theme ${compact ? 'text-base lg:text-lg' : 'text-lg lg:text-xl mb-2'}`}>
            {name}
          </h3>

          {bio && !compact && (
            <p className="text-sm lg:text-base text-theme-muted mb-3 lg:mb-4">
              {bio}
            </p>
          )}

          {/* Contact */}
          {(email || phone) && (
            <div className={`flex ${compact ? 'gap-2' : 'flex-col gap-2 items-center'} mb-3`}>
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-1 text-xs lg:text-sm text-theme-purple hover:underline"
                >
                  <Mail className="w-3 h-3 lg:w-4 lg:h-4" />
                  {compact ? '' : email}
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-1 text-xs lg:text-sm text-theme-purple hover:underline"
                >
                  <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
                  {compact ? '' : phone}
                </a>
              )}
            </div>
          )}

          {/* Socials */}
          {socials && socials.length > 0 && (
            <div className={`flex gap-2 ${compact ? '' : 'justify-center'}`}>
              {socials.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center bg-theme-purple/10 hover:bg-theme-purple/20 text-theme-purple rounded-full transition-colors"
                  aria-label={social.label || social.provider}
                >
                  <span className="text-sm">{getSocialIcon(social.provider)}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
