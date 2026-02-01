'use client';

import { motion } from 'framer-motion';
import { getSubcategoryConfig, getSubcategoriesForPillar } from '@/lib/subcategories';

interface SubCategoryTabsProps {
  pillar: 'BODY' | 'MIND';
  selectedCategory: string;
  customCategories: string[];
  onSelect: (category: string) => void;
  onAddCustom: () => void;
}

export function SubCategoryTabs({
  pillar,
  selectedCategory,
  customCategories,
  onSelect,
  onAddCustom,
}: SubCategoryTabsProps) {
  const predefined = getSubcategoriesForPillar(pillar);
  const allCategories = [...predefined, ...customCategories];
  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#7C9EE9';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {allCategories.map((category) => {
        const config = getSubcategoryConfig(category);
        const isSelected = selectedCategory === category;
        const label = config?.label ?? category;

        return (
          <motion.button
            key={category}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              isSelected
                ? 'text-background'
                : 'bg-surface-light text-text-secondary hover:text-text-primary'
            }`}
            style={isSelected ? { backgroundColor: config?.color ?? pillarColor } : {}}
          >
            {label}
          </motion.button>
        );
      })}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onAddCustom}
        className="px-3 py-2 rounded-full text-sm font-medium bg-surface-light text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>
    </div>
  );
}
