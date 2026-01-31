import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import {
  successResponse,
  validationError,
  internalError,
  badRequestError,
} from '@/lib/api-response';
import {
  getWeights,
  setWeights,
  SetWeightsOptions,
  WeightConfiguration,
} from '@/lib/weights';
import { WeightPreset } from '@prisma/client';

/**
 * GET /api/v1/weights
 *
 * Returns the current weight configuration for the authenticated user.
 * If no configuration exists, returns the default BALANCED preset.
 *
 * @returns {Object} response
 * @returns {boolean} response.success - Always true on success
 * @returns {WeightConfiguration} response.data - Weight configuration
 *
 * @example Response
 * {
 *   "success": true,
 *   "data": {
 *     "preset": "BALANCED",
 *     "body": {
 *       "training": 35,
 *       "sleep": 35,
 *       "nutrition": 30
 *     },
 *     "mind": {
 *       "meditation": 40,
 *       "reading": 30,
 *       "learning": 30
 *     }
 *   }
 * }
 */
export const GET = requireAuth(async (_request: NextRequest, { user }) => {
  try {
    const weights: WeightConfiguration = await getWeights(user.id);
    return successResponse(weights);
  } catch (error) {
    console.error('Weights fetch error:', error);
    return internalError('Failed to fetch weight configuration');
  }
});

// Valid presets for type validation
const VALID_PRESETS: WeightPreset[] = [
  'BALANCED',
  'ATHLETE',
  'RECOVERY',
  'KNOWLEDGE',
  'CUSTOM',
];

/**
 * PUT /api/v1/weights
 *
 * Updates the weight configuration for the authenticated user.
 *
 * - If preset is BALANCED, ATHLETE, RECOVERY, or KNOWLEDGE, uses predefined weights
 * - If preset is CUSTOM, requires body and mind weights to be provided
 * - Body weights (training, sleep, nutrition) must sum to 100
 * - Mind weights (meditation, reading, learning) must sum to 100
 *
 * @body {Object} request body
 * @body {string} preset - One of: BALANCED, ATHLETE, RECOVERY, KNOWLEDGE, CUSTOM
 * @body {Object} [body] - Body weights (required for CUSTOM preset)
 * @body {number} body.training - Training weight
 * @body {number} body.sleep - Sleep weight
 * @body {number} body.nutrition - Nutrition weight
 * @body {Object} [mind] - Mind weights (required for CUSTOM preset)
 * @body {number} mind.meditation - Meditation weight
 * @body {number} mind.reading - Reading weight
 * @body {number} mind.learning - Learning weight
 *
 * @returns {Object} response
 * @returns {boolean} response.success - true on success
 * @returns {WeightConfiguration} response.data - Updated weight configuration
 *
 * @example Request (preset)
 * PUT /api/v1/weights
 * {
 *   "preset": "ATHLETE"
 * }
 *
 * @example Request (custom)
 * PUT /api/v1/weights
 * {
 *   "preset": "CUSTOM",
 *   "body": {
 *     "training": 40,
 *     "sleep": 40,
 *     "nutrition": 20
 *   },
 *   "mind": {
 *     "meditation": 50,
 *     "reading": 25,
 *     "learning": 25
 *   }
 * }
 *
 * @example Response
 * {
 *   "success": true,
 *   "data": {
 *     "preset": "ATHLETE",
 *     "body": {
 *       "training": 50,
 *       "sleep": 35,
 *       "nutrition": 15
 *     },
 *     "mind": {
 *       "meditation": 50,
 *       "reading": 25,
 *       "learning": 25
 *     }
 *   }
 * }
 */
export const PUT = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();

    // Validate preset is provided
    if (!body.preset) {
      return badRequestError('Preset is required');
    }

    // Validate preset is valid
    if (!VALID_PRESETS.includes(body.preset)) {
      return badRequestError(
        `Invalid preset. Must be one of: ${VALID_PRESETS.join(', ')}`
      );
    }

    // Prepare options
    const options: SetWeightsOptions = {
      preset: body.preset as WeightPreset,
    };

    // Add body weights if provided
    if (body.body) {
      if (
        typeof body.body.training !== 'number' ||
        typeof body.body.sleep !== 'number' ||
        typeof body.body.nutrition !== 'number'
      ) {
        return badRequestError(
          'Body weights must include numeric training, sleep, and nutrition values'
        );
      }
      options.body = {
        training: body.body.training,
        sleep: body.body.sleep,
        nutrition: body.body.nutrition,
      };
    }

    // Add mind weights if provided
    if (body.mind) {
      if (
        typeof body.mind.meditation !== 'number' ||
        typeof body.mind.reading !== 'number' ||
        typeof body.mind.learning !== 'number'
      ) {
        return badRequestError(
          'Mind weights must include numeric meditation, reading, and learning values'
        );
      }
      options.mind = {
        meditation: body.mind.meditation,
        reading: body.mind.reading,
        learning: body.mind.learning,
      };
    }

    // Set weights
    const result = await setWeights(user.id, options);

    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const error of result.errors) {
        const field = error.field;
        if (!details[field]) {
          details[field] = [];
        }
        details[field]!.push(error.message);
      }
      return validationError('Invalid weight configuration', details);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error('Weights update error:', error);
    return internalError('Failed to update weight configuration');
  }
});
