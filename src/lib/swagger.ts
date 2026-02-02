/**
 * OpenAPI/Swagger specification for the Bodylessness API
 * Updated 2025 - Activities-based architecture
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Bodylessness API',
    description:
      'API for Bodylessness - a habit tracking app with Body & Mind pillars, activities, stacks, and Whoop integration',
    version: '2.0.0',
    contact: {
      name: 'Bodylessness Support',
    },
  },
  servers: [
    {
      url: 'https://habits.bodylessness.com/api/v1',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Activities', description: 'Activity management (habits and one-off activities)' },
    { name: 'Activity Logs', description: 'Activity completion logging' },
    { name: 'Stacks', description: 'Habit stacks (chained activities)' },
    { name: 'Streaks', description: 'Streak tracking' },
    { name: 'Daily Scores', description: 'Daily score history and analytics' },
    { name: 'Nutrition', description: 'Nutrition tracking' },
    { name: 'Training', description: 'Training templates and workouts' },
    { name: 'Journal', description: 'Journal entries' },
    { name: 'Whoop', description: 'Whoop integration' },
    { name: 'Health', description: 'API health check' },
  ],
  paths: {
    // ==================== Health ====================
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check if the API is running',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ==================== Auth ====================
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignupRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { description: 'Validation error' },
          '409': { description: 'User already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: 'Logout successful' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['Auth'],
        summary: 'Update profile',
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ==================== Activities ====================
    '/activities': {
      get: {
        tags: ['Activities'],
        summary: 'List all activities',
        description: 'Returns all non-archived activities for the authenticated user',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'pillar',
            in: 'query',
            description: 'Filter by pillar',
            schema: { type: 'string', enum: ['BODY', 'MIND'] },
          },
          {
            name: 'subCategory',
            in: 'query',
            description: 'Filter by subcategory (TRAINING, SLEEP, NUTRITION, MEDITATION, READING, LEARNING, JOURNALING)',
            schema: { type: 'string' },
          },
          {
            name: 'habitsOnly',
            in: 'query',
            description: 'Only return activities where isHabit=true',
            schema: { type: 'string', enum: ['true', 'false'] },
          },
        ],
        responses: {
          '200': {
            description: 'List of activities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Activity' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Activities'],
        summary: 'Create a new activity',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateActivityRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Activity created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActivityResponse' },
              },
            },
          },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/activities/{id}': {
      get: {
        tags: ['Activities'],
        summary: 'Get activity by ID',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Activity details' },
          '404': { description: 'Activity not found' },
        },
      },
      patch: {
        tags: ['Activities'],
        summary: 'Update activity',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateActivityRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Activity updated' },
          '404': { description: 'Activity not found' },
        },
      },
      delete: {
        tags: ['Activities'],
        summary: 'Archive activity',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Activity archived' },
          '404': { description: 'Activity not found' },
        },
      },
    },
    '/activities/{id}/complete': {
      post: {
        tags: ['Activities'],
        summary: 'Complete an activity with details',
        description: 'Log a detailed activity completion (for training, meditation, journaling, etc.)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompleteActivityRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Activity completed' },
          '404': { description: 'Activity not found' },
          '409': { description: 'Already completed today (for habits)' },
        },
      },
    },
    '/activities/{id}/trigger': {
      post: {
        tags: ['Activities'],
        summary: 'Manually trigger auto-completion',
        description: 'Manually trigger an activity that has auto-trigger configured',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '201': { description: 'Activity triggered' },
          '404': { description: 'Activity not found' },
        },
      },
    },

    // ==================== Activity Logs ====================
    '/activity-logs': {
      get: {
        tags: ['Activity Logs'],
        summary: 'Get activity completions for a date',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'date',
            in: 'query',
            description: 'Date in YYYY-MM-DD format (defaults to today)',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'pillar',
            in: 'query',
            schema: { type: 'string', enum: ['BODY', 'MIND'] },
          },
        ],
        responses: {
          '200': {
            description: 'List of activity completions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ActivityLog' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Activity Logs'],
        summary: 'Quick log an activity',
        description: 'Simple completion without additional details',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['activityId'],
                properties: {
                  activityId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Activity logged' },
          '404': { description: 'Activity not found' },
          '409': { description: 'Already completed today' },
        },
      },
    },

    // ==================== Stacks ====================
    '/stacks': {
      get: {
        tags: ['Stacks'],
        summary: 'List habit stacks',
        description: 'Returns all habit stacks for the authenticated user',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of stacks',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StacksResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Stacks'],
        summary: 'Create a habit stack',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateStackRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Stack created' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/stacks/{id}': {
      get: {
        tags: ['Stacks'],
        summary: 'Get stack by ID',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Stack details' },
          '404': { description: 'Stack not found' },
        },
      },
      patch: {
        tags: ['Stacks'],
        summary: 'Update stack',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Stack updated' },
        },
      },
      delete: {
        tags: ['Stacks'],
        summary: 'Delete stack',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Stack deleted' },
        },
      },
    },
    '/stacks/{id}/execute': {
      post: {
        tags: ['Stacks'],
        summary: 'Execute a habit stack',
        description: 'Complete all activities in a stack and earn bonus points',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Stack executed' },
          '404': { description: 'Stack not found' },
        },
      },
    },

    // ==================== Streaks ====================
    '/streaks': {
      get: {
        tags: ['Streaks'],
        summary: 'Get streak information',
        description: 'Returns streak data for OVERALL, BODY, and MIND pillars',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Streak data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StreaksResponse' },
              },
            },
          },
        },
      },
    },

    // ==================== Daily Scores ====================
    '/daily-scores': {
      get: {
        tags: ['Daily Scores'],
        summary: 'Get historical daily scores',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'days',
            in: 'query',
            description: 'Number of days to fetch (default: 7, max: 365)',
            schema: { type: 'integer', default: 7, maximum: 365 },
          },
          {
            name: 'startDate',
            in: 'query',
            description: 'Start date in YYYY-MM-DD format',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'endDate',
            in: 'query',
            description: 'End date in YYYY-MM-DD format',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Daily scores with summary',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DailyScoresResponse' },
              },
            },
          },
        },
      },
    },

    // ==================== Daily Status ====================
    '/daily-status': {
      get: {
        tags: ['Daily Scores'],
        summary: 'Get today\'s status',
        description: 'Returns current day progress, scores, and completion status',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: 'Daily status' },
        },
      },
    },

    // ==================== Nutrition ====================
    '/nutrition': {
      get: {
        tags: ['Nutrition'],
        summary: 'Get nutrition log for a date',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'date',
            in: 'query',
            description: 'Date in YYYY-MM-DD format (defaults to today)',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Nutrition data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NutritionResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Nutrition'],
        summary: 'Save nutrition log',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NutritionRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Nutrition saved' },
        },
      },
    },

    // ==================== Training ====================
    '/training/templates': {
      get: {
        tags: ['Training'],
        summary: 'List training templates',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of training templates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TrainingTemplate' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Training'],
        summary: 'Create training template',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTrainingTemplateRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Template created' },
        },
      },
    },
    '/training/templates/{id}': {
      get: {
        tags: ['Training'],
        summary: 'Get training template',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Template details' },
          '404': { description: 'Template not found' },
        },
      },
      patch: {
        tags: ['Training'],
        summary: 'Update training template',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Template updated' },
        },
      },
      delete: {
        tags: ['Training'],
        summary: 'Delete training template',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Template deleted' },
        },
      },
    },
    '/training/external-workouts': {
      get: {
        tags: ['Training'],
        summary: 'Get external workouts',
        description: 'Get workouts synced from Whoop that are not yet linked to activities',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: 'List of external workouts' },
        },
      },
    },
    '/training/link-external': {
      post: {
        tags: ['Training'],
        summary: 'Link external workout',
        description: 'Link a Whoop workout to a training activity',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['externalId', 'activityId'],
                properties: {
                  externalId: { type: 'string' },
                  activityId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Workout linked' },
        },
      },
    },

    // ==================== Journal ====================
    '/journal/entries': {
      get: {
        tags: ['Journal'],
        summary: 'Get journal entries',
        description: 'Returns paginated journal entries',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          {
            name: 'entryType',
            in: 'query',
            schema: { type: 'string', enum: ['GRATITUDE', 'REFLECTION', 'FREE_WRITE', 'GOALS', 'AFFIRMATION'] },
          },
          {
            name: 'mood',
            in: 'query',
            schema: { type: 'string', enum: ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'] },
          },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Paginated journal entries',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/JournalEntriesResponse' },
              },
            },
          },
        },
      },
    },
    '/journal/entries/{id}': {
      get: {
        tags: ['Journal'],
        summary: 'Get journal entry',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Journal entry details' },
          '404': { description: 'Entry not found' },
        },
      },
      patch: {
        tags: ['Journal'],
        summary: 'Update journal entry',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Entry updated' },
        },
      },
      delete: {
        tags: ['Journal'],
        summary: 'Delete journal entry',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Entry deleted' },
        },
      },
    },

    // ==================== Whoop Integration ====================
    '/integrations/whoop/connect': {
      get: {
        tags: ['Whoop'],
        summary: 'Start Whoop OAuth flow',
        description: 'Redirects to Whoop authorization page',
        security: [{ cookieAuth: [] }],
        responses: {
          '302': { description: 'Redirect to Whoop authorization' },
        },
      },
    },
    '/integrations/whoop': {
      get: {
        tags: ['Whoop'],
        summary: 'Get Whoop connection status',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Connection status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WhoopStatusResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Whoop'],
        summary: 'Disconnect Whoop',
        security: [{ cookieAuth: [] }],
        responses: {
          '204': { description: 'Disconnected' },
        },
      },
    },
    '/integrations/whoop/sync': {
      post: {
        tags: ['Whoop'],
        summary: 'Sync Whoop data',
        description: 'Manually trigger sync of recovery, sleep, and workout data from Whoop',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Sync completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WhoopSyncResponse' },
              },
            },
          },
        },
      },
    },
    '/integrations/whoop/callback': {
      get: {
        tags: ['Whoop'],
        summary: 'Whoop OAuth callback',
        description: 'Handles OAuth callback from Whoop (internal use)',
        parameters: [
          { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'state', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '302': { description: 'Redirect to app settings' },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
        description: 'Session cookie from /auth/login',
      },
    },
    schemas: {
      // ==================== Auth Schemas ====================
      SignupRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/User' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },

      // ==================== Activity Schemas ====================
      Activity: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          pillar: { type: 'string', enum: ['BODY', 'MIND'] },
          subCategory: { type: 'string' },
          frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'CUSTOM'] },
          description: { type: 'string', nullable: true },
          points: { type: 'integer' },
          isHabit: { type: 'boolean' },
          cueType: { type: 'string', enum: ['TIME', 'LOCATION', 'AFTER_ACTIVITY'], nullable: true },
          cueValue: { type: 'string', nullable: true },
          completedToday: { type: 'boolean' },
          autoTrigger: { $ref: '#/components/schemas/AutoTrigger' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AutoTrigger: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string' },
          triggerType: {
            type: 'string',
            enum: [
              'WHOOP_RECOVERY_ABOVE',
              'WHOOP_RECOVERY_BELOW',
              'WHOOP_SLEEP_ABOVE',
              'WHOOP_STRAIN_ABOVE',
              'WHOOP_WORKOUT_TYPE',
              'NUTRITION_PROTEIN_ABOVE',
              'NUTRITION_HEALTHY_MEALS',
              'ACTIVITY_COMPLETED',
            ],
          },
          thresholdValue: { type: 'number', nullable: true },
          workoutTypeId: { type: 'integer', nullable: true },
          triggerActivityId: { type: 'string', nullable: true },
          triggerActivityName: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
        },
      },
      CreateActivityRequest: {
        type: 'object',
        required: ['name', 'pillar', 'subCategory'],
        properties: {
          name: { type: 'string' },
          pillar: { type: 'string', enum: ['BODY', 'MIND'] },
          subCategory: { type: 'string' },
          points: { type: 'integer', default: 25 },
          isHabit: { type: 'boolean', default: false },
          description: { type: 'string' },
          frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'CUSTOM'], default: 'DAILY' },
          cueType: { type: 'string', enum: ['TIME', 'LOCATION', 'AFTER_ACTIVITY'] },
          cueValue: { type: 'string' },
          autoTrigger: {
            type: 'object',
            properties: {
              triggerType: { type: 'string' },
              thresholdValue: { type: 'number' },
              workoutTypeId: { type: 'integer' },
              triggerActivityId: { type: 'string' },
            },
          },
        },
      },
      UpdateActivityRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          points: { type: 'integer' },
          isHabit: { type: 'boolean' },
          cueType: { type: 'string', enum: ['TIME', 'LOCATION', 'AFTER_ACTIVITY'] },
          cueValue: { type: 'string' },
        },
      },
      ActivityResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { $ref: '#/components/schemas/Activity' },
        },
      },
      CompleteActivityRequest: {
        type: 'object',
        properties: {
          points: { type: 'integer', description: 'Override points earned' },
          details: { type: 'string', description: 'Notes about the completion' },
          meditationDetails: {
            type: 'object',
            properties: {
              durationMinutes: { type: 'integer' },
              technique: { type: 'string' },
              moodBefore: { type: 'string', enum: ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'] },
              moodAfter: { type: 'string', enum: ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'] },
            },
          },
          journalEntry: {
            type: 'object',
            properties: {
              entryType: { type: 'string', enum: ['GRATITUDE', 'REFLECTION', 'FREE_WRITE', 'GOALS', 'AFFIRMATION'] },
              mood: { type: 'string', enum: ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'] },
              content: { type: 'string' },
            },
          },
          trainingDetails: {
            type: 'object',
            properties: {
              workoutType: { type: 'string' },
              durationMinutes: { type: 'integer' },
              intensity: { type: 'string', enum: ['LOW', 'MODERATE', 'HIGH', 'MAX'] },
              muscleGroups: { type: 'array', items: { type: 'string' } },
              calories: { type: 'integer' },
              rpe: { type: 'integer', minimum: 1, maximum: 10 },
            },
          },
        },
      },

      // ==================== Activity Log Schemas ====================
      ActivityLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          activityId: { type: 'string' },
          activityName: { type: 'string' },
          pillar: { type: 'string' },
          subCategory: { type: 'string' },
          pointsEarned: { type: 'integer' },
          completedAt: { type: 'string', format: 'date-time' },
          details: { type: 'string', nullable: true },
          source: { type: 'string', enum: ['MANUAL', 'WHOOP', 'AUTO_TRIGGER'] },
          meditationDetails: { type: 'object', nullable: true },
          journalEntry: { type: 'object', nullable: true },
          trainingDetails: { type: 'object', nullable: true },
        },
      },

      // ==================== Stack Schemas ====================
      Stack: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          activityIds: { type: 'array', items: { type: 'string' } },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                points: { type: 'integer' },
              },
            },
          },
          cueType: { type: 'string', nullable: true },
          cueValue: { type: 'string', nullable: true },
          isPreset: { type: 'boolean' },
          presetKey: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          completionBonus: { type: 'integer' },
          currentStreak: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateStackRequest: {
        type: 'object',
        required: ['name', 'activityIds'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          activityIds: { type: 'array', items: { type: 'string' }, minItems: 2 },
          cueType: { type: 'string', enum: ['TIME', 'LOCATION', 'AFTER_ACTIVITY'] },
          cueValue: { type: 'string' },
          isActive: { type: 'boolean', default: true },
          completionBonus: { type: 'integer', default: 10, minimum: 0, maximum: 100 },
        },
      },
      StacksResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              stacks: { type: 'array', items: { $ref: '#/components/schemas/Stack' } },
              activeCount: { type: 'integer' },
              totalActivitiesInStacks: { type: 'integer' },
            },
          },
        },
      },

      // ==================== Streaks Schemas ====================
      StreakInfo: {
        type: 'object',
        properties: {
          current: { type: 'integer' },
          longest: { type: 'integer' },
          lastActiveDate: { type: 'string', format: 'date', nullable: true },
          atRisk: { type: 'boolean' },
          hoursRemaining: { type: 'number' },
        },
      },
      StreaksResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              overall: { $ref: '#/components/schemas/StreakInfo' },
              body: { $ref: '#/components/schemas/StreakInfo' },
              mind: { $ref: '#/components/schemas/StreakInfo' },
            },
          },
        },
      },

      // ==================== Daily Scores Schemas ====================
      DailyScore: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          bodyScore: { type: 'integer' },
          mindScore: { type: 'integer' },
          balanceIndex: { type: 'integer' },
          bodyPoints: { type: 'integer' },
          mindPoints: { type: 'integer' },
          bodyComplete: { type: 'boolean' },
          mindComplete: { type: 'boolean' },
          subScores: {
            type: 'object',
            properties: {
              training: { type: 'integer' },
              sleep: { type: 'integer' },
              nutrition: { type: 'integer' },
              meditation: { type: 'integer' },
              reading: { type: 'integer' },
              learning: { type: 'integer' },
            },
          },
          whoop: {
            type: 'object',
            nullable: true,
            properties: {
              strain: { type: 'number' },
              sleep: { type: 'number' },
              recovery: { type: 'number' },
            },
          },
        },
      },
      DailyScoresResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              scores: { type: 'array', items: { $ref: '#/components/schemas/DailyScore' } },
              summary: {
                type: 'object',
                properties: {
                  totalDays: { type: 'integer' },
                  daysWithData: { type: 'integer' },
                  averageBody: { type: 'integer' },
                  averageMind: { type: 'integer' },
                  averageBalance: { type: 'integer' },
                  perfectDays: { type: 'integer' },
                  bodyCompleteDays: { type: 'integer' },
                  mindCompleteDays: { type: 'integer' },
                },
              },
              dateRange: {
                type: 'object',
                properties: {
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
      },

      // ==================== Nutrition Schemas ====================
      NutritionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              date: { type: 'string', format: 'date' },
              proteinGrams: { type: 'integer' },
              mealQuality: {
                type: 'object',
                properties: {
                  breakfast: { type: 'string', enum: ['healthy', 'okay', 'bad'], nullable: true },
                  lunch: { type: 'string', enum: ['healthy', 'okay', 'bad'], nullable: true },
                  dinner: { type: 'string', enum: ['healthy', 'okay', 'bad'], nullable: true },
                },
              },
              hasData: { type: 'boolean' },
            },
          },
        },
      },
      NutritionRequest: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
          proteinGrams: { type: 'integer', minimum: 0, maximum: 500 },
          mealQuality: {
            type: 'object',
            properties: {
              breakfast: { type: 'string', enum: ['healthy', 'okay', 'bad'] },
              lunch: { type: 'string', enum: ['healthy', 'okay', 'bad'] },
              dinner: { type: 'string', enum: ['healthy', 'okay', 'bad'] },
            },
          },
        },
      },

      // ==================== Training Schemas ====================
      TrainingTemplate: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          points: { type: 'integer' },
          description: { type: 'string', nullable: true },
          cueType: { type: 'string', nullable: true },
          cueValue: { type: 'string', nullable: true },
          usageCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          trainingDefaults: {
            type: 'object',
            nullable: true,
            properties: {
              workoutType: { type: 'string' },
              durationMinutes: { type: 'integer' },
              intensity: { type: 'string', enum: ['LOW', 'MODERATE', 'HIGH', 'MAX'] },
              muscleGroups: { type: 'array', items: { type: 'string' } },
              location: { type: 'string', enum: ['HOME', 'GYM', 'OUTDOOR', 'OTHER'] },
              defaultExercises: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      CreateTrainingTemplateRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          points: { type: 'integer', default: 25 },
          description: { type: 'string' },
          cueType: { type: 'string', enum: ['TIME', 'LOCATION', 'AFTER_ACTIVITY'] },
          cueValue: { type: 'string' },
          trainingDefaults: {
            type: 'object',
            properties: {
              workoutType: { type: 'string' },
              durationMinutes: { type: 'integer' },
              intensity: { type: 'string' },
              muscleGroups: { type: 'array', items: { type: 'string' } },
              location: { type: 'string' },
              defaultExercises: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },

      // ==================== Journal Schemas ====================
      JournalEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          entryType: { type: 'string', enum: ['GRATITUDE', 'REFLECTION', 'FREE_WRITE', 'GOALS', 'AFFIRMATION'] },
          mood: { type: 'string', enum: ['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'] },
          content: { type: 'string' },
          wordCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          activityName: { type: 'string' },
        },
      },
      JournalEntriesResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              entries: { type: 'array', items: { $ref: '#/components/schemas/JournalEntry' } },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
      },

      // ==================== Whoop Schemas ====================
      WhoopStatusResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              connected: { type: 'boolean' },
              lastSync: { type: 'string', format: 'date-time', nullable: true },
              expiresAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
      },
      WhoopSyncResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              recovery: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  hrv: { type: 'number' },
                  restingHeartRate: { type: 'number' },
                },
              },
              sleep: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  hoursSlept: { type: 'number' },
                  efficiency: { type: 'number' },
                },
              },
              strain: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  calories: { type: 'number' },
                },
              },
              workouts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    sportId: { type: 'integer' },
                    sportName: { type: 'string' },
                    strain: { type: 'number' },
                    calories: { type: 'number' },
                    durationMinutes: { type: 'number' },
                  },
                },
              },
              triggeredActivities: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },

      // ==================== Error Schema ====================
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
}
