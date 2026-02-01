'use client';

import { motion } from 'framer-motion';
import { getSubcategoryConfig, getSubcategoriesForPillar } from '@/lib/subcategories';
import { CustomSubcategory } from './AddSubCategoryModal';

interface SubCategoryTabsProps {
  pillar: 'BODY' | 'MIND';
  selectedCategory: string;
  customCategories: CustomSubcategory[];
  onSelect: (category: string) => void;
  onAddCustom: () => void;
  onEditCustom?: (subcategory: CustomSubcategory) => void;
  showAllTab?: boolean;
}

export function SubCategoryTabs({
  pillar,
  selectedCategory,
  customCategories,
  onSelect,
  onAddCustom,
  onEditCustom,
  showAllTab = true,
}: SubCategoryTabsProps) {
  const predefined = getSubcategoriesForPillar(pillar);
  const pillarColor = pillar === 'BODY' ? '#E8A854' : '#5BCCB3';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* All Tab */}
      {showAllTab && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('ALL')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'ALL'
              ? 'text-background'
              : 'bg-surface-light text-text-secondary hover:text-text-primary'
          }`}
          style={selectedCategory === 'ALL' ? { backgroundColor: pillarColor } : {}}
        >
          All
        </motion.button>
      )}

      {/* Predefined categories */}
      {predefined.map((category) => {
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

      {/* Custom categories */}
      {customCategories.map((custom) => {
        const isSelected = selectedCategory === custom.key;
        const categoryColor = custom.color || pillarColor;

        return (
          <div key={custom.id} className="relative flex items-center group">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(custom.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'text-background'
                  : 'bg-surface-light text-text-secondary hover:text-text-primary'
              } ${onEditCustom ? 'pr-8' : ''}`}
              style={isSelected ? { backgroundColor: categoryColor } : {}}
            >
              {custom.name}
            </motion.button>

            {onEditCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCustom(custom);
                }}
                className={`absolute right-1 p-1 rounded-full transition-opacity ${
                  isSelected
                    ? 'text-background/70 hover:text-background'
                    : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-primary'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
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
