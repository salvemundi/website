'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';

export default function LoginPage() {
    const router = useRouter();
    const { loginWithMicrosoft, isLoading } = useAuth();

    const [error, setError] = useState('');

    const handleMicrosoftLogin = async () => {
        setError('');

        try {
            await loginWithMicrosoft();
            router.push('/account');
        } catch (err) {
            setError('Microsoft login failed. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-beige">

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-3xl shadow-2xl p-8">
                        <h1 className="text-3xl font-bold text-paars mb-2 text-center">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600 text-center mb-8">
                            Login to your account
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-paars/5 rounded-lg">
                                <p className="text-paars text-sm">{error}</p>
                            </div>
                        )}

                        {/* Microsoft Login Button */}
                        <button
                            onClick={handleMicrosoftLogin}
                            disabled={isLoading}
                            className="w-full mb-6 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-oranje to-paars text-white rounded-full shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                                <path fill="#f25022" d="M0 0h11v11H0z" />
                                <path fill="#00a4ef" d="M12 0h11v11H12z" />
                                <path fill="#7fba00" d="M0 12h11v11H0z" />
                                <path fill="#ffb900" d="M12 12h11v11H12z" />
                            </svg>
                            <span>
                                {isLoading ? 'Logging in...' : 'Login with Microsoft'}
                            </span>
                        </button>

                    </div>
                </div>
            </div>

        </div>
    );
}
