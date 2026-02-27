import Link from 'next/link';

export function Navigation() {
    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center pr-8 border-r">
                            <Link href="/" className="text-xl font-bold text-blue-900">
                                Salve Mundi V7
                            </Link>
                        </div>
                        <div className="flex items-center space-x-8 pl-8">
                            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                                Public (Home)
                            </Link>
                            <Link href="/profiel" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
                                Logged in
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Secure</span>
                            </Link>
                            <Link href="/beheer" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
                                Beheer
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Admin</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
