import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './NavBar';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const pathname = location.pathname;

    let activePage = '';
    if (pathname === '/') activePage = 'Home';
    else if (pathname.startsWith('/intro')) activePage = 'Intro';
    else if (pathname.startsWith('/inschrijven')) activePage = 'Inschrijven';
    else if (pathname.startsWith('/activiteiten')) activePage = 'Activiteiten';
    else if (pathname.startsWith('/commissies')) activePage = 'Commissies';
    else if (pathname.startsWith('/contact')) activePage = 'Contact';

    return (
        <div className="flex flex-col min-h-screen bg-beige">
            <Navbar activePage={activePage} />
            <div className="flex-grow flex flex-col w-full">
                {children}
            </div>
            <Footer />
        </div>
    );
}
