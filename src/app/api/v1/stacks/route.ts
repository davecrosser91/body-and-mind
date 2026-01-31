import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import {
  successResponse,
  createdResponse,
  badRequestError,
  internalError,
} from '@/lib/api-response';
import {
  getStacks,
  createStack,
  initializePresetStacks,
  hasStacks,
  PRESET_STACKS,
} from '@/lib/habit-stacks';
import { CueType, SubCategory } from '@prisma/client';

/**
 * GET /api/v1/stacks
 * Returns all habit stacks for the authenticated user
 * Initializes preset stacks if the user has none
 */
export const GET = requireAuth(async (_request: NextRequest, { user }) => {
  try {
    // Check if user has any stacks, initialize presets if not
    const userHasStacks = await hasStacks(user.id);

    if (!userHasStacks) {
      await initializePresetStacks(user.id);
    }

    const stacks = await getStacks(user.id);

    // Format response with additional metadata
    const formattedStacks = stacks.map((stack) => ({
      id: stack.id,
      name: stack.name,
      description: stack.description,
      activities: stack.activities,
      cueType: stack.cueType,
      cueValue: stack.cueValue,
      isPreset: stack.isPreset,
      presetKey: stack.presetKey,
      isActive: stack.isActive,
      createdAt: stack.createdAt,
      updatedAt: stack.updatedAt,
    }));

    return successResponse({
      stacks: formattedStacks,
      presetCount: formattedStacks.filter((s) => s.isPreset).length,
      customCount: formattedStacks.filter((s) => !s.isPreset).length,
      activeCount: formattedStacks.filter((s) => s.isActive).length,
    });
  } catch (error) {
    console.error('Stacks fetch error:', error);
    return internalError('Failed to fetch habit stacks');
  }
});

/**
 * Validate that a string is a valid SubCategory enum value
 */
function isValidSubCategory(value: string): value is SubCategory {
  return Object.values(SubCategory).includes(value as SubCategory);
}

/**
 * Validate that a string is a valid CueType enum value
 */
function isValidCueType(value: string): value is CueType {
  return Object.values(CueType).includes(value as CueType);
}

/**
 * POST /api/v1/stacks
 * Create a new habit stack
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return badRequestError('Name is required and must be a non-empty string');
    }

    if (!body.activities || !Array.isArray(body.activities)) {
      return badRequestError('Activities must be an array');
    }

    if (body.activities.length < 2) {
      return badRequestError('A habit stack must have at least 2 activities');
    }

    // Validate all activities are valid SubCategory values
    for (const activity of body.activities) {
      if (typeof activity !== 'string' || !isValidSubCategory(activity)) {
        return badRequestError(
          `Invalid activity: ${activity}. Must be one of: ${Object.values(SubCategory).join(', ')}`
        );
      }
    }

    // Validate cueType if provided
    if (body.cueType !== undefined && body.cueType !== null) {
      if (typeof body.cueType !== 'string' || !isValidCueType(body.cueType)) {
        return badRequestError(
          `Invalid cueType. Must be one of: ${Object.values(CueType).join(', ')}`
        );
      }

      // Validate cueValue based on cueType
      if (body.cueType === CueType.TIME) {
        if (!body.cueValue || typeof body.cueValue !== 'string') {
          return badRequestError('cueValue is required when cueType is TIME');
        }
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(body.cueValue)) {
          return badRequestError('cueValue must be in HH:mm format for TIME cue type');
        }
      } else if (body.cueType === CueType.LOCATION || body.cueType === CueType.AFTER_ACTIVITY) {
        if (!body.cueValue || typeof body.cueValue !== 'string' || body.cueValue.trim().length === 0) {
          return badRequestError(`cueValue is required when cueType is ${body.cueType}`);
        }
      }
    }

    // Validate description if provided
    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== 'string') {
        return badRequestError('Description must be a string');
      }
    }

    // Validate isActive if provided
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      return badRequestError('isActive must be a boolean');
    }

    // Create the stack
    const stack = await createStack(user.id, {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      activities: body.activities as SubCategory[],
      cueType: body.cueType as CueType | undefined,
      cueValue: body.cueValue?.trim() || undefined,
      isActive: body.isActive,
    });

    return createdResponse({
      id: stack.id,
      name: stack.name,
      description: stack.description,
      activities: stack.activities,
      cueType: stack.cueType,
      cueValue: stack.cueValue,
      isPreset: stack.isPreset,
      presetKey: stack.presetKey,
      isActive: stack.isActive,
      createdAt: stack.createdAt,
      updatedAt: stack.updatedAt,
    });
  } catch (error) {
    console.error('Stack creation error:', error);
    if (error instanceof Error) {
      return badRequestError(error.message);
    }
    return internalError('Failed to create habit stack');
  }
});
