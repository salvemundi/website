'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Save, Info, Feather } from 'lucide-react';
import { toast } from 'sonner';
import { updateSafeHavenAvailability, getSafeHavenAvailability } from '@/shared/lib/api/salvemundi';

interface TimeSlot {
  start: string;
  end: string;
}

interface SafeHavenAvailabilityProps {
  userId: string;
}

const SafeHavenAvailability: React.FC<SafeHavenAvailabilityProps> = ({ userId }) => {
  const [isAvailableToday, setIsAvailableToday] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start: '09:00', end: '17:00' }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [userId]);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      const data = await getSafeHavenAvailability(userId);
      if (data) {
        setIsAvailableToday(data.isAvailableToday || false);
        setTimeSlots(data.timeSlots && data.timeSlots.length > 0 
          ? data.timeSlots 
          : [{ start: '09:00', end: '17:00' }]
        );
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Je bent niet ingelogd');
        return;
      }

      await updateSafeHavenAvailability(userId, {
        isAvailableToday,
        timeSlots: isAvailableToday ? timeSlots : [],
      }, token);

      toast.success('Beschikbaarheid succesvol opgeslagen');
    } catch (error) {
      console.error('Failed to save availability:', error);
      toast.error('Kon beschikbaarheid niet opslaan. Probeer het opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: '09:00', end: '17:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
        <p className="mt-4 text-theme-purple-lighter/60">Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
              Je contactgegevens worden altijd weergegeven op de Safe Havens pagina. 
              Hier kun je aangeven op welke tijden je vandaag beschikbaar bent. 
              Deze tijden worden aan alle gebruikers getoond.
            </p>
          </div>
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="rounded-2xl bg-white/40 dark:bg-white/5 border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-theme-purple/10 p-3">
              <Feather className="h-6 w-6 text-theme-purple" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-theme">Vandaag beschikbaar</h3>
              <p className="text-sm text-theme-muted">Geef aan of je vandaag bereikbaar bent</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAvailableToday(!isAvailableToday)}
            className={[
              'relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200',
              isAvailableToday ? 'bg-theme-purple' : 'bg-gray-300 dark:bg-gray-600',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200',
                isAvailableToday ? 'translate-x-7' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {/* Time Slots */}
      {isAvailableToday && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-theme-purple" />
              <h3 className="text-lg font-bold text-theme">Beschikbare tijden</h3>
            </div>
            <button
              type="button"
              onClick={addTimeSlot}
              className="rounded-xl bg-theme-purple/10 px-4 py-2 text-sm font-semibold text-theme-purple hover:bg-theme-purple/20 transition"
            >
              + Tijdslot toevoegen
            </button>
          </div>

          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/10 p-4"
            >
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-theme-muted mb-1">
                    Van
                  </label>
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                    className="w-full rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 px-3 py-2 text-sm text-theme outline-none focus:ring-2 focus:ring-theme-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-theme-muted mb-1">
                    Tot
                  </label>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                    className="w-full rounded-xl bg-white/80 dark:bg-white/10 border border-white/20 px-3 py-2 text-sm text-theme outline-none focus:ring-2 focus:ring-theme-purple"
                  />
                </div>
              </div>
              {timeSlots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="shrink-0 rounded-xl bg-red-100 dark:bg-red-900/30 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                >
                  Verwijder
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-theme-purple px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-theme-purple/20 transition hover:bg-theme-purple-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Opslaan...' : 'Beschikbaarheid opslaan'}
        </button>
      </div>
    </div>
  );
};

export default SafeHavenAvailability;
