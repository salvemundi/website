import React from "react";

export default function Footer() {
  return (
    <footer className="bg-paars text-beige py-12 px-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Information */}
        <div>
          <h3 className="font-bold text-lg mb-4">INFORMATIE</h3>
          <ul className="space-y-2 text-sm">
            <li>Rachelsmolen 1</li>
            <li>5612 MA Eindhoven</li>
            <li>KvK nr. 70290606</li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Responsible Disclosure
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Download privecy-voorwaarden
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Download huisreglement
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Download statuten
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-bold text-lg mb-4">CONTACT</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="mailto:info@salvemundi.nl"
                className="hover:text-geel transition-colors"
              >
                info@salvemundi.nl
              </a>
            </li>
            <li>+31 6 29777777</li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                WhatsApp
              </a>
            </li>
          </ul>
        </div>

        {/* Commissies */}
        <div>
          <h3 className="font-bold text-lg mb-4">COMMISSIES</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Bestuur
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Feestcommissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Mediacommissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Introcommissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Kascommissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                ICT commissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                PR-commissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Activiteitencommissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Studiecommissie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Reiscommissie
              </a>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="font-bold text-lg mb-4">SOCIAL MEDIA</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                Facebook
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-geel transition-colors">
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 pt-8 border-t border-beige/30 text-center text-sm">
        <p>
          Copyright © 2022 Salve Mundi alle rechten voorbehouden.{" "}
          <a href="#" className="hover:text-geel transition-colors">
            Source code
          </a>
        </p>
      </div>
    </footer>
  );
}
