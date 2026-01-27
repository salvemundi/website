import React from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import nl from 'react-phone-number-input/locale/nl';
import 'react-phone-number-input/style.css';

interface PhoneNumberInputProps {
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string; // Additional classes for the wrapper
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    className = ""
}) => {
    return (
        <div className={`w-full ${className}`}>
            <div className={`
                form-input-wrapper 
                [&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:gap-2
                [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:text-inherit [&_.PhoneInputInput]:placeholder-gray-400
                [&_.PhoneInputCountry]:mr-2 
                [&_.PhoneInputCountrySelect]:bg-transparent 
                ${error ? 'border-red-400 focus-within:ring-red-400' : ''}
            `}>
                <PhoneInput
                    placeholder="06 12345678"
                    value={value}
                    onChange={onChange}
                    defaultCountry="NL"
                    labels={nl}
                    disabled={disabled}
                    className="form-input" // Reuse the existing form-input class for the container look
                    numberInputProps={{
                        required: required,
                        className: "bg-transparent border-none outline-none w-full h-full text-current placeholder:text-gray-400 focus:ring-0" // Reset internal input styles
                    }}
                />
            </div>
            {error && <p className="text-red-300 text-sm mt-1 font-medium">{error}</p>}
        </div>
    );
};

export { isValidPhoneNumber };
