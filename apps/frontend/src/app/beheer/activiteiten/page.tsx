import { connection } from 'next/server';

export default async function Page() { 
    await connection();
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Activiteiten Beheer</h1>
            <p className="text-slate-500 italic">Binnenkort beschikbaar...</p>
        </div>
    );
}
