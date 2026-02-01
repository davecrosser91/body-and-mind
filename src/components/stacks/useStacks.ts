'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityInStack {
  id: string;
  name: string;
  pillar: 'BODY' | 'MIND';
  subCategory: string;
  points: number;
}

// Legacy alias
export type HabitInStack = ActivityInStack;

export interface Stack {
  id: string;
  name: string;
  description: string | null;
  activityIds: string[];
  activities: ActivityInStack[];
  isActive: boolean;
  isPreset: boolean;
  cueType: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' | null;
  cueValue: string | null;
  completionBonus: number;
  currentStreak: number;
  createdAt: string;
  updatedAt: string;
}

interface UseStacksReturn {
  stacks: Stack[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createStack: (data: CreateStackData) => Promise<Stack | null>;
  updateStack: (id: string, data: UpdateStackData) => Promise<Stack | null>;
  deleteStack: (id: string) => Promise<boolean>;
  toggleStack: (id: string) => Promise<boolean>;
}

interface CreateStackData {
  name: string;
  description?: string;
  activityIds: string[];
  cueType?: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' | null;
  cueValue?: string | null;
  completionBonus?: number;
}

interface UpdateStackData {
  name?: string;
  description?: string;
  activityIds?: string[];
  isActive?: boolean;
  cueType?: 'TIME' | 'LOCATION' | 'AFTER_ACTIVITY' | null;
  cueValue?: string | null;
  completionBonus?: number;
}

export function useStacks(): UseStacksReturn {
  const { token } = useAuth();
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStacks = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/stacks', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stacks');
      }

      const data = await response.json();
      setStacks(data.data?.stacks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stacks');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStacks();
  }, [fetchStacks]);

  const createStack = async (data: CreateStackData): Promise<Stack | null> => {
    if (!token) return null;

    try {
      const response = await fetch('/api/v1/stacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to create stack');
      }

      const result = await response.json();
      const newStack = result.data?.stack;

      if (newStack) {
        setStacks(prev => [...prev, newStack]);
      }

      return newStack;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stack');
      return null;
    }
  };

  const updateStack = async (id: string, data: UpdateStackData): Promise<Stack | null> => {
    if (!token) return null;

    try {
      const response = await fetch(`/api/v1/stacks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to update stack');
      }

      const result = await response.json();
      const updatedStack = result.data?.stack;

      if (updatedStack) {
        setStacks(prev => prev.map(s => s.id === id ? updatedStack : s));
      }

      return updatedStack;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stack');
      return null;
    }
  };

  const deleteStack = async (id: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/v1/stacks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete stack');
      }

      setStacks(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stack');
      return false;
    }
  };

  const toggleStack = async (id: string): Promise<boolean> => {
    const stack = stacks.find(s => s.id === id);
    if (!stack) return false;

    const updated = await updateStack(id, { isActive: !stack.isActive });
    return updated !== null;
  };

  return {
    stacks,
    isLoading,
    error,
    refetch: fetchStacks,
    createStack,
    updateStack,
    deleteStack,
    toggleStack,
  };
}

// Hook to fetch user's activities for stack creation
export function useActivitiesForStacks() {
  const { token } = useAuth();
  const [activities, setActivities] = useState<ActivityInStack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/v1/activities?habitsOnly=true', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const activitiesData = data.data || [];
          setActivities(activitiesData.map((a: { id: string; name: string; pillar: string; subCategory: string; points: number }) => ({
            id: a.id,
            name: a.name,
            pillar: a.pillar as 'BODY' | 'MIND',
            subCategory: a.subCategory,
            points: a.points,
          })));
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [token]);

  return { activities, isLoading };
}

// Legacy alias
export const useHabitsForStacks = useActivitiesForStacks;
