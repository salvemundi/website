'use client';

import React, { useEffect, useState } from 'react';
import { Save, Info, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { getSafeHavenAvailability, updateSafeHavenAvailability } from '@/shared/lib/api/salvemundi';

type TimeSlot = { start: string; end: string };

type DayAvailability = {
  day: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
};

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_NAMES: Record<string, string> = {
  monday: 'Maandag',
  tuesday: 'Dinsdag',
  wednesday: 'Woensdag',
  thursday: 'Donderdag',
  friday: 'Vrijdag',
  saturday: 'Zaterdag',
  sunday: 'Zondag',
};

export default function SafeHavenWeeklyAvailability({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [week, setWeek] = useState<DayAvailability[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => { load(); }, [userId]);

  const makeDefaultWeek = (): DayAvailability[] => (
    DAYS.map(d => ({ day: d, isAvailable: false, timeSlots: [{ start: '09:00', end: '17:00' }] }))
  );

  const load = async () => {
    setLoading(true);
    try {
      console.log('[SafeHavenWeeklyAvailability] Loading availability for user:', userId);
      const data = await getSafeHavenAvailability(userId);
      console.log('[SafeHavenWeeklyAvailability] Loaded data:', data);
      
      let initialWeek = makeDefaultWeek();
      if (data && data.week) {
        initialWeek = data.week.map((w: any) => ({ 
          day: w.day, 
          isAvailable: !!w.isAvailable, 
          timeSlots: w.timeSlots && w.timeSlots.length > 0 ? w.timeSlots : [{ start: '09:00', end: '17:00' }] 
        }));
      } else if (data && (data.timeSlots || data.isAvailableToday !== undefined)) {
        // Map legacy single-day to all days with same availability
        const slots = data.timeSlots && data.timeSlots.length > 0 ? data.timeSlots : [{ start: '09:00', end: '17:00' }];
        initialWeek = DAYS.map(d => ({ day: d, isAvailable: !!data.isAvailableToday, timeSlots: slots }));
      }
      setWeek(initialWeek);
    } catch (e) {
      console.error('[SafeHavenWeeklyAvailability] Load error:', e);
      toast.error('Kon beschikbaarheid niet laden');
      setWeek(makeDefaultWeek());
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    const copy = [...week];
    copy[dayIndex].isAvailable = !copy[dayIndex].isAvailable;
    setWeek(copy);
  };

  const addTimeSlot = (dayIndex: number) => {
    const copy = [...week];
    copy[dayIndex].timeSlots.push({ start: '09:00', end: '17:00' });
    setWeek(copy);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const copy = [...week];
    if (copy[dayIndex].timeSlots.length > 1) {
      copy[dayIndex].timeSlots.splice(slotIndex, 1);
    }
    setWeek(copy);
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    const copy = [...week];
    copy[dayIndex].timeSlots[slotIndex][field] = value;
    setWeek(copy);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('[SafeHavenWeeklyAvailability] Saving availability...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[SafeHavenWeeklyAvailability] No auth token found');
        toast.error('Je bent niet ingelogd');
        return;
      }

      // Prepare payload
      const payloadWeek = week.map(d => ({
        day: d.day,
        isAvailable: d.isAvailable,
        timeSlots: d.isAvailable ? d.timeSlots : []
      }));

      console.log('[SafeHavenWeeklyAvailability] Payload week:', payloadWeek);

      // Compute today's legacy fields for compatibility
      const today = new Date();
      const dayNameMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const todayName = dayNameMap[today.getDay()];
      const todayEntry = payloadWeek.find(w => w.day === todayName);
      const legacyIsAvailable = todayEntry ? todayEntry.isAvailable : false;
      const legacyTimeSlots = todayEntry ? todayEntry.timeSlots : [];

      console.log('[SafeHavenWeeklyAvailability] Today:', todayName, 'Legacy fields:', { legacyIsAvailable, legacyTimeSlots });

      await updateSafeHavenAvailability(userId, { 
        week: payloadWeek, 
        isAvailableToday: legacyIsAvailable, 
        timeSlots: legacyTimeSlots 
      }, token);
      
      console.log('[SafeHavenWeeklyAvailability] Save successful');
      toast.success('Beschikbaarheid succesvol opgeslagen');
      
      // Reload to confirm save
      await load();
    } catch (e: any) {
      console.error('[SafeHavenWeeklyAvailability] Save error:', e);
      toast.error(e?.message || 'Kon beschikbaarheid niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
        <p className="mt-4 text-theme-muted">Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 leading-relaxed">
              Stel je beschikbaarheid in per dag. Schakel een dag in en voeg tijdslots toe voor de uren dat je bereikbaar bent. 
              Je contactgegevens worden altijd weergegeven.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {week.map((day, dayIndex) => (
          <div 
            key={day.day} 
            className="rounded-2xl bg-white/40 dark:bg-white/5 border border-white/10 overflow-hidden transition-all"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                    className="text-theme-muted hover:text-theme transition-colors"
                  >
                    {expandedDay === day.day ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <h3 className="text-lg font-bold text-theme">{DAY_NAMES[day.day]}</h3>
                </div>
                
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <span className="text-sm text-theme-muted">Beschikbaar</span>
                  <button
                    type="button"
                    onClick={() => toggleDay(dayIndex)}
                    className={[
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      day.isAvailable ? 'bg-theme-purple' : 'bg-gray-300 dark:bg-gray-600'
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform',
                        day.isAvailable ? 'translate-x-6' : 'translate-x-1'
                      ].join(' ')}
                    />
                  </button>
                </label>
              </div>

              {day.isAvailable && expandedDay === day.day && (
                <div className="mt-4 space-y-3 pt-4 border-t border-white/10">
                  {day.timeSlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-theme-muted mb-1">Van</label>
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start', e.target.value)}
                            className="w-full rounded-xl bg-white dark:bg-white/10 border border-white/20 px-3 py-2 text-sm text-theme outline-none focus:ring-2 focus:ring-theme-purple"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-theme-muted mb-1">Tot</label>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end', e.target.value)}
                            className="w-full rounded-xl bg-white dark:bg-white/10 border border-white/20 px-3 py-2 text-sm text-theme outline-none focus:ring-2 focus:ring-theme-purple"
                          />
                        </div>
                      </div>
                      {day.timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                          className="mt-5 shrink-0 rounded-xl bg-red-100 dark:bg-red-900/30 p-2 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                          title="Verwijder tijdslot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addTimeSlot(dayIndex)}
                    className="inline-flex items-center gap-2 rounded-xl bg-theme-purple/10 px-4 py-2 text-sm font-semibold text-theme-purple hover:bg-theme-purple/20 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Tijdslot toevoegen
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-theme-muted">
          Wijzigingen worden direct opgeslagen bij alle gebruikers
        </p>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-theme-purple px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-theme-purple/20 hover:bg-theme-purple-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  );
}
