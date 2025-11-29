"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../lib/api-clean";
import { useSiteSettings } from "../hooks/useApi";
import { ROUTES } from "../routes";

const Navbar: React.FC<{ activePage?: string }> = ({ activePage = "" }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef(0);
  const navRef = useRef<HTMLElement | null>(null);
  const [navHeight, setNavHeight] = useState(96);
  const { data: siteSettings } = useSiteSettings();
  const introEnabled = siteSettings?.show_intro ?? true;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll); 
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuRef.current) return;

    const targetHeight =
      typeof window !== "undefined" && window.CSS?.supports?.("height: 100dvh")
        ? "100dvh"
        : "100vh";

    if (menuOpen) {
      gsap.to(menuRef.current, {
        height: targetHeight,
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
  }, [menuOpen]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const body = document.body;

    if (menuOpen) {
      scrollPositionRef.current = window.scrollY;
      body.style.position = "fixed";
      body.style.top = `-${scrollPositionRef.current}px`;
      body.style.width = "100%";
      body.style.overflowY = "hidden";
    } else {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflowY = "";
      window.scrollTo(0, scrollPositionRef.current);
    }

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflowY = "";
    };
  }, [menuOpen]);

  const updateNavHeight = useCallback(() => {
    if (navRef.current) {
      setNavHeight(navRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    updateNavHeight();
  }, [updateNavHeight, isScrolled]);

  useEffect(() => {
    window.addEventListener("resize", updateNavHeight);
    window.addEventListener("orientationchange", updateNavHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("orientationchange", updateNavHeight);
    };
  }, [updateNavHeight]);

  const navItems = [
    { name: "Home", href: ROUTES.HOME },
    ...(introEnabled ? [{ name: "Intro", href: ROUTES.INTRO }] : []),
    { name: "Lidmaatschap", href: ROUTES.MEMBERSHIP },
    { name: "Activiteiten", href: ROUTES.ACTIVITIES },
    { name: "Commissies", href: ROUTES.COMMITTEES },
    { name: "Contact", href: ROUTES.CONTACT },
  ];

  const navbarBg = isScrolled
    ? "bg-beige/60 backdrop-blur-lg shadow-md transition-all duration-300"
    : "bg-beige transition-all duration-300";

  return (
    <>
      <nav
        ref={navRef}
        id="navbar"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        className={`w-full z-40 px-4 sm:px-6 md:px-8 fixed md:sticky top-0 left-0 right-0 ${navbarBg}`}
      >
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

        {/* Auth buttons + Hamburger */}
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate(ROUTES.ACCOUNT)}
              className="bg-oranje text-beige rounded-full font-semibold text-sm px-5 py-3 transition duration-300 hover:scale-105 flex items-center gap-2"
            >
              {user?.avatar ? (
                <img 
                  src={getImageUrl(user.avatar)} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/img/avatar-placeholder.svg';
                  }}
                />
              ) : (
                <span className="w-6 h-6 rounded-full bg-geel text-oranje flex items-center justify-center text-xs font-bold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              )}
              <span className="hidden sm:inline">Account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="bg-oranje text-beige rounded-full font-semibold text-sm px-5 py-3 transition duration-300 hover:scale-105"
            >
              Login
            </button>
          )}

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

        {/* Mobile menu */}
        <div
          ref={menuRef}
          style={{
            display: 'none',
            opacity: 0,
            overflow: "hidden",
            height: 0,
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
          }}
          className="fixed inset-0 z-40 md:hidden bg-oranje flex flex-col items-center justify-center px-5 pb-5"
        >
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute top-6 right-6 text-beige bg-paars rounded-full p-3 shadow-lg hover:bg-geel transition"
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
            
            <li className="pt-4 border-t border-beige/30 w-full text-center">
              {isAuthenticated ? (
                <a
                  href={ROUTES.ACCOUNT}
                  className="block font-semibold text-beige hover:text-geel transition duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  My Account
                </a>
              ) : (
                <a
                  href={ROUTES.LOGIN}
                  className="block font-semibold text-beige hover:text-geel transition duration-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </a>
              )}
            </li>
          </ul>
        </div>
      </nav>
      <div
        aria-hidden="true"
        className="block md:hidden w-full"
        style={{ height: `${navHeight}px` }}
      />
    </>
  );
};

export default Navbar;