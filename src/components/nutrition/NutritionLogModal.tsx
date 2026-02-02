'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NutritionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: (data: NutritionData) => void;
  initialData?: NutritionData;
}

export interface NutritionData {
  proteinGrams: number;
  mealQuality: {
    breakfast: 'healthy' | 'okay' | 'bad' | null;
    lunch: 'healthy' | 'okay' | 'bad' | null;
    dinner: 'healthy' | 'okay' | 'bad' | null;
  };
}

const BODY_COLOR = '#E8A854';

export function NutritionLogModal({
  isOpen,
  onClose,
  onLogged,
  initialData,
}: NutritionLogModalProps) {
  const [proteinGrams, setProteinGrams] = useState<number>(initialData?.proteinGrams ?? 0);
  const [mealQuality, setMealQuality] = useState<NutritionData['mealQuality']>(
    initialData?.mealQuality ?? {
      breakfast: null,
      lunch: null,
      dinner: null,
    }
  );

  const handleSave = () => {
    onLogged({
      proteinGrams,
      mealQuality,
    });
    onClose();
  };

  const hasAnyData = proteinGrams > 0 || Object.values(mealQuality).some((v) => v !== null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50 bg-surface rounded-2xl border border-white/10 shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Log Nutrition</h2>
                  <p className="text-xs text-text-muted">Track meals and protein</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Protein Tracking */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-text-secondary">Protein Intake</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={proteinGrams}
                      onChange={(e) => setProteinGrams(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 px-2 py-1 text-right text-sm font-medium bg-surface-light rounded-lg border border-white/10 text-text-primary focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                    <span className="text-sm text-text-muted">g</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={proteinGrams}
                  onChange={(e) => setProteinGrams(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-light rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${BODY_COLOR} 0%, ${BODY_COLOR} ${proteinGrams / 2}%, rgba(255,255,255,0.1) ${proteinGrams / 2}%)`,
                  }}
                />
                <div className="flex justify-between mt-2">
                  {[0, 50, 100, 150, 200].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setProteinGrams(preset)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        proteinGrams === preset
                          ? 'bg-surface-lighter text-text-primary'
                          : 'text-text-muted hover:bg-surface-light'
                      }`}
                    >
                      {preset}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Meal Quality Tracking */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-4">Meal Quality</h3>
                <div className="space-y-4">
                  {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => {
                    const mealLabels = {
                      breakfast: 'Breakfast',
                      lunch: 'Lunch',
                      dinner: 'Dinner',
                    };
                    const mealIcons = {
                      breakfast: '🌅',
                      lunch: '☀️',
                      dinner: '🌙',
                    };
                    const currentQuality = mealQuality[meal];

                    return (
                      <div key={meal} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mealIcons[meal]}</span>
                          <span className="text-sm text-text-secondary">{mealLabels[meal]}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() =>
                              setMealQuality((prev) => ({
                                ...prev,
                                [meal]: prev[meal] === 'healthy' ? null : 'healthy',
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              currentQuality === 'healthy'
                                ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                                : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                            }`}
                          >
                            Healthy
                          </button>
                          <button
                            onClick={() =>
                              setMealQuality((prev) => ({
                                ...prev,
                                [meal]: prev[meal] === 'okay' ? null : 'okay',
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              currentQuality === 'okay'
                                ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30'
                                : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                            }`}
                          >
                            Okay
                          </button>
                          <button
                            onClick={() =>
                              setMealQuality((prev) => ({
                                ...prev,
                                [meal]: prev[meal] === 'bad' ? null : 'bad',
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              currentQuality === 'bad'
                                ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                                : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                            }`}
                          >
                            Bad
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-light text-text-secondary font-medium hover:bg-surface-lighter transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasAnyData}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                  hasAnyData
                    ? 'text-background hover:opacity-90'
                    : 'bg-surface-light text-text-muted cursor-not-allowed'
                }`}
                style={{ backgroundColor: hasAnyData ? BODY_COLOR : undefined }}
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
