// Navbar.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface navProps {
  activePage?: string;
}

// Responsive NavBar with scroll animation and GSAP mobile menu
const Navbar: React.FC<{ activePage?: string }> = ({ activePage = "" }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

  window.addEventListener("scroll", handleScroll); 
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animate mobile menu open/close
  useEffect(() => {
    if (menuRef.current) {
      if (menuOpen) {
        gsap.to(menuRef.current, {
          height: "100%",
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          display: "",
        });
      } else {
        gsap.to(menuRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          display: "flex",
        });
      }
    }
  }, [menuOpen]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Intro", href: "/intro" },
    { name: "Inschrijven", href: "/inschrijven" },
    { name: "Activiteiten", href: "/activiteiten" },
    { name: "Commissies", href: "/commissies" },
    { name: "Contact", href: "/contact" },
  ];

  const navbarBg = isScrolled
    ? "bg-beige/60 backdrop-blur-lg shadow-md transition-all duration-300"
    : "bg-beige transition-all duration-300";

  return (
    <nav id="navbar" className={`w-full z-20 px-8 sticky top-0 ${navbarBg}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-screen mx-auto flex items-center justify-between h-24">
        {/* Logo */}
        <a href="https://salvemundi.nl" className="flex items-center space-x-3">
          <img
            src="/img/Logo.png"
            alt="Salve Mundi Logo"
            width={80}
            height={80}
            className="w-20 h-auto"
          />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex md:items-center bg-oranje p-4 rounded-full md:space-x-8 font-medium">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`font-semibold transition duration-300 ${
                activePage === item.name
                  ? "text-geel underline underline-offset-4"
                  : "text-beige hover:text-geel"
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Login + Hamburger */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="bg-oranje text-beige rounded-full font-semibold text-sm px-5 py-3 transition duration-300 hover:scale-105"
          >
            Login
          </button>

          {/* Hamburger */}
          <button
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-beige bg-oranje rounded-lg hover:bg-paars focus:outline-none focus:ring-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu (GSAP animated, full-page overlay) */}
      <div
        ref={menuRef}
        style={{ display: 'none', opacity: 0, overflow: "hidden", paddingTop: 'env(safe-area-inset-top)' }}
        className="fixed top-0 left-0 w-screen h-screen z-40 md:hidden bg-oranje flex flex-col items-center justify-center p-5"
      >
        {/* Close button */}
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="absolute top-6 right-6 text-beige bg-paars rounded-full p-3 shadow-lg hover:bg-geel transition"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ul className="flex flex-col items-center justify-center space-y-8 font-bold text-2xl">
          {navItems.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={`block font-semibold transition duration-300 ${
                  activePage === item.name
                    ? "text-geel underline underline-offset-4"
                    : "text-beige hover:text-geel"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
