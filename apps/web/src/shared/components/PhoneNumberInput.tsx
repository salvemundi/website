import React, { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import nl from 'react-phone-number-input/locale/nl';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from '@/shared/lib/phone';

interface PhoneNumberInputProps {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string; // Additional classes for the wrapper
    validateMobile?: boolean; // If true, warns if Dutch number is not 06
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
    value,
    onChange,
    error: externalError,
    required = false,
    disabled = false,
    className = "",
    validateMobile = true // Default to true as requested
}) => {
    const [internalError, setInternalError] = useState<string | null>(null);

    // Validate on change (clear error if valid)
    const handleInternalChange = (val: string | undefined) => {
        onChange(val);

        if (!val) {
            setInternalError(null);
            return;
        }

        // If we currently have an error, re-validate immediately to clear it
        if (internalError) {
            const error = validateNumber(val);
            if (!error) setInternalError(null);
        }
    };

    const handleBlur = () => {
        if (value) {
            const error = validateNumber(value);
            setInternalError(error);
        } else if (required) {
            // Optional: handled by native 'required' usually, but can be added here
        } else {
            setInternalError(null);
        }
    };

    const validateNumber = (val: string): string | null => {
        if (!isValidPhoneNumber(val)) {
            return "Ongeldig telefoonnummer";
        }
        // Specific Dutch mobile check (+31)
        if (validateMobile && val.startsWith('+31')) {
            // E.164 format: +316...
            if (!val.startsWith('+316')) {
                return "Gebruik aub een 06-nummer";
            }
        }
        return null;
    };

    // Sync external error priority? Usually we show whichever exist, or merge.
    const displayError = externalError || internalError;
    const hasError = !!displayError;

    const handleCountryChange = (country: string | undefined) => {
        if (country === 'NL' && !value) {
            // Pre-fill with +316 so it shows as '06' in national format
            onChange('+316');
        } else if (value === '+316' && country !== 'NL') {
            // Clear the pre-fill if they switch away from NL
            onChange(undefined);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            <div className={`
                form-input-wrapper 
                [&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:gap-2
                [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:text-inherit [&_.PhoneInputInput]:placeholder-gray-400
                [&_.PhoneInputCountry]:mr-2 
                
                /* Styled Country Select */
                [&_.PhoneInputCountrySelect]:bg-[var(--bg-card)] 
                [&_.PhoneInputCountrySelect]:text-[var(--text-main)]
                [&_.PhoneInputCountrySelect]:border-[var(--border-color)]
                [&_.PhoneInputCountrySelect]:rounded-md
                [&_.PhoneInputCountrySelect]:p-1
                [&_.PhoneInputCountrySelect_option]:bg-[var(--bg-card)]
                [&_.PhoneInputCountrySelect_option]:text-[var(--text-main)]
                
                /* Dark mode specific overrides for the native select which can be stubborn */
                dark:[&_.PhoneInputCountrySelect]:bg-[#241824]
                dark:[&_.PhoneInputCountrySelect]:text-white
                
                ${hasError ? 'border-red-400 focus-within:ring-red-400 ring-1 ring-red-400/50' : ''}
            `}>
                <PhoneInput
                    placeholder="06 12345678"
                    value={value}
                    onChange={handleInternalChange}
                    onBlur={handleBlur}
                    onCountryChange={handleCountryChange}
                    defaultCountry="NL"
                    international={false} // Switch to national format display (hides +31)
                    labels={nl}
                    disabled={disabled}
                    className={`form-input !flex items-center gap-2 ${className}`}
                    numberInputProps={{
                        required: required,
                        maxLength: 20,
                        className: "bg-transparent border-none outline-none w-full h-full text-current placeholder:text-gray-400 focus:ring-0",
                        suppressHydrationWarning: true
                    } as any}
                    countrySelectProps={{
                        suppressHydrationWarning: true
                    } as any}
                />
            </div>
            {displayError && <p className="text-red-300 text-sm mt-1 font-medium animate-in slide-in-from-top-1 fade-in duration-200">{displayError}</p>}
        </div>
    );
};

export { isValidPhoneNumber };
