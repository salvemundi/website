'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { subscribeToNewsletterAction } from '@/shared/api/newsletter-actions';

export interface NewsletterSignupProps {
  placement?: 'inline' | 'modal' | 'hero';
  showCount?: boolean;
  subscriberCount?: number;
  onSuccess?: () => void;
}

export default function NewsletterSignup({
  placement = 'inline',
  showCount = false,
  subscriberCount,
  onSuccess,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Voer een geldig e-mailadres in');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use Server Action instead of client-side fetch
      const result = await subscribeToNewsletterAction(email);

      if (!result.success) {
        throw new Error(result.error || 'Er is iets misgegaan');
      }

      setIsSuccess(true);
      setEmail('');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden. Probeer het later opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerClass = {
    inline: 'bg-[var(--bg-card)] rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-lg',
    modal: 'bg-white rounded-2xl p-6 lg:p-8 max-w-md mx-auto',
    hero: 'bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-6',
  }[placement];

  const textClass = placement === 'hero' ? 'text-white' : 'text-theme';
  const mutedClass = placement === 'hero' ? 'text-white/80' : 'text-theme-muted';

  if (isSuccess) {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <CheckCircle2 className={`w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 ${placement === 'hero' ? 'text-white' : 'text-green-500'}`} />
          <h3 className={`text-xl lg:text-2xl font-bold mb-2 ${textClass}`}>
            Bedankt voor je inschrijving!
          </h3>
          <p className={`text-sm lg:text-base ${mutedClass}`}>
            Je ontvangt binnenkort updates over de intro in je inbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2 mb-3 lg:mb-4">
        <Mail className={`w-5 h-5 lg:w-6 lg:h-6 ${placement === 'hero' ? 'text-white' : 'text-theme-purple'}`} />
        <h3 className={`text-lg lg:text-xl font-bold ${textClass}`}>
          Blijf op de hoogte
        </h3>
      </div>

      <p className={`text-sm lg:text-base mb-4 ${mutedClass}`}>
        Schrijf je in voor updates over de introweek en mis niets!
      </p>

      {showCount && subscriberCount && (
        <p className={`text-xs lg:text-sm mb-3 ${mutedClass}`}>
          Sluit je aan bij {subscriberCount}+ andere intro deelnemers
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder="jouw@email.nl"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          disabled={isSubmitting}
          className={`flex-1 px-4 py-2 lg:py-3 rounded-lg border ${placement === 'hero'
            ? 'bg-white/20 border-white/30 text-white placeholder-white/60'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-theme-purple transition-all`}
          autoComplete="email"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2 lg:py-3 font-semibold rounded-lg transition-all ${placement === 'hero'
            ? 'bg-white text-theme-purple hover:bg-gray-100'
            : 'bg-gradient-theme text-white hover:brightness-110'
            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Bezig...
            </>
          ) : (
            'Inschrijven'
          )}
        </button>
      </form>

      {error && (
        <p className="text-red-500 text-xs lg:text-sm mt-2">{error}</p>
      )}

      <p className={`text-xs mt-3 ${mutedClass}`}>
        We respecteren je privacy. Je kunt je altijd uitschrijven.
      </p>
    </div>
  );
}
