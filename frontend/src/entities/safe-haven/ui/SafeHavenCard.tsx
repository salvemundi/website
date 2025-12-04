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
            className="bg-white rounded-3xl shadow-xl p-6 transition-all hover:shadow-2xl hover:scale-105 transform"
        >
            {/* Profile Image */}
            {safeHaven.image ? (
                <img
                    src={getImageUrl(safeHaven.image)}
                    alt={safeHaven.contact_name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/img/avatar-placeholder.svg';
                    }}
                />
            ) : (
                <div className="w-32 h-32 rounded-full bg-geel flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl text-paars font-bold">
                        {safeHaven.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                </div>
            )}

            {/* Badge */}
            <div className="text-center mb-2">
                <span className="inline-block px-3 py-1 bg-oranje text-beige text-sm font-semibold rounded-full">
                    Safe Haven
                </span>
            </div>

            {/* Name */}
            <h3 className="text-2xl font-bold text-paars text-center mb-4">
                {safeHaven.contact_name}
            </h3>

            {/* Contact Info */}
            {(safeHaven.email || safeHaven.phone_number) && (
                <div className="pt-4 space-y-3">
                    {/* Email */}
                    {safeHaven.email && (
                        <a
                            href={`mailto:${safeHaven.email}`}
                            className="flex items-center justify-center gap-3 text-paars hover:text-oranje transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-geel flex items-center justify-center flex-shrink-0 group-hover:bg-oranje transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium break-all">{safeHaven.email}</span>
                        </a>
                    )}

                    {/* Phone */}
                    {safeHaven.phone_number && (
                        <a
                            href={`tel:${safeHaven.phone_number}`}
                            className="flex items-center justify-center gap-3 text-paars hover:text-oranje transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-geel flex items-center justify-center flex-shrink-0 group-hover:bg-oranje transition-colors">
                                <Phone className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium">{safeHaven.phone_number}</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default SafeHavenCard;
