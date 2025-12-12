'use client';

import React, { useEffect, useState } from 'react';
import { List } from 'lucide-react';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  headings: Heading[];
  sticky?: boolean;
}

export default function TableOfContents({
  headings,
  sticky = true,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className={`bg-[var(--bg-card)] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg ${
        sticky ? 'sticky top-20' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-3 lg:mb-4">
        <List className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
        <h3 className="text-base lg:text-lg font-bold text-theme">
          Inhoudsopgave
        </h3>
      </div>

      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
          >
            <button
              onClick={() => handleClick(heading.id)}
              className={`text-left text-sm lg:text-base transition-colors hover:text-theme-purple w-full ${
                activeId === heading.id
                  ? 'text-theme-purple font-semibold'
                  : 'text-theme-muted'
              }`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
