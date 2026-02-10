'use client';

import { Tag } from 'lucide-react';

export interface TagListProps {
  tags: string[];
  counts?: Record<string, number>;
  selectedTags?: string[];
  onClick?: (tag: string) => void;
  maxTags?: number;
}

export default function TagList({
  tags,
  counts,
  selectedTags = [],
  onClick,
  maxTags,
}: TagListProps) {
  const displayedTags = maxTags ? tags.slice(0, maxTags) : tags;

  if (displayedTags.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-3 lg:mb-4">
        <Tag className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
        <h3 className="text-base lg:text-lg font-bold text-theme">
          Onderwerpen
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayedTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const count = counts?.[tag];

          return (
            <button
              key={tag}
              onClick={() => onClick?.(tag)}
              className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all ${isSelected
                  ? 'bg-gradient-theme text-white shadow-md'
                  : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
              disabled={!onClick}
            >
              {tag}
              {count !== undefined && (
                <span className={`ml-1.5 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {maxTags && tags.length > maxTags && (
        <p className="text-xs text-theme-muted mt-3">
          +{tags.length - maxTags} meer {tags.length - maxTags === 1 ? 'onderwerp' : 'onderwerpen'}
        </p>
      )}
    </div>
  );
}
