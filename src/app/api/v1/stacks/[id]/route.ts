import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  successResponse,
  noContentResponse,
  notFoundError,
  badRequestError,
  internalError,
} from '@/lib/api-response';
import { getStackById, updateStack, deleteStack } from '@/lib/habit-stacks';
import { CueType } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Validate that a string is a valid CueType enum value
 */
function isValidCueType(value: string): value is CueType {
  return Object.values(CueType).includes(value as CueType);
}

/**
 * GET /api/v1/stacks/[id]
 * Returns a single habit stack by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { user } = authResult.context;

  try {
    const { id: stackId } = await context.params;

    if (!stackId || stackId.trim().length === 0) {
      return notFoundError('Invalid stack ID');
    }

    const stack = await getStackById(user.id, stackId);

    if (!stack) {
      return notFoundError('Habit stack not found');
    }

    return successResponse({
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
    console.error('Stack fetch error:', error);
    return internalError('Failed to fetch habit stack');
  }
}

/**
 * PUT /api/v1/stacks/[id]
 * Update an existing habit stack
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { user } = authResult.context;

  try {
    const { id: stackId } = await context.params;

    if (!stackId || stackId.trim().length === 0) {
      return notFoundError('Invalid stack ID');
    }

    const body = await request.json();

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return badRequestError('Name must be a non-empty string');
      }
    }

    // Validate activityIds if provided
    if (body.activityIds !== undefined) {
      if (!Array.isArray(body.activityIds)) {
        return badRequestError('activityIds must be an array');
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
    }

    // Validate cueType if provided (can be null to clear it)
    if (body.cueType !== undefined && body.cueType !== null) {
      if (typeof body.cueType !== 'string' || !isValidCueType(body.cueType)) {
        return badRequestError(
          `Invalid cueType. Must be one of: ${Object.values(CueType).join(', ')}`
        );
      }
    }

    // Validate cueValue based on cueType
    if (body.cueType !== undefined && body.cueType !== null) {
      if (body.cueType === CueType.TIME) {
        if (body.cueValue !== undefined && body.cueValue !== null) {
          if (typeof body.cueValue !== 'string') {
            return badRequestError('cueValue must be a string');
          }
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timeRegex.test(body.cueValue)) {
            return badRequestError('cueValue must be in HH:mm format for TIME cue type');
          }
        }
      } else if (body.cueType === CueType.LOCATION || body.cueType === CueType.AFTER_ACTIVITY) {
        if (body.cueValue !== undefined && body.cueValue !== null) {
          if (typeof body.cueValue !== 'string' || body.cueValue.trim().length === 0) {
            return badRequestError(`cueValue must be a non-empty string for ${body.cueType} cue type`);
          }
        }
      }
    }

    // Validate description if provided (can be null to clear it)
    if (body.description !== undefined && body.description !== null) {
      if (typeof body.description !== 'string') {
        return badRequestError('Description must be a string');
      }
    }

    // Validate isActive if provided
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      return badRequestError('isActive must be a boolean');
    }

    // Validate completionBonus if provided
    if (body.completionBonus !== undefined) {
      if (typeof body.completionBonus !== 'number' || body.completionBonus < 0 || body.completionBonus > 100) {
        return badRequestError('completionBonus must be a number between 0 and 100');
      }
    }

    // Build update input
    const updateInput: {
      name?: string;
      description?: string | null;
      activityIds?: string[];
      cueType?: CueType | null;
      cueValue?: string | null;
      isActive?: boolean;
      completionBonus?: number;
    } = {};

    if (body.name !== undefined) {
      updateInput.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateInput.description = body.description === null ? null : body.description.trim();
    }
    if (body.activityIds !== undefined) {
      updateInput.activityIds = body.activityIds;
    }
    if (body.cueType !== undefined) {
      updateInput.cueType = body.cueType as CueType | null;
    }
    if (body.cueValue !== undefined) {
      updateInput.cueValue = body.cueValue === null ? null : body.cueValue.trim();
    }
    if (body.isActive !== undefined) {
      updateInput.isActive = body.isActive;
    }
    if (body.completionBonus !== undefined) {
      updateInput.completionBonus = body.completionBonus;
    }

    // Update the stack
    const updatedStack = await updateStack(user.id, stackId, updateInput);

    if (!updatedStack) {
      return notFoundError('Habit stack not found');
    }

    return successResponse({
      stack: {
        id: updatedStack.id,
        name: updatedStack.name,
        description: updatedStack.description,
        activityIds: updatedStack.activityIds,
        activities: updatedStack.activities,
        cueType: updatedStack.cueType,
        cueValue: updatedStack.cueValue,
        isPreset: updatedStack.isPreset,
        presetKey: updatedStack.presetKey,
        isActive: updatedStack.isActive,
        completionBonus: updatedStack.completionBonus,
        currentStreak: updatedStack.currentStreak,
        createdAt: updatedStack.createdAt,
        updatedAt: updatedStack.updatedAt,
      },
    });
  } catch (error) {
    console.error('Stack update error:', error);
    if (error instanceof Error) {
      return badRequestError(error.message);
    }
    return internalError('Failed to update habit stack');
  }
}

/**
 * DELETE /api/v1/stacks/[id]
 * Delete a habit stack
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { user } = authResult.context;

  try {
    const { id: stackId } = await context.params;

    if (!stackId || stackId.trim().length === 0) {
      return notFoundError('Invalid stack ID');
    }

    const deleted = await deleteStack(user.id, stackId);

    if (!deleted) {
      return notFoundError('Habit stack not found');
    }

    return noContentResponse();
  } catch (error) {
    console.error('Stack delete error:', error);
    return internalError('Failed to delete habit stack');
  }
}
