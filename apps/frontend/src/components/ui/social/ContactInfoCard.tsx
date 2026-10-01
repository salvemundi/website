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
    const commonClasses = "flex items-start gap-4 py-1.5 px-2 transition-all duration-300 w-fit text-left group";
    const interactionClasses = (href || onClick) ? "hover:translate-x-1 cursor-pointer" : "";

    const isInteractive = !!(href || onClick);

    return (
        <div className="flex flex-col gap-1">
            <Component
                {...(href ? { href, target: href.startsWith('http') ? "_blank" : undefined, rel: href.startsWith('http') ? "noopener noreferrer" : undefined } : {})}
                {...(onClick ? { onClick } : {})}
                className={`${commonClasses} ${interactionClasses}`}
            >
                <div className="mt-1 shrink-0 text-purple-500">
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-5 w-5' })}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className={`text-lg leading-tight font-semibold text-(--text-main) transition-colors ${isInteractive ? "group-hover:text-purple-600" : ""}`}>
                        {title}
                    </h4>
                    {subtitle && (
                        <p className="mt-0.5 text-base text-(--text-muted)">
                            {subtitle}
                        </p>
                    )}
                </div>
                {(href || onClick) && (
                    <ChevronRight className="size-4 -translate-x-2 text-purple-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                )}
            </Component>
            {children && <div className="ml-11">{children}</div>}
        </div>
    );
}

export default function ContactInfoCard({ documenten, isLoggedIn }: { documenten: WebsiteDocument[], isLoggedIn: boolean }) {
    return (
        <div className="@container w-full">
            <div className="grid grid-cols-1 gap-10 @[700px]:grid-cols-2">
                <div className="flex flex-col gap-6">
                    <h2 className="px-2 text-2xl font-black text-theme-purple">Informatie</h2>

                    <div className="flex flex-col gap-2">
                        <ActionItem
                            icon={<MapPin />}
                            title="Rachelsmolen 1, Eindhoven"
                            subtitle="Gebouw R10, Lokaal 2.17"
                        />

                        <ActionItem
                            icon={<Building />}
                            title="KvK nummer 70280606"
                        />
                    </div>


                    <div className="px-2 pt-2">
                        <h3 className="mb-3 flex items-center gap-3 text-lg font-semibold text-(--text-main)">
                            <FileText className="size-5 text-purple-500" />
                            Documenten
                        </h3>
                        <DocumentenLijst documenten={documenten} />
                    </div>
                </div>

                {/* Rechterkolom: Contactopties */}
                <div className="flex flex-col gap-6">
                    <h2 className="px-2 text-2xl font-black text-theme-purple">Contact</h2>

                    <div className="flex flex-col gap-2">
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
                    </div>

                    <SafeHavenButton />
                </div>
            </div>
        </div>
    );
}

