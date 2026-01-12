'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { motion } from 'framer-motion';
import { CheckCircle, Home, User } from 'lucide-react';

export default function SignUpConfirmation() {
    const router = useRouter();

    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader
                    title="BEDANKT!"
                    backgroundImage="/img/placeholder.svg"
                />
            </div>

            <main className="">
                <div className="flex flex-col items-center justify-center p-6 sm:p-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-2xl bg-gradient-theme rounded-3xl shadow-lg p-8 sm:p-12 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </motion.div>

                        <h1 className="text-3xl sm:text-4xl font-bold text-theme-white mb-4">
                            Inschrijving Geslaagd!
                        </h1>

                        <p className="text-lg text-theme-white/90 mb-8 max-w-lg mx-auto">
                            Bedankt voor je inschrijving bij Salve Mundi. Je betaling is verwerkt en je bent nu officieel lid!
                            We hebben een bevestigingsmail naar je gestuurd.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/account')}
                                className="flex items-center justify-center gap-2 bg-theme-white text-theme-purple-darker font-bold py-3 px-6 rounded-xl shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                <User className="w-5 h-5" />
                                Naar mijn account
                            </button>

                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center justify-center gap-2 bg-theme-purple-darker/50 text-theme-white font-bold py-3 px-6 rounded-xl border border-theme-white/20 transition-transform hover:-translate-y-0.5 hover:bg-theme-purple-darker/70"
                            >
                                <Home className="w-5 h-5" />
                                Terug naar home
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </>
    );
}
