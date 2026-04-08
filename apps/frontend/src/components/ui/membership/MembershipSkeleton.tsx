import React from 'react';
import { Skeleton } from '../Skeleton';
import PageHeader from '../layout/PageHeader';

export default function MembershipSkeleton() {
    return (
        <>
            <PageHeader
                title="WORD LID!"
                backgroundImage=""
                contentPadding="py-20"
                imageFilter="brightness(0.65)"
            />

            <main className="max-w-app mx-auto">
                <div className="flex flex-col sm:flex-row gap-6 px-6 py-8 sm:py-10 md:py-12">
                    <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] shadow-xl p-6 sm:p-10 w-full sm:w-1/2" aria-busy="true">
                        <h1 className="text-4xl font-black text-theme-purple dark:text-purple-400 mb-8 tracking-tight opacity-50">
                            INSCHRIJVEN
                        </h1>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20 bg-theme-purple/10" rounded="full" />
                                    <Skeleton className="h-12 w-full bg-theme-purple/5" rounded="xl" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20 bg-theme-purple/10" rounded="full" />
                                    <Skeleton className="h-12 w-full bg-theme-purple/5" rounded="xl" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-3 w-12 bg-theme-purple/10" rounded="full" />
                                <Skeleton className="h-12 w-full bg-theme-purple/5" rounded="xl" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-3 w-24 bg-theme-purple/10" rounded="full" />
                                <Skeleton className="h-12 w-full bg-theme-purple/5" rounded="xl" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-3 w-28 bg-theme-purple/10" rounded="full" />
                                <Skeleton className="h-12 w-full bg-theme-purple/5" rounded="xl" />
                            </div>

                            <Skeleton className="h-14 w-full mt-6 bg-theme-purple/20" rounded="xl" />
                        </div>
                    </section>

                    <aside className="w-full sm:w-1/2 flex flex-col gap-6">
                        <div className="w-full text-center bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] p-8 shadow-lg">
                            <h2 className="text-3xl font-black text-theme-purple dark:text-purple-400 mb-4 tracking-tight opacity-50">
                                WAAROM LID WORDEN?
                            </h2>
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full bg-theme-purple/5" rounded="full" />
                                <Skeleton className="h-4 w-5/6 mx-auto bg-theme-purple/5" rounded="full" />
                                <Skeleton className="h-4 w-4/6 mx-auto bg-theme-purple/5" rounded="full" />
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}
