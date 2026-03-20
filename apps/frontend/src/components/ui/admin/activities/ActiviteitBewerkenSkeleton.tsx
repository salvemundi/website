import { ArrowLeft } from 'lucide-react';

export default function ActiviteitBewerkenSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl overflow-x-hidden animate-pulse">
            <div className="mb-6 flex items-center gap-2 text-slate-300 dark:text-slate-700">
                <ArrowLeft className="h-5 w-5" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6 border border-slate-100 dark:border-slate-700/50">
                {/* Basic Info */}
                <div>
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                    <div className="lg:col-span-2">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                    <div className="lg:col-span-2">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                    <div className="lg:col-span-2">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                    <div>
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                </div>

                <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-32 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                </div>

                <div>
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-24 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                </div>

                {/* Capacity & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                    <div>
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                    <div>
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                    </div>
                </div>

                <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-12 w-full bg-slate-100 dark:bg-slate-900 rounded-lg" />
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                    <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="w-32 h-12 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                </div>
            </div>
        </div>
    );
}
