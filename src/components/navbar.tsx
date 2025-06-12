'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Intro', href: '/intro' },
    { name: 'Inschrijven', href: '/inschrijven' },
    { name: 'Activiteiten', href: '/activiteiten' },
    { name: 'Commissies', href: '/commissies' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="w-full z-20 py-2 px-8 sticky top-0 bg-beige">
      <div className="max-w-screen mx-auto flex items-center justify-between h-24">
        {/* Logo */}
        <a href="https://salvemundi.nl" className="flex items-center space-x-3">
          <Image
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
              className="text-beige font-semibold hover:text-geel transition duration-300"
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

      {/* Mobile menu animation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden mt-2 rounded-3xl bg-oranje p-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col space-y-3 font-medium">
              {navItems.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="block text-beige font-semibold hover:text-geel transition duration-300"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
