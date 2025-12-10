'use client';

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/features/auth/providers/auth-provider";
// import AttendanceButton from "./AttendanceButton"; // TODO: Port AttendanceButton
// import { isUserAuthorizedForAttendance, getEventSignupsWithCheckIn } from "../lib/qr-service"; // TODO: Port qr-service
// import exportEventSignups from "../lib/exportSignups"; // TODO: Port exportSignups
// import QRDisplay from "./QRDisplay"; // TODO: Port QRDisplay
import {
    CalendarClock,
    Clock3,
    MapPin,
    Euro,
    Users as UsersIcon,
    Mail,
    Phone,
    Info,
    CheckCircle,
} from "lucide-react";
import { stripHtml } from '@/shared/lib/text';

interface ActiviteitDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    activity: {
        id?: number;
        title: string;
        date?: string;
        description: string;
        price: number;
        image?: string;
        location?: string;
        time?: string;
        capacity?: number;
        organizer?: string;
        contact_phone?: string;
        contact_name?: string;
        committee_name?: string;
        committee_id?: number;
        committee_email?: string;
    };
    isPast?: boolean;
    isSignedUp?: boolean;
    signupPaymentStatus?: 'paid' | 'open' | 'failed' | 'canceled';
    signupQrToken?: string;
    onSignup: (data: { activity: any; email: string; name: string; phoneNumber: string }) => Promise<void>;
}

const buildCommitteeEmail = (name?: string | null) => {
    if (!name) return undefined;
    const normalized = name.toLowerCase();
    if (normalized.includes('feest')) return 'feest@salvemundi.nl';
    if (normalized.includes('activiteit')) return 'activiteiten@salvemundi.nl';
    if (normalized.includes('studie')) return 'studie@salvemundi.nl';

    const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/commissie|committee/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    if (!slug) return undefined;
    return `${slug}@salvemundi.nl`;
};

const ActiviteitDetailModal: React.FC<ActiviteitDetailModalProps> = ({
    isOpen,
    onClose,
    activity,
    isPast = false,
    isSignedUp = false,
    signupPaymentStatus,
    signupQrToken,
    onSignup,
}) => {
    const { user } = useAuth();
    const committeeEmail = activity?.committee_email || buildCommitteeEmail(activity?.committee_name);
    const rawDate = activity.date || (activity as any)?.event_date;

    const formattedDate = useMemo(() => {
        if (!rawDate) return null;
        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return rawDate;
        return new Intl.DateTimeFormat('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    }, [rawDate]);

    const formattedTime = activity.time || null;
    const formattedPrice = `€${(Number(activity.price) || 0).toFixed(2)}`;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isPaidAndHasQR = useMemo(() => {
        return isSignedUp && signupPaymentStatus === 'paid' && !!signupQrToken;
    }, [isSignedUp, signupPaymentStatus, signupQrToken]);


    useEffect(() => {
        if (isOpen) {
            if (user) {
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                setFormData({
                    name: fullName || "",
                    email: user.email || "",
                    phoneNumber: user.phone_number || "",
                });
            } else {
                setFormData({
                    name: "",
                    email: "",
                    phoneNumber: "",
                });
            }
            setErrors({});
            setSubmitError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = "Naam is verplicht";
        if (!formData.email.trim()) newErrors.email = "Email is verplicht";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Ongeldig email adres";
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Telefoonnummer is verplicht";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await onSignup({
                activity,
                email: formData.email,
                name: formData.name,
                phoneNumber: formData.phoneNumber,
            });
        } catch (error: any) {
            setSubmitError(error?.message || 'Er is iets misgegaan tijdens het inschrijven.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0  flex items-start justify-center pt-16 p-3 sm:pt-20 sm:p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={handleBackdropClick}
        >
            {/*
                Note: we use a top padding on the backdrop (pt-16 / sm:pt-20) so the modal sits below any fixed navbar.
                Also increase z-index to ensure the modal is above the navbar. The modal max height is set to
                calc(100vh - 4rem) so it always fits in the viewport below the navbar and remains scrollable.
            */}
            <div className="bg-gradient-theme rounded-3xl shadow-2xl max-w-4xl w-full sm:w-[92%] md:w-3/4 lg:max-w-3xl max-h-3xl overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-theme z-10 p-6">
                    <div className="flex justify-between items-start mb-3">
                        <h2 className="text-3xl font-bold text-theme-purple-lighter pr-8">{activity.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-theme-white hover:text-theme-purple-lighter transition-colors text-3xl font-bold leading-none"
                            aria-label="Sluiten"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* TODO: Add AttendanceButton and ExportSignupsButton back when ported */}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {/* Image */}
                    <div className="relative mb-6">
                        <img
                            src={activity.image || '/img/placeholder.svg'}
                            alt={activity.title}
                            className="w-full h-64 object-cover rounded-xl"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/img/placeholder.svg';
                            }}
                        />
                    </div>

                    {/* Details */}
                    <div className="mb-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white">
                            {[
                                formattedDate && { icon: CalendarClock, label: 'Datum', value: formattedDate },
                                formattedTime && { icon: Clock3, label: 'Tijd', value: formattedTime },
                                activity.location && { icon: MapPin, label: 'Locatie', value: activity.location },
                                { icon: Euro, label: 'Prijs', value: formattedPrice },
                                activity.capacity && { icon: UsersIcon, label: 'Capaciteit', value: `${activity.capacity} personen` },
                                activity.committee_name && { icon: Info, label: 'Commissie', value: activity.committee_name },
                                activity.organizer && { icon: Info, label: 'Organisator', value: activity.organizer },
                            ]
                                .filter(Boolean)
                                .map((item: any, idx) => (
                                    <div
                                        key={`${item.label}-${idx}`}
                                        className="flex items-center gap-3 rounded-2xl   bg-white/5 p-3"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-purple-lighter/20 text-theme-purple-lighter">
                                            <item.icon className="h-5 w-5" />
                                        </span>
                                        <div className="leading-tight">
                                            <p className="text-xs uppercase tracking-wide text-theme-white/70">{item.label}</p>
                                            <p className="text-base font-semibold text-theme-white">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Contact info */}
                        {(activity.contact_name || committeeEmail) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activity.contact_name && (
                                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-purple-lighter/20 text-theme-purple-lighter">
                                            <Phone className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-theme-white">Contact</p>
                                            <p className="text-base font-semibold text-theme-white">
                                                {activity.contact_name}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {committeeEmail && (
                                    <div className="flex items-center gap-3 rounded-2xl  bg-white/5 p-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-purple-lighter/20 text-theme-purple-lighter">
                                            <Mail className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-theme-white">E-mail commissie</p>
                                            <a
                                                href={`mailto:${committeeEmail}`}
                                                className="text-base font-semibold text-theme-white underline hover:text-theme-purple-lighter break-all"
                                            >
                                                {committeeEmail}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div className="rounded-2xl  bg-white/5 p-4 sm:p-5">
                            <h3 className="text-xl font-semibold text-theme-purple-lighter mb-2">Over deze activiteit</h3>
                            <p className="text-theme-white leading-relaxed">{stripHtml(activity.description)}</p>
                        </div>
                    </div>

                    {/* Registration Section */}
                    <div className="mt-8 pt-6">
                        {isPaidAndHasQR ? (
                            // Digital ticket display case: Paid and QR token is present.
                            <div className="space-y-6 text-theme-white">
                                <h3 className="text-3xl font-extrabold text-theme-purple-lighter text-center">🎉 Inschrijving Definitief!</h3>
                                <p className="text-center text-lg text-theme-white/90">
                                    Je bent succesvol ingeschreven en betaald voor {activity.title}.
                                </p>

                                <div className="flex justify-center">
                                    {/* <QRDisplay qrToken={signupQrToken!} /> TODO: Port QRDisplay */}
                                    <div className="text-center text-theme-white/70">QR Code Display Placeholder</div>
                                </div>

                                <p className="text-center text-sm text-theme-white/70 mt-4">
                                    Dit ticket is ook per e-mail naar je verzonden. Laat de QR-code scannen bij de ingang.
                                </p>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-4 bg-theme-purple-lighter text-theme-purple-darker font-bold py-2 px-6 rounded-full hover:scale-105 transition-transform w-full"
                                >
                                    Sluiten
                                </button>
                            </div>
                        ) : isSignedUp ? (
                            // Already signed up, checking status (Open/Failed)
                            <div className="bg-green-500/20 p-6 rounded-xl text-center">
                                <div className="flex justify-center mb-3">
                                    <CheckCircle className="h-12 w-12 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-theme-white mb-2">Je bent ingeschreven!</h3>
                                {signupPaymentStatus === 'open' ? (
                                    <p className="text-theme-white/80">
                                        Je inschrijving is in afwachting van betaling. Controleer je e-mail voor de betaallink of probeer opnieuw.
                                    </p>
                                ) : (
                                    <p className="text-green-100">
                                        We zien je graag op {formattedDate}.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-4 bg-white text-green-700 font-bold py-2 px-6 rounded-full hover:bg-green-50 transition-colors"
                                >
                                    Sluiten
                                </button>
                            </div>
                        ) : isPast ? (
                            // Past event case
                            <div className="bg-gray-700 bg-opacity-50 p-6 rounded-xl text-center">
                                <h3 className="text-2xl font-bold text-gray-400 mb-2">Inschrijving Gesloten</h3>
                                <p className="text-gray-300">Deze activiteit is al geweest. Inschrijven is niet meer mogelijk.</p>
                            </div>
                        ) : (
                            // Default: Form for new signup
                            <div>
                                <h3 className="text-2xl font-bold text-theme-purple-lighter mb-4">Inschrijven</h3>
                                <div className="flex flex-col lg:flex-row gap-6">
                                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                                        {/* Name */}
                                        <div>
                                            <label htmlFor="name" className="block text-theme-white font-semibold mb-2">Naam *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-3 rounded-lg bg-theme-white text-theme-purple placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-purple-lighter ${errors.name ? "ring-2 ring-red-500" : ""}`}
                                                placeholder="Jouw naam"
                                            />
                                            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="block text-theme-white font-semibold mb-2">Email *</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-3 rounded-lg bg-theme-white text-theme-purple placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-purple-lighter ${errors.email ? "ring-2 ring-red-500" : ""}`}
                                                placeholder="jouw.email@student.avans.nl"
                                            />
                                            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label htmlFor="phoneNumber" className="block text-theme-white font-semibold mb-2">Telefoonnummer *</label>
                                            <input
                                                type="tel"
                                                id="phoneNumber"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-3 rounded-lg bg-theme-white text-theme-purple placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-theme-purple-lighter ${errors.phoneNumber ? "ring-2 ring-red-500" : ""}`}
                                                placeholder="0612345678"
                                            />
                                            {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 bg-theme-purple-lighter text-theme-purple-darker font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'BEZIG...' : 'AANMELDEN'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="flex-1 bg-theme-white text-theme-purple font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg"
                                            >
                                                ANNULEREN
                                            </button>
                                        </div>
                                        {submitError && <p className="text-red-400 font-semibold text-center mt-3">{submitError}</p>}
                                    </form>

                                    {/* Contact Card */}
                                    {(activity.committee_name || activity.contact_name || committeeEmail) && (
                                        <div className="bg-white/5  rounded-2xl p-5 text-theme-white w-full lg:max-w-sm h-fit">
                                            <h4 className="text-xl font-semibold text-theme-purple-lighter mb-3">Contact commissie</h4>
                                            <p className="text-sm text-theme-white/80 mb-4">Vragen over deze activiteit? Neem direct contact op.</p>
                                            <div className="space-y-3 text-theme-white">
                                                {activity.committee_name && (
                                                    <p>
                                                        <span className="font-semibold text-theme-purple-lighter block text-sm uppercase tracking-wide">Commissie</span>
                                                        <span className="text-base">{stripHtml(activity.committee_name)}</span>
                                                    </p>
                                                )}
                                                {committeeEmail && (
                                                    <a
                                                        href={`mailto:${committeeEmail}`}
                                                        className="mt-4 inline-flex items-center justify-center w-full rounded-full bg-theme-purple-lighter text-theme-purple-darker font-semibold py-3 px-4 hover:bg-opacity-90 transition"
                                                    >
                                                        ✉️ Mail de commissie
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiviteitDetailModal;
