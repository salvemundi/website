import React from 'react';
import { MapPin, Building, Mail, Phone, FileText, ChevronRight, MessageCircle } from 'lucide-react';
import DocumentenLijst from '@/components/ui/social/DocumentenLijst';
import SafeHavenButton from '@/components/islands/social/SafeHavenButton';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import type { Document as WebsiteDocument } from '@salvemundi/validations/schema/website.zod';



interface ActionItemProps {
    icon: React.ReactNode;
    title: React.ReactNode;
    subtitle?: string;
    href?: string;
    onClick?: () => void;
    children?: React.ReactNode;
}

function ActionItem({ icon, title, subtitle, href, onClick, children }: ActionItemProps) {
    const Component = href ? 'a' : (onClick ? 'button' : 'div');
    const commonClasses = "flex items-start gap-4 py-3 px-2 transition-all duration-300 w-full text-left group";
    const interactionClasses = (href || onClick) ? "hover:translate-x-1 cursor-pointer" : "";

    return (
        <div className="flex flex-col gap-1">
            <Component
                {...(href ? { href, target: href.startsWith('http') ? "_blank" : undefined, rel: href.startsWith('http') ? "noopener noreferrer" : undefined } : {})}
                {...(onClick ? { onClick } : {})}
                className={`${commonClasses} ${interactionClasses}`}
            >
                <div className="text-purple-500 shrink-0 mt-1">
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-5 w-5' })}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-(--text-main) text-lg font-semibold leading-tight group-hover:text-purple-600 transition-colors">
                        {title}
                    </h4>
                    {subtitle && (
                        <p className="text-(--text-muted) text-base mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
                {(href || onClick) && (
                    <ChevronRight className="h-4 w-4 text-purple-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                )}
            </Component>
            {children && <div className="ml-11">{children}</div>}
        </div>
    );
}

export default function ContactInfoCard({ documenten, isLoggedIn }: { documenten: WebsiteDocument[], isLoggedIn: boolean }) {
    return (
        <div className="@container w-full">
            <div className="grid grid-cols-1 @[700px]:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-theme-purple px-2">Informatie</h2>

                    <ActionItem
                        icon={<MapPin />}
                        title="Rachelsmolen 1"
                        subtitle="Gebouw R10, Lokaal 2.26"
                    />

                    <ActionItem
                        icon={<Building />}
                        title="KvK nummer 70280606"
                    />


                    <div className="pt-4 px-2">
                        <h3 className="font-semibold text-(--text-main) text-lg mb-4 flex items-center gap-3">
                            <FileText className="h-5 w-5 text-purple-500" />
                            Documenten
                        </h3>
                        <DocumentenLijst documenten={documenten} />
                    </div>
                </div>

                {/* Rechterkolom: Contactopties */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-theme-purple px-2">Contact</h2>

                    <ActionItem
                        icon={<Mail />}
                        title={<ObfuscatedEmail email="info@salvemundi.nl" showIcon={false} />}
                    />

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
        </div>
    );
}

