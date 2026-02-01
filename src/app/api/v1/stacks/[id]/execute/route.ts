/**
 * Stack Execution API
 *
 * POST /api/v1/stacks/[id]/execute - Execute a habit stack (complete all activities)
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  successResponse,
  notFoundError,
  conflictError,
  internalError,
} from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { completeStack } from '@/lib/habit-stacks';
import { Source } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/stacks/[id]/execute
 * Execute a habit stack - completes all activities in the stack
 *
 * This endpoint:
 * 1. Finds the stack and its activities
 * 2. Creates ActivityCompletion records for each activity (if not already completed today)
 * 3. Records the StackCompletion with bonus points
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

    // Find the stack
    const stack = await prisma.habitStack.findFirst({
      where: {
        id: stackId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!stack) {
      return notFoundError('Habit stack not found or not active');
    }

    if (stack.activityIds.length === 0) {
      return notFoundError('Stack has no activities');
    }

    // Get activities in the stack
    const activities = await prisma.activity.findMany({
      where: {
        id: { in: stack.activityIds },
        userId: user.id,
        archived: false,
      },
    });

    if (activities.length === 0) {
      return notFoundError('No valid activities found in stack');
    }

    // Check which activities are already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCompletions = await prisma.activityCompletion.findMany({
      where: {
        activityId: { in: activities.map((a) => a.id) },
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: { activityId: true },
    });

    const completedActivityIds = new Set(existingCompletions.map((c) => c.activityId));
    const activitiesToComplete = activities.filter((a) => !completedActivityIds.has(a.id));

    // Complete each activity that hasn't been completed today
    const completions = [];
    let totalPointsEarned = 0;

    for (const activity of activitiesToComplete) {
      const completion = await prisma.activityCompletion.create({
        data: {
          activityId: activity.id,
          pointsEarned: activity.points,
          details: `Completed as part of stack: ${stack.name}`,
          source: Source.MANUAL,
        },
      });

      completions.push({
        activityId: activity.id,
        activityName: activity.name,
        pointsEarned: activity.points,
        completionId: completion.id,
      });

      totalPointsEarned += activity.points;
    }

    // Mark the stack as completed and get bonus points
    const stackResult = await completeStack(user.id, stackId);

    if (!stackResult) {
      return conflictError('Failed to record stack completion');
    }

    // Calculate total including bonus
    const grandTotal = totalPointsEarned + stackResult.bonusPoints;

    return successResponse({
      message: 'Stack executed successfully',
      stack: {
        id: stack.id,
        name: stack.name,
      },
      completions: completions,
      alreadyCompletedToday: activities.length - activitiesToComplete.length,
      newlyCompleted: completions.length,
      pointsEarned: totalPointsEarned,
      bonusPoints: stackResult.bonusPoints,
      totalPoints: grandTotal,
      streakDay: stackResult.streakDay,
    });
  } catch (error) {
    console.error('Stack execution error:', error);
    return internalError('Failed to execute habit stack');
  }
}
