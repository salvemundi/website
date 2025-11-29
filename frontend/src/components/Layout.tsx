import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './NavBar';
import Footer from './Footer';
import { ROUTES } from '../routes';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const pathname = location.pathname;

    let activePage = '';
    if (pathname === ROUTES.HOME) activePage = 'Home';
    else if (pathname.startsWith(ROUTES.INTRO)) activePage = 'Intro';
    else if (pathname.startsWith(ROUTES.MEMBERSHIP)) activePage = 'Lidmaatschap';
    else if (pathname.startsWith(ROUTES.ACTIVITIES)) activePage = 'Activiteiten';
    else if (pathname.startsWith(ROUTES.COMMITTEES)) activePage = 'Commissies';
    else if (pathname.startsWith(ROUTES.CONTACT)) activePage = 'Contact';

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