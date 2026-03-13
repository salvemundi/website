import { User, Gamepad2, Mail, Phone, Calendar } from 'lucide-react';

export const ProfielSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left Column */}
                <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                    {/* User Profile Tile */}
                    <div className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-lg">
                        <div className="flex flex-col gap-6 items-center text-center">
                            <div className="h-32 w-32 rounded-full bg-[var(--color-purple-100)]" />
                            <div className="w-full flex flex-col items-center">
                                <div className="h-8 w-48 rounded bg-[var(--color-purple-100)] mb-4" />
                                <div className="h-6 w-32 rounded-full bg-[var(--color-purple-100)] mb-6" />
                                
                                <div className="h-4 w-24 rounded bg-[var(--color-purple-100)] mb-3" />
                                <div className="flex gap-2 justify-center mb-6">
                                    <div className="h-8 w-24 rounded-full bg-[var(--color-purple-100)]" />
                                    <div className="h-8 w-24 rounded-full bg-[var(--color-purple-100)]" />
                                </div>
                                
                                <div className="w-full rounded-2xl bg-[var(--color-purple-50)] p-5">
                                    <div className="h-3 w-24 rounded bg-[var(--color-purple-100)] mb-2 mx-auto" />
                                    <div className="h-6 w-32 rounded bg-[var(--color-purple-100)] mx-auto" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Gaming Tile */}
                    <div className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-2xl bg-[var(--color-purple-100)] p-2.5">
                                <Gamepad2 className="h-5 w-5 opacity-20" />
                            </div>
                            <div className="h-8 w-32 rounded bg-[var(--color-purple-100)]" />
                        </div>
                        <div className="rounded-2xl bg-[var(--color-purple-50)] p-5">
                            <div className="flex justify-between items-center mb-3">
                                <div className="h-3 w-24 rounded bg-[var(--color-purple-100)]" />
                                <div className="h-6 w-16 rounded-xl bg-[var(--color-purple-100)]" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Gamepad2 className="h-5 w-5 opacity-20" />
                                <div className="h-5 w-32 rounded bg-[var(--color-purple-100)]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
                    {/* Data Tile */}
                    <div className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-2xl bg-[var(--color-purple-100)] p-2.5">
                                <Mail className="h-5 w-5 opacity-20" />
                            </div>
                            <div className="h-8 w-40 rounded bg-[var(--color-purple-100)]" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-2xl bg-[var(--color-purple-50)] p-5">
                                    <div className="flex justify-between mb-3">
                                        <div className="h-3 w-20 rounded bg-[var(--color-purple-100)]" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-[var(--color-purple-100)]" />
                                        <div className="h-5 w-32 rounded bg-[var(--color-purple-100)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Links Tile */}
                    <div className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-40 rounded bg-[var(--color-purple-100)]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-16 rounded-2xl bg-[var(--color-purple-50)]" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Column */}
                <div className="md:col-span-12">
                    <div className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-[var(--color-purple-100)] p-2.5">
                                    <Calendar className="h-5 w-5 opacity-20" />
                                </div>
                                <div className="h-8 w-48 rounded bg-[var(--color-purple-100)]" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-24 rounded-xl bg-[var(--color-purple-100)]" />
                                <div className="h-8 w-24 rounded-xl bg-[var(--color-purple-100)]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 rounded-3xl bg-[var(--color-purple-50)] flex items-center p-5 gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-[var(--color-purple-100)]" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 w-full rounded bg-[var(--color-purple-100)]" />
                                        <div className="h-3 w-1/2 rounded bg-[var(--color-purple-100)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
