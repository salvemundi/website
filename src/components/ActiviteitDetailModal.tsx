import React, { useState } from "react";

interface ActiviteitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: {
    title: string;
    date?: string;
    description: string;
    price: number;
    image?: string;
    location?: string;
    time?: string;
    capacity?: number;
    organizer?: string;
  };
  isPast?: boolean;
  onSignup: (data: { activity: any; email: string; name: string; studentNumber: string }) => void;
}

const ActiviteitDetailModal: React.FC<ActiviteitDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
  isPast = false,
  onSignup,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentNumber: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = "Studentnummer is verplicht";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSignup({
        activity,
        email: formData.email,
        name: formData.name,
        studentNumber: formData.studentNumber,
      });
      // Reset form
      setFormData({ name: "", email: "", studentNumber: "" });
      setErrors({});
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-paars rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-paars z-10 flex justify-between items-start p-6 border-b border-geel/20">
          <h2 className="text-3xl font-bold text-geel pr-8">{activity.title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-geel transition-colors text-3xl font-bold leading-none"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image - always show */}
          <div className="relative mb-6">
            <img
              src={activity.image || '/img/backgrounds/Kroto2025.jpg'}
              alt={activity.title}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>

          {/* Activity Details */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
              {activity.date && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-geel">📅 Datum:</span>
                  <span>{activity.date}</span>
                </div>
              )}
              {activity.time && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-geel">🕒 Tijd:</span>
                  <span>{activity.time}</span>
                </div>
              )}
              {activity.location && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-geel">📍 Locatie:</span>
                  <span>{activity.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-geel">💰 Prijs:</span>
                <span className="text-lg font-bold">€{(Number(activity.price) || 0).toFixed(2)}</span>
              </div>
              {activity.capacity && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-geel">👥 Capaciteit:</span>
                  <span>{activity.capacity} personen</span>
                </div>
              )}
              {activity.organizer && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-geel">👤 Organisator:</span>
                  <span>{activity.organizer}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-6">
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  className={`w-full px-4 py-3 rounded-lg bg-white text-paars placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geel ${
                    errors.name ? "border-2 border-red-500" : ""
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
                  className={`w-full px-4 py-3 rounded-lg bg-white text-paars placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geel ${
                    errors.email ? "border-2 border-red-500" : ""
                  }`}
                  placeholder="jouw.email@student.avans.nl"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Student Number Field */}
              <div>
                <label htmlFor="studentNumber" className="block text-white font-semibold mb-2">
                  Studentnummer *
                </label>
                <input
                  type="text"
                  id="studentNumber"
                  name="studentNumber"
                  value={formData.studentNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white text-paars placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-geel ${
                    errors.studentNumber ? "border-2 border-red-500" : ""
                  }`}
                  placeholder="2012345"
                />
                {errors.studentNumber && (
                  <p className="text-red-400 text-sm mt-1">{errors.studentNumber}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-geel text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg"
                >
                  AANMELDEN
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-white text-paars font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg"
                >
                  ANNULEREN
                </button>
              </div>
            </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiviteitDetailModal;
