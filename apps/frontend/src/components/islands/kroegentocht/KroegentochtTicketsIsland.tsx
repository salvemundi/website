'use client';

import React, { useState } from 'react';
import { type PubCrawlTicket } from '@salvemundi/validations';
import QRDisplay from '@/shared/ui/QRDisplay';
import qrService from '@/lib/qr-service';
import { Ticket, Download, CheckCircle2 } from 'lucide-react';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { Skeleton } from '@/components/ui/Skeleton';

interface KroegentochtTicketsIslandProps {
    isLoading?: boolean;
    initialTickets?: PubCrawlTicket[];
    userEmail?: string;
}

export default function KroegentochtTicketsIsland({ isLoading = false, initialTickets = [], userEmail }: KroegentochtTicketsIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [tickets] = useState<PubCrawlTicket[]>(initialTickets);

    const downloadTicketAsImage = async (ticket: PubCrawlTicket, index: number) => {
        // ... (same implementation)
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = 600;
            const height = 800;
            canvas.width = width;
            canvas.height = height;

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Header
            ctx.fillStyle = '#7B2CBF';
            ctx.fillRect(0, 0, width, 120);

            // Header Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`KROEGENTOCHT TICKET ${index + 1}`, width / 2, 75);

            // Participant Name
            ctx.fillStyle = '#1e1e1e';
            ctx.font = 'bold 48px Arial';
            ctx.fillText(`${ticket.name} ${ticket.initial}.`, width / 2, 220);

            // Divider
            ctx.strokeStyle = '#eeeeee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(100, 280);
            ctx.lineTo(500, 280);
            ctx.stroke();

            // QR Code
            const qrDataUrl = await qrService.generateQRCode(ticket.qr_token);
            const qrImg = new Image();
            qrImg.crossOrigin = "anonymous";
            
            await new Promise((resolve, reject) => {
                qrImg.onload = () => {
                    const qrSize = 400;
                    ctx.drawImage(qrImg, (width - qrSize) / 2, 320, qrSize, qrSize);
                    resolve(true);
                };
                qrImg.onerror = reject;
                qrImg.src = qrDataUrl;
            });

            // Footer
            ctx.fillStyle = '#666666';
            ctx.font = '20px Arial';
            ctx.fillText('Laat deze code scannen bij de ingang', width / 2, 750);

            // Download
            const link = document.createElement('a');
            link.download = `Kroegentocht-Ticket-${ticket.name.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('Ticket succesvol gegenereerd', 'success');
        } catch (e) {
            console.error('Failed to download ticket:', e);
            showToast('Er is een fout opgetreden bij het genereren van je ticket.', 'error');
        }
    };

    if (isLoading) {
        return (
            <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 mb-8" aria-busy="true">
                <Skeleton className="h-8 w-64 mb-4" rounded="lg" />
                <Skeleton className="h-4 w-full max-w-2xl mb-8" rounded="md" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-80 w-full" rounded="xl" />
                    ))}
                </div>
            </section>
        );
    }

    if (!isLoading && tickets.length === 0) return null;

    return (
        <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8 mb-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-[var(--color-purple-theme)] flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        Jouw Tickets
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Hieronder vind je de tickets voor {userEmail || 'jouw account'}.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket, i) => (
                    <div 
                        key={ticket.id} 
                        className="group relative bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 p-6 transition-all hover:shadow-md hover:border-[var(--color-purple-theme)]/30"
                    >
                        <div className="flex flex-col items-center">
                            <QRDisplay qrToken={ticket.qr_token} size={180} />
                            
                            <div className="mt-6 w-full space-y-2">
                                <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/10 pb-2">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Deelnemer</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                                        {ticket.name} {ticket.initial}.
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Status</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ticket.checked_in ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                                        {ticket.checked_in ? 'Ingecheckt' : 'Geldig'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => downloadTicketAsImage(ticket, i)}
                                className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-black text-[var(--color-purple-theme)] hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <Download className="w-4 h-4" />
                                Download Ticket
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </section>
    );
}

