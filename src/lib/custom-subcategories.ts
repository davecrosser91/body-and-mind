/**
 * Custom Subcategories Service
 *
 * CRUD operations for user-defined subcategories
 */

import { prisma } from './db';
import { Pillar } from '@prisma/client';
import { isPredefined } from './subcategories';

export interface CustomSubcategoryInput {
  name: string;
  pillar: 'BODY' | 'MIND';
  color?: string | null;
}

export interface CustomSubcategoryUpdateInput {
  name?: string;
  color?: string | null;
}

export interface CustomSubcategory {
  id: string;
  userId: string;
  pillar: 'BODY' | 'MIND';
  name: string;
  key: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate a key from name (uppercase, spaces to underscores)
 */
function generateKey(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, '_');
}

/**
 * Validate hex color format
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Get all custom subcategories for a user
 */
export async function getCustomSubcategories(
  userId: string,
  pillar?: 'BODY' | 'MIND'
): Promise<CustomSubcategory[]> {
  const where: { userId: string; pillar?: Pillar } = { userId };
  if (pillar) {
    where.pillar = pillar as Pillar;
  }

  const subcategories = await prisma.customSubcategory.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  return subcategories.map((s) => ({
    id: s.id,
    userId: s.userId,
    pillar: s.pillar as 'BODY' | 'MIND',
    name: s.name,
    key: s.key,
    color: s.color,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

/**
 * Get a single custom subcategory by ID
 */
export async function getCustomSubcategoryById(
  userId: string,
  id: string
): Promise<CustomSubcategory | null> {
  const subcategory = await prisma.customSubcategory.findFirst({
    where: { id, userId },
  });

  if (!subcategory) return null;

  return {
    id: subcategory.id,
    userId: subcategory.userId,
    pillar: subcategory.pillar as 'BODY' | 'MIND',
    name: subcategory.name,
    key: subcategory.key,
    color: subcategory.color,
    createdAt: subcategory.createdAt,
    updatedAt: subcategory.updatedAt,
  };
}

/**
 * Create a new custom subcategory
 */
export async function createCustomSubcategory(
  userId: string,
  input: CustomSubcategoryInput
): Promise<{ success: true; data: CustomSubcategory } | { success: false; error: string }> {
  const { name, pillar, color } = input;

  // Validate name
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Name is required' };
  }

  const key = generateKey(name);

  // Check if it's a predefined subcategory name
  if (isPredefined(key)) {
    return { success: false, error: 'Cannot use a predefined subcategory name' };
  }

  // Validate color if provided
  if (color && !isValidHexColor(color)) {
    return { success: false, error: 'Invalid color format. Use hex format (e.g., #FF5733)' };
  }

  // Check for duplicate
  const existing = await prisma.customSubcategory.findFirst({
    where: { userId, pillar: pillar as Pillar, key },
  });

  if (existing) {
    return { success: false, error: 'A subcategory with this name already exists' };
  }

  // Create
  const subcategory = await prisma.customSubcategory.create({
    data: {
      userId,
      pillar: pillar as Pillar,
      name: name.trim(),
      key,
      color: color || null,
    },
  });

  return {
    success: true,
    data: {
      id: subcategory.id,
      userId: subcategory.userId,
      pillar: subcategory.pillar as 'BODY' | 'MIND',
      name: subcategory.name,
      key: subcategory.key,
      color: subcategory.color,
      createdAt: subcategory.createdAt,
      updatedAt: subcategory.updatedAt,
    },
  };
}

/**
 * Update a custom subcategory
 */
export async function updateCustomSubcategory(
  userId: string,
  id: string,
  input: CustomSubcategoryUpdateInput
): Promise<{ success: true; data: CustomSubcategory } | { success: false; error: string }> {
  // Find existing
  const existing = await prisma.customSubcategory.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { success: false, error: 'Subcategory not found' };
  }

  const updateData: { name?: string; key?: string; color?: string | null } = {};

  // Handle name update
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      return { success: false, error: 'Name cannot be empty' };
    }

    const newKey = generateKey(input.name);

    // Check if it's a predefined subcategory name
    if (isPredefined(newKey)) {
      return { success: false, error: 'Cannot use a predefined subcategory name' };
    }

    // Check for duplicate (only if key changed)
    if (newKey !== existing.key) {
      const duplicate = await prisma.customSubcategory.findFirst({
        where: { userId, pillar: existing.pillar, key: newKey },
      });

      if (duplicate) {
        return { success: false, error: 'A subcategory with this name already exists' };
      }

      // Update activities with old key to new key
      await prisma.activity.updateMany({
        where: { userId, pillar: existing.pillar, subCategory: existing.key },
        data: { subCategory: newKey },
      });
    }

    updateData.name = input.name.trim();
    updateData.key = newKey;
  }

  // Handle color update
  if (input.color !== undefined) {
    if (input.color !== null && !isValidHexColor(input.color)) {
      return { success: false, error: 'Invalid color format. Use hex format (e.g., #FF5733)' };
    }
    updateData.color = input.color;
  }

  // Update
  const updated = await prisma.customSubcategory.update({
    where: { id },
    data: updateData,
  });

  return {
    success: true,
    data: {
      id: updated.id,
      userId: updated.userId,
      pillar: updated.pillar as 'BODY' | 'MIND',
      name: updated.name,
      key: updated.key,
      color: updated.color,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  };
}

/**
 * Delete a custom subcategory
 */
export async function deleteCustomSubcategory(
  userId: string,
  id: string,
  reassignTo?: string
): Promise<{ success: true; activitiesAffected: number } | { success: false; error: string }> {
  // Find existing
  const existing = await prisma.customSubcategory.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return { success: false, error: 'Subcategory not found' };
  }

  // Count activities using this subcategory
  const activitiesCount = await prisma.activity.count({
    where: { userId, pillar: existing.pillar, subCategory: existing.key },
  });

  // If activities exist and no reassignment target, return error
  if (activitiesCount > 0 && !reassignTo) {
    return {
      success: false,
      error: `Cannot delete: ${activitiesCount} activities use this subcategory. Provide a reassignTo parameter.`,
    };
  }

  // Reassign activities if needed
  if (activitiesCount > 0 && reassignTo) {
    await prisma.activity.updateMany({
      where: { userId, pillar: existing.pillar, subCategory: existing.key },
      data: { subCategory: reassignTo.toUpperCase() },
    });
  }

  // Delete
  await prisma.customSubcategory.delete({
    where: { id },
  });

  return { success: true, activitiesAffected: activitiesCount };
}

/**
 * Get count of activities using a subcategory
 */
export async function getActivitiesCount(
  userId: string,
  pillar: 'BODY' | 'MIND',
  key: string
): Promise<number> {
  return prisma.activity.count({
    where: { userId, pillar: pillar as Pillar, subCategory: key.toUpperCase(), archived: false },
  });
}
