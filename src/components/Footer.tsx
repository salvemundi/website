import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { documentsApi } from "../lib/api-clean";
import { committeesApi } from "../lib/api";
import { slugify } from "../lib/slug";
import { Committee } from "../types";

interface Document {
  id: number;
  title: string;
  description?: string;
  file: string;
  category: string;
  display_order: number;
}

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
  return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

export default function Footer() {
  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getAll,
  });

  // Fetch committees
  const { data: committeesData = [] } = useQuery<Committee[]>({
    queryKey: ['committees-with-members'],
    queryFn: () => committeesApi.getAllWithMembers(),
    staleTime: 5 * 60 * 1000
  });

  // Sort committees so Bestuur is first, same as CommissiesPagina
  const committees = React.useMemo(() => {
    return [...committeesData].sort((a, b) => {
      const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
      const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');
      
      if (aIsBestuur && !bIsBestuur) return -1;
      if (!aIsBestuur && bIsBestuur) return 1;
      return 0;
    });
  }, [committeesData]);

  return (
    <footer className="bg-paars text-beige py-12 px-4 sm:px-8 lg:px-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Information */}
        <div>
          <h3 className="font-bold text-lg mb-4">INFORMATIE</h3>
          <ul className="space-y-2 text-sm">
            <li>Rachelsmolen 1</li>
            <li>5612 MA Eindhoven</li>
            <li>KvK nr. 70280606</li>
            {/* Documents from API */}
            {documents && documents.length > 0 ? (
              documents.map((doc: Document) => {
                const fileUrl = `${import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl'}/assets/${doc.file}`;
                return (
                  <li key={doc.id}>
                    <a 
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-geel transition-colors"
                      title={doc.description || doc.title}
                    >
                      {doc.title}
                    </a>
                  </li>
                );
              })
            ) : null}
          </ul>
        </div>

        {/* Pages */}
        <div>
          <h3 className="font-bold text-lg mb-4">PAGINA'S</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-geel transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/intro" className="hover:text-geel transition-colors">
                Intro
              </Link>
            </li>
            <li>
              <Link to="/activiteiten" className="hover:text-geel transition-colors">
                Activiteiten
              </Link>
            </li>
            <li>
              <Link to="/commissies" className="hover:text-geel transition-colors">
                Commissies
              </Link>
            </li>
            <li>
              <Link to="/clubs" className="hover:text-geel transition-colors">
                Clubs
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-geel transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/safe-havens" className="hover:text-geel transition-colors">
                Safe Havens
              </Link>
            </li>
            <li>
              <Link to="/inschrijven" className="hover:text-geel transition-colors">
                Inschrijven
              </Link>
            </li>
            <li>
              <Link to="/kroegentocht" className="hover:text-geel transition-colors">
                Kroegentocht
              </Link>
            </li>
          </ul>
        </div>

        {/* Commissies */}
        <div>
          <h3 className="font-bold text-lg mb-4">COMMISSIES</h3>
          <ul className="space-y-2 text-sm">
            {committees.length > 0 ? (
              committees.map((committee) => (
                <li key={committee.id}>
                  <Link 
                    to={`/commissies/${slugify(cleanCommitteeName(committee.name))}`}
                    className="hover:text-geel transition-colors"
                  >
                    {cleanCommitteeName(committee.name)}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-beige/60">Laden...</li>
            )}
          </ul>
        </div>

        {/* Contact & Social Media */}
        <div>
          <h3 className="font-bold text-lg mb-4">CONTACT</h3>
          <ul className="space-y-2 text-sm mb-6">
            <li>
              <a
                href="mailto:info@salvemundi.nl"
                className="hover:text-geel transition-colors"
              >
                info@salvemundi.nl
              </a>
            </li>
            <li>
              <a
                href="tel:+31624827777"
                className="hover:text-geel transition-colors"
              >
                +31 6 24827777
              </a>
            </li>
            <li>
              <a 
                href="https://wa.me/31624827777"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-geel transition-colors"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <Link 
                to="/safe-havens"
                className="hover:text-geel transition-colors"
              >
                Safe Havens
              </Link>
            </li>
          </ul>

          <h3 className="font-bold text-lg mb-4">SOCIAL MEDIA</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a 
                href="https://www.instagram.com/sv.salvemundi/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-geel transition-colors flex items-center gap-2"
              >
                <span className="inline-block w-4 h-4" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
                  </svg>
                </span>
                Instagram
              </a>
            </li>
            <li>
              <a 
                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-geel transition-colors flex items-center gap-2"
              >
                <span className="inline-block w-4 h-4" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2.2v-2.9h2.2V9.3c0-2.2 1.3-3.4 3.3-3.4.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2v1.5h2.3l-.4 2.9h-1.9v7A10 10 0 0 0 22 12z"></path>
                  </svg>
                </span>
                Facebook
              </a>
            </li>
            <li>
              <a 
                href="https://nl.linkedin.com/company/salve-mundi"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-geel transition-colors flex items-center gap-2"
              >
                <span className="inline-block w-4 h-4" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.1c.7-1.3 2.4-2.6 5-2.6 5.3 0 6.3 3.5 6.3 8.1V24h-5V15.4c0-2.1 0-4.8-2.9-4.8-2.9 0-3.3 2.2-3.3 4.6V24h-5V8z"></path>
                  </svg>
                </span>
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 pt-8 border-t border-beige/30 text-center text-sm">
        <p>
          Copyright © 2025 Salve Mundi alle rechten voorbehouden.{" "}
          <a 
            href="https://github.com/salvemundi/website"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-geel transition-colors"
          >
            Source code
          </a>
        </p>
      </div>
    </footer>
  );
}
