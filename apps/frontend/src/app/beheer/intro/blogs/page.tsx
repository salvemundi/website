import Link from 'next/link';

export default function Page() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-blue-900">Hello World</h1>
            <p className="text-xl text-gray-600 mb-8">Route: /beheer/intro/blogs</p>

            {/* If there were deep links under here, they'd go in a hub. Since it's the leaf, this is fine, but lets structure it to match the hierarchy request if needed */}
        </div>
    );
}
