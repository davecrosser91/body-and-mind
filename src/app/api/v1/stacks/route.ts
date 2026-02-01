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
} from '@/lib/habit-stacks';
import { CueType } from '@prisma/client';

/**
 * Validate that a string is a valid CueType enum value
 */
function isValidCueType(value: string): value is CueType {
  return Object.values(CueType).includes(value as CueType);
}

/**
 * GET /api/v1/stacks
 * Returns all habit stacks for the authenticated user
 */
export const GET = requireAuth(async (_request: NextRequest, { user }) => {
  try {
    const stacks = await getStacks(user.id);

    // Format response
    const formattedStacks = stacks.map((stack) => ({
      id: stack.id,
      name: stack.name,
      description: stack.description,
      activityIds: stack.activityIds,
      activities: stack.activities,
      cueType: stack.cueType,
      cueValue: stack.cueValue,
      isPreset: stack.isPreset,
      presetKey: stack.presetKey,
      isActive: stack.isActive,
      completionBonus: stack.completionBonus,
      currentStreak: stack.currentStreak,
      createdAt: stack.createdAt,
      updatedAt: stack.updatedAt,
    }));

    return successResponse({
      stacks: formattedStacks,
      activeCount: formattedStacks.filter((s) => s.isActive).length,
      totalActivitiesInStacks: formattedStacks.reduce((sum, s) => sum + s.activities.length, 0),
    });
  } catch (error) {
    console.error('Stacks fetch error:', error);
    return internalError('Failed to fetch habit stacks');
  }
});

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

    if (!body.activityIds || !Array.isArray(body.activityIds)) {
      return badRequestError('activityIds must be an array of activity IDs');
    }

    if (body.activityIds.length < 2) {
      return badRequestError('A habit stack must have at least 2 activities');
    }

    // Validate all activityIds are strings
    for (const activityId of body.activityIds) {
      if (typeof activityId !== 'string') {
        return badRequestError('All activityIds must be strings');
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

    // Validate completionBonus if provided
    if (body.completionBonus !== undefined) {
      if (typeof body.completionBonus !== 'number' || body.completionBonus < 0 || body.completionBonus > 100) {
        return badRequestError('completionBonus must be a number between 0 and 100');
      }
    }

    // Create the stack
    const stack = await createStack(user.id, {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      activityIds: body.activityIds,
      cueType: body.cueType as CueType | undefined,
      cueValue: body.cueValue?.trim() || undefined,
      isActive: body.isActive,
      completionBonus: body.completionBonus,
    });

    return createdResponse({
      stack: {
        id: stack.id,
        name: stack.name,
        description: stack.description,
        activityIds: stack.activityIds,
        activities: stack.activities,
        cueType: stack.cueType,
        cueValue: stack.cueValue,
        isPreset: stack.isPreset,
        presetKey: stack.presetKey,
        isActive: stack.isActive,
        completionBonus: stack.completionBonus,
        currentStreak: stack.currentStreak,
        createdAt: stack.createdAt,
        updatedAt: stack.updatedAt,
      },
    });
  } catch (error) {
    console.error('Stack creation error:', error);
    if (error instanceof Error) {
      return badRequestError(error.message);
    }
    return internalError('Failed to create habit stack');
  }
});
