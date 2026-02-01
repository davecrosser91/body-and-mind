/**
 * Custom Subcategory Single Item API
 *
 * GET /api/v1/subcategories/[id] - Get a single subcategory
 * PUT /api/v1/subcategories/[id] - Update a subcategory
 * DELETE /api/v1/subcategories/[id] - Delete a subcategory
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  successResponse,
  badRequestError,
  notFoundError,
  conflictError,
  internalError,
} from '@/lib/api-response';
import {
  getCustomSubcategoryById,
  updateCustomSubcategory,
  deleteCustomSubcategory,
  getActivitiesCount,
} from '@/lib/custom-subcategories';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/subcategories/[id]
 * Get a single custom subcategory
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { user } = authResult.context;

  try {
    const { id } = await context.params;

    if (!id) {
      return badRequestError('Subcategory ID is required');
    }

    const subcategory = await getCustomSubcategoryById(user.id, id);

    if (!subcategory) {
      return notFoundError('Subcategory not found');
    }

    // Also include activities count
    const activitiesCount = await getActivitiesCount(user.id, subcategory.pillar, subcategory.key);

    return successResponse({
      ...subcategory,
      activitiesCount,
    });
  } catch (error) {
    console.error('Subcategory fetch error:', error);
    return internalError('Failed to fetch subcategory');
  }
}

/**
 * PUT /api/v1/subcategories/[id]
 * Update a custom subcategory
 *
 * Request body:
 * - name: string (optional)
 * - color: string | null (optional)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { user } = authResult.context;

  try {
    const { id } = await context.params;

    if (!id) {
      return badRequestError('Subcategory ID is required');
    }

    let body: {
      name?: string;
      color?: string | null;
    };

    try {
      body = await request.json();
    } catch {
      return badRequestError('Invalid JSON in request body');
    }

    const result = await updateCustomSubcategory(user.id, id, {
      name: body.name,
      color: body.color,
    });

    if (!result.success) {
      if (result.error === 'Subcategory not found') {
        return notFoundError(result.error);
      }
      if (result.error.includes('already exists')) {
        return conflictError(result.error);
      }
      return badRequestError(result.error);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('Subcategory update error:', error);
    return internalError('Failed to update subcategory');
  }
}

/**
 * DELETE /api/v1/subcategories/[id]
 * Delete a custom subcategory
 *
 * Query params:
 * - reassignTo: string (optional) - subcategory key to reassign activities to
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response;
  }

  const { user } = authResult.context;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const reassignTo = searchParams.get('reassignTo');

    if (!id) {
      return badRequestError('Subcategory ID is required');
    }

    const result = await deleteCustomSubcategory(
      user.id,
      id,
      reassignTo || undefined
    );

    if (!result.success) {
      if (result.error === 'Subcategory not found') {
        return notFoundError(result.error);
      }
      return badRequestError(result.error);
    }

    return successResponse({
      message: 'Subcategory deleted successfully',
      activitiesAffected: result.activitiesAffected,
    });
  } catch (error) {
    console.error('Subcategory delete error:', error);
    return internalError('Failed to delete subcategory');
  }
}
