'use client';

import React, { useState } from 'react';
import { Mail, ShieldCheck, CalendarClock, BellRing } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toggleMailSetting } from '@/server/actions/admin-mail.actions';

interface MailSetting {
    id: string;
    name: string;
    isActive: boolean;
    description: string;
}

interface MailManagementIslandProps {
    initialSettings: MailSetting[];
}

export default function MailManagementIsland({ initialSettings }: MailManagementIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [settings, setSettings] = useState(initialSettings);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const handleToggle = async (key: string) => {
        setTogglingId(key);
        try {
            const res = await toggleMailSetting(key);
            if (res.success) {
                setSettings(prev => prev.map(s => 
                    s.id === key ? { ...s, isActive: !s.isActive } : s
                ));
                const setting = settings.find(s => s.id === key);
                showToast(`${setting?.name} is nu ${!setting?.isActive ? 'ingeschakeld' : 'uitgeschakeld'}`, 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
        } catch (err) {
            
            showToast('Er is een onverwachte fout opgetreden', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <>
            <AdminToolbar 
                title="E-mail Beheer"
                subtitle="Beheer alle automatische e-mail flows en notificaties"
                backHref="/beheer"
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.map(setting => (
                        <div 
                            key={setting.id}
                            className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg ${setting.isActive ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)]' : 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)]'}`}>
                                        {setting.id === 'mail_expiry_check' ? <CalendarClock className="h-6 w-6" /> : <BellRing className="h-6 w-6" />}
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-sm text-[var(--beheer-text)]">
                                        {setting.name}
                                    </h3>
                                </div>
                                <p className="text-[var(--beheer-text-muted)] text-xs mb-6 leading-relaxed">
                                    {setting.description}
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-[var(--beheer-border)]/50">
                                <span className={`text-[10px] font-bold uppercase tracking-tighter ${setting.isActive ? 'text-[var(--beheer-active)]' : 'text-[var(--beheer-inactive)]'}`}>
                                    Status: {setting.isActive ? 'Actief' : 'Gepauzeerd'}
                                </span>
                                <AdminVisibilityToggle 
                                    label="Automatisering"
                                    isVisible={setting.isActive}
                                    onToggle={() => handleToggle(setting.id)}
                                    isPending={togglingId === setting.id}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-[var(--beheer-accent)]/5 border border-[var(--beheer-accent)]/20 rounded-[var(--beheer-radius)]">
                    <div className="flex items-start gap-4">
                        <ShieldCheck className="h-6 w-6 text-[var(--beheer-accent)] mt-1 shrink-0" />
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-xs text-[var(--beheer-accent)] mb-2">Veiligheidsmodus Actief</h4>
                            <p className="text-[var(--beheer-text-muted)] text-xs leading-relaxed max-w-2xl">
                                Alle automatische e-mail flows staan standaard uitgeschakeld voor nieuwe omgevingen. 
                                Gebruik deze toggles om ze te activeren wanneer de configuratie en templates volledig zijn getest. 
                                Directe notificaties (zoals betalingsbevestigingen) vallen hier buiten en worden altijd verstuurd.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
