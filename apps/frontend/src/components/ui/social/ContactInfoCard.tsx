import React from 'react';
import Link from 'next/link';
import { MapPin, Building, Calendar, Mail, Phone, FileText, ChevronRight, MessageCircle } from 'lucide-react';
import DocumentenLijst from '@/components/ui/social/DocumentenLijst';
import SafeHavenButton from '@/components/islands/social/SafeHavenButton';
import WhatsAppLink from '@/components/islands/social/WhatsAppLink';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import type { Document as WebsiteDocument } from '@salvemundi/validations/schema/website.zod';



interface ActionItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    href?: string;
    onClick?: () => void;
    children?: React.ReactNode;
}

function ActionItem({ icon, title, subtitle, href, onClick, children }: ActionItemProps) {
    const Component = href ? 'a' : (onClick ? 'button' : 'div');
    const commonClasses = "flex items-center gap-5 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm transition-all duration-300 w-full text-left";
    const interactionClasses = (href || onClick) ? "hover:border-[var(--color-purple-300)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "";

    return (
        <div className="flex flex-col gap-2">
            <Component
                {...(href ? { href, target: href.startsWith('http') ? "_blank" : undefined, rel: href.startsWith('http') ? "noopener noreferrer" : undefined } : {})}
                {...(onClick ? { onClick } : {})}
                className={`${commonClasses} ${interactionClasses}`}
            >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-inner">
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-6 w-6' })}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-[var(--text-main)] text-lg font-bold leading-tight">
                        {title}
                    </h4>
                    {subtitle && (
                        <p className="text-[var(--text-muted)] text-base mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                {(href || onClick) && (
                    <ChevronRight className="h-5 w-5 text-[var(--color-purple-300)] opacity-50 group-hover:opacity-100" />
                )}
            </Component>
            {children && <div className="mt-2 ml-16">{children}</div>}
        </div>
    );
}

export default function ContactInfoCard({ documenten, isLoggedIn }: { documenten: WebsiteDocument[], isLoggedIn: boolean }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Linkerkolom: Algemene Info */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[var(--text-main)] px-2">Informatie</h2>

                <ActionItem
                    icon={<MapPin />}
                    title="Rachelsmolen 1"
                    subtitle="Gebouw R10, Lokaal 2.26"
                />

                <ActionItem
                    icon={<Building />}
                    title="KvK nummer 70280606"
                />

                <ActionItem
                    icon={<Calendar />}
                    title="Activiteitenkalender"
                    href="/activiteiten"
                />

                <div className="pt-4 px-2">
                    <h3 className="font-bold text-[var(--text-main)] text-lg mb-4 flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[var(--color-purple-500)]" />
                        Documenten
                    </h3>
                    <DocumentenLijst documenten={documenten} />
                </div>
            </div>

            {/* Rechterkolom: Contactopties */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[var(--text-main)] px-2">Contact</h2>

                <ActionItem
                    icon={<Mail />}
                    title="E-mail"
                >
                    <div className="text-[var(--text-main)] text-lg font-bold">
                        <ObfuscatedEmail email="info@salvemundi.nl" showIcon={false} />
                    </div>
                </ActionItem>

                <ActionItem
                    icon={<Phone />}
                    title="+31 6 24827777"
                    href="tel:+31624827777"
                />

                {isLoggedIn && (
                    <ActionItem
                        icon={<MessageCircle />}
                        title="WhatsApp"
                        href="https://wa.me/31624827777"
                    />
                )}

                <SafeHavenButton />
            </div>
        </div>
    );
}

