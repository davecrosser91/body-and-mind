/**
 * Custom Subcategories API
 *
 * GET /api/v1/subcategories - List custom subcategories
 * POST /api/v1/subcategories - Create a new custom subcategory
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import {
  successResponse,
  createdResponse,
  badRequestError,
  conflictError,
  internalError,
} from '@/lib/api-response';
import {
  getCustomSubcategories,
  createCustomSubcategory,
} from '@/lib/custom-subcategories';
import { Pillar } from '@prisma/client';

/**
 * GET /api/v1/subcategories
 * Returns custom subcategories for the authenticated user
 *
 * Query params:
 * - pillar: 'BODY' | 'MIND' (optional filter)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const pillarParam = searchParams.get('pillar');

    // Validate pillar if provided
    let pillar: 'BODY' | 'MIND' | undefined;
    if (pillarParam) {
      if (!['BODY', 'MIND'].includes(pillarParam)) {
        return badRequestError('Invalid pillar. Must be BODY or MIND');
      }
      pillar = pillarParam as 'BODY' | 'MIND';
    }

    const subcategories = await getCustomSubcategories(user.id, pillar);

    return successResponse({ subcategories });
  } catch (error) {
    console.error('Subcategories fetch error:', error);
    return internalError('Failed to fetch subcategories');
  }
});

/**
 * POST /api/v1/subcategories
 * Create a new custom subcategory
 *
 * Request body:
 * - name: string (required)
 * - pillar: 'BODY' | 'MIND' (required)
 * - color: string (optional, hex format)
 */
export const POST = requireAuth(async (request: NextRequest, { user }) => {
  try {
    let body: {
      name?: string;
      pillar?: string;
      color?: string;
    };

    try {
      body = await request.json();
    } catch {
      return badRequestError('Invalid JSON in request body');
    }

    const { name, pillar, color } = body;

    // Validate required fields
    if (!name) {
      return badRequestError('name is required');
    }

    if (!pillar) {
      return badRequestError('pillar is required');
    }

    if (!['BODY', 'MIND'].includes(pillar)) {
      return badRequestError('pillar must be BODY or MIND');
    }

    const result = await createCustomSubcategory(user.id, {
      name,
      pillar: pillar as 'BODY' | 'MIND',
      color: color || null,
    });

    if (!result.success) {
      if (result.error.includes('already exists')) {
        return conflictError(result.error);
      }
      return badRequestError(result.error);
    }

    return createdResponse(result.data);
  } catch (error) {
    console.error('Subcategory creation error:', error);
    return internalError('Failed to create subcategory');
  }
});
