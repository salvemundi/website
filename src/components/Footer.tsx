import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { documentsApi } from "../lib/api-clean";
import { committeesApi } from "../lib/api";
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
    <footer className="bg-paars text-beige py-12 px-10">
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
                    to={`/commissies/${committee.id}`}
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
                href="https://www.instagram.com/salvemundi/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-geel transition-colors"
              >
                Instagram
              </a>
            </li>
            <li>
              <a 
                href="https://www.facebook.com/salvemundi/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-geel transition-colors"
              >
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 pt-8 border-t border-beige/30 text-center text-sm">
        <p>
          Copyright © 2022 Salve Mundi alle rechten voorbehouden.{" "}
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
