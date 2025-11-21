import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import AttendanceButton from "./AttendanceButton";
import { isUserCommitteeMember, getEventSignupsWithCheckIn } from "../lib/qr-service";
import exportEventSignups from "../lib/exportSignups";
import { getGoogleCalendarUrl, getOutlookCalendarUrl, downloadICS } from "../lib/calendar-utils";
import {
  CalendarClock,
  Clock3,
  MapPin,
  Euro,
  Users as UsersIcon,
  Mail,
  Phone,
  Info,
} from "lucide-react";

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

  // Pre-fill form with user data when modal opens
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

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Naam is verplicht";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is verplicht";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ongeldig email adres";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Telefoonnummer is verplicht";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSignup({
        activity,
        email: formData.email,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
      });
      setFormData({ name: "", email: "", phoneNumber: "" });
      setErrors({});
      onClose();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-paars rounded-3xl shadow-2xl max-w-4xl w-full sm:w-[92%] md:w-3/4 lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-paars z-10 p-6 border-b border-geel/20">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-3xl font-bold text-geel pr-8">{activity.title}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-geel transition-colors text-3xl font-bold leading-none"
              aria-label="Sluiten"
            >
              ×
            </button>
          </div>

          {/* Attendance Button for Committee Members */}
          <div className="space-y-3">
            {activity.id && !isPast && (
              <AttendanceButton
                eventId={activity.id}
                eventName={activity.title}
              />
            )}
            {activity.id && (
              <ExportSignupsButton activity={activity} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Image - always show */}
          <div className="relative mb-6">
            <img
              src={activity.image || '/img/backgrounds/Kroto2025.jpg'}
              alt={activity.title}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>

          {/* Activity Details */}
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
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-geel/20 text-geel">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div className="leading-tight">
                      <p className="text-xs uppercase tracking-wide text-white/70">{item.label}</p>
                      <p className="text-base font-semibold text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Contact quick info */}
            {(activity.contact_phone || activity.contact_name || committeeEmail) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activity.contact_phone && (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-geel/20 text-geel">
                      <Phone className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/70">Contact</p>
                      <p className="text-base font-semibold text-white">
                        {activity.contact_name ? `${activity.contact_name} – ` : ''}
                        <a href={`tel:${activity.contact_phone}`} className="underline hover:text-geel">
                          {activity.contact_phone}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
                {committeeEmail && (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-geel/20 text-geel">
                      <Mail className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/70">E-mail commissie</p>
                      <a
                        href={`mailto:${committeeEmail}`}
                        className="text-base font-semibold text-white underline hover:text-geel break-all"
                      >
                        {committeeEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Description */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-geel mb-2">Over deze activiteit</h3>
              <p className="text-white leading-relaxed">{activity.description}</p>
            </div>
          </div>

          {/* Registration Form */}
          {isPast ? (
            <div className="mt-8 border-t border-geel/20 pt-6">
              <div className="bg-gray-700 bg-opacity-50 p-6 rounded-xl text-center">
                <h3 className="text-2xl font-bold text-gray-400 mb-2">Inschrijving Gesloten</h3>
                <p className="text-gray-300">Deze activiteit is al geweest. Inschrijven is niet meer mogelijk.</p>
              </div>
            </div>
          ) : (
            <div className="mt-8 border-t border-geel/20 pt-6">
              <h3 className="text-2xl font-bold text-geel mb-4">Inschrijven</h3>
              <div className="flex flex-col lg:flex-row gap-6">
                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-white font-semibold mb-2">
                      Naam *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-3 rounded-lg bg-white text-paars placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geel ${errors.name ? "border-2 border-red-500" : ""
                        }`}
                      placeholder="Jouw naam"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-white font-semibold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-3 rounded-lg bg-white text-paars placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geel ${errors.email ? "border-2 border-red-500" : ""
                        }`}
                      placeholder="jouw.email@student.avans.nl"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-white font-semibold mb-2">
                      Telefoonnummer *
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-3 rounded-lg bg-white text-paars placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geel ${errors.phoneNumber ? "border-2 border-red-500" : ""
                        }`}
                      placeholder="0612345678"
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-geel text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'BEZIG...' : 'AANMELDEN'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-white text-paars font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg"
                    >
                      ANNULEREN
                    </button>
                  </div>
                  {submitError && (
                    <p className="text-red-400 font-semibold text-center mt-3">{submitError}</p>
                  )}
                </form>

                {(activity.committee_name || activity.contact_name || activity.contact_phone || committeeEmail) && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-white w-full lg:max-w-sm">
                    <h4 className="text-xl font-semibold text-geel mb-3">Contact commissie</h4>
                    <p className="text-sm text-white/80 mb-4">
                      Vragen over deze activiteit? Neem direct contact op met de commissie die het evenement organiseert.
                    </p>
                    <div className="space-y-3 text-white">
                      {activity.committee_name && (
                        <p>
                          <span className="font-semibold text-geel block text-sm uppercase tracking-wide">Commissie</span>
                          <span className="text-base">{activity.committee_name}</span>
                        </p>
                      )}
                      {activity.contact_name && (
                        <p>
                          <span className="font-semibold text-geel block text-sm uppercase tracking-wide">Contactpersoon</span>
                          <span className="text-base">{activity.contact_name}</span>
                        </p>
                      )}
                      {activity.contact_phone && (
                        <p>
                          <span className="font-semibold text-geel block text-sm uppercase tracking-wide">Telefoon</span>
                          <a href={`tel:${activity.contact_phone}`} className="text-base underline hover:text-geel transition">
                            {activity.contact_phone}
                          </a>
                        </p>
                      )}
                      {committeeEmail && (
                        <p>
                          <span className="font-semibold text-geel block text-sm uppercase tracking-wide">E-mail</span>
                          <a
                            href={`mailto:${committeeEmail}`}
                            className="text-base underline hover:text-geel transition break-all"
                          >
                            {committeeEmail}
                          </a>
                        </p>
                      )}
                    </div>
                    {committeeEmail && (
                      <a
                        href={`mailto:${committeeEmail}`}
                        className="mt-4 inline-flex items-center justify-center w-full rounded-full bg-geel text-paars font-semibold py-3 px-4 hover:bg-opacity-90 transition"
                      >
                        ✉️ Mail de commissie
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiviteitDetailModal;

function ExportSignupsButton({ activity }: { activity: any }) {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!user || !activity) {
        if (mounted) { setAllowed(false); setLoading(false); }
        return;
      }
      try {
        // Allow if user is committee member OR if user's id equals organizer (if available)
        const member = await isUserCommitteeMember(user.id, activity.id);
        const isOrganizer = activity.organizer && user.email && activity.organizer.includes(user.email);
        if (mounted) setAllowed(!!member || !!isOrganizer);
      } catch (e) {
        console.error('Error checking committee membership', e);
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    check();
    return () => { mounted = false; };
  }, [user, activity]);

  const handleExport = async () => {
    try {
      const signups = await getEventSignupsWithCheckIn(activity.id);
      await exportEventSignups(signups, `${activity.title || 'event'}-signups.xlsx`);
    } catch (e) {
      console.error('Export failed', e);
      alert('Kon aanmeldingen niet exporteren.');
    }
  };

  if (loading || !allowed) return null;

  return (
    <button
      onClick={handleExport}
      className="w-full bg-white text-paars font-semibold py-2.5 px-5 rounded-full hover:bg-opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
    >
      <span>📥</span>
      <span>Export Aanmeldingen (Excel)</span>
    </button>
  );
}
