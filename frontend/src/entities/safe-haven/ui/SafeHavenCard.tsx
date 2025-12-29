'use client';

import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { getImageUrl } from '@/shared/lib/api/salvemundi';

interface SafeHaven {
    id: number;
    contact_name: string;
    email?: string;
    phone_number?: string;
    image?: string;
    member_id?: {
        first_name: string;
        last_name: string;
    };
}

interface SafeHavenCardProps {
    safeHaven: SafeHaven;
}

const SafeHavenCard: React.FC<SafeHavenCardProps> = ({ safeHaven }) => {
    return (
        <div
            className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 transition-all hover:shadow-xl hover:scale-[1.02] duration-300"
        >
            {/* Profile Image */}
            {safeHaven.image ? (
                <img
                    src={getImageUrl(safeHaven.image)}
                    alt={safeHaven.contact_name}
                    className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover mx-auto mb-4 border-4 border-theme-purple/10"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/img/avatar-placeholder.svg';
                    }}
                />
            ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-theme flex items-center justify-center mx-auto mb-4 border-4 border-theme-purple/10">
                    <span className="text-3xl sm:text-4xl text-white font-bold">
                        {safeHaven.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                </div>
            )}

            {/* Badge */}
            <div className="text-center mb-3">
                <span className="inline-block px-3 py-1.5 bg-gradient-theme text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm">
                    Safe Haven
                </span>
            </div>

            {/* Name */}
            <h3 className="text-xl sm:text-2xl font-bold text-theme text-center mb-4 px-2 break-words">
                {safeHaven.contact_name}
            </h3>

            {/* Contact Info */}
            {(safeHaven.email || safeHaven.phone_number) && (
                <div className="pt-4 space-y-3 border-t border-theme-purple/10">
                    {/* Email */}
                    {safeHaven.email && (
                        <a
                            href={`mailto:${safeHaven.email}`}
                            className="flex items-center justify-start gap-3 text-theme-muted hover:text-theme-purple transition-colors group px-2"
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-theme-purple/10 group-hover:bg-gradient-theme flex items-center justify-center flex-shrink-0 transition-all">
                                <Mail className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium break-all text-left">{safeHaven.email}</span>
                        </a>
                    )}

                    {/* Phone */}
                    {safeHaven.phone_number && (
                        <a
                            href={`tel:${safeHaven.phone_number}`}
                            className="flex items-center justify-start gap-3 text-theme-muted hover:text-theme-purple transition-colors group px-2"
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-theme-purple/10 group-hover:bg-gradient-theme flex items-center justify-center flex-shrink-0 transition-all">
                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">{safeHaven.phone_number}</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default SafeHavenCard;
