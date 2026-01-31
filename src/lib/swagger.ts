/**
 * OpenAPI/Swagger specification for the Routine Game API
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Routine Game API',
    description:
      'API for the Routine Game - a gamified habit-tracking application with Habitanimal companions',
    version: '1.0.0',
    contact: {
      name: 'Routine Game Support',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Habits',
      description: 'Habit management endpoints',
    },
    {
      name: 'Habitanimals',
      description: 'Habitanimal companion endpoints',
    },
    {
      name: 'Dashboard',
      description: 'Dashboard and statistics endpoints',
    },
    {
      name: 'Integrations',
      description: 'Third-party integration endpoints',
    },
    {
      name: 'Health',
      description: 'API health check endpoints',
    },
  ],
  paths: {
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
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                    timestamp: {
                      type: 'number',
                      example: 1704067200000,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SignupRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '409': {
            description: 'User already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticate a user and receive a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/habits': {
      get: {
        tags: ['Habits'],
        summary: 'List habits',
        description: 'Get all habits for the authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'habitanimalId',
            in: 'query',
            description: 'Filter by habitanimal ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'frequency',
            in: 'query',
            description: 'Filter by frequency',
            schema: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly'],
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1,
              minimum: 1,
            },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of habits',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitListResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Habits'],
        summary: 'Create habit',
        description: 'Create a new habit',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateHabitRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Habit created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/habits/{id}': {
      get: {
        tags: ['Habits'],
        summary: 'Get habit',
        description: 'Get a specific habit by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habit ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Habit details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habit not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Habits'],
        summary: 'Update habit',
        description: 'Update a habit',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habit ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateHabitRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Habit updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habit not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Habits'],
        summary: 'Delete habit',
        description: 'Delete a habit',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habit ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '204': {
            description: 'Habit deleted',
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habit not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/habits/{id}/complete': {
      post: {
        tags: ['Habits'],
        summary: 'Complete habit',
        description: 'Mark a habit as completed and earn XP',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habit ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '201': {
            description: 'Habit completed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitCompletionResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habit not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/habitanimals': {
      get: {
        tags: ['Habitanimals'],
        summary: 'List habitanimals',
        description: 'Get all habitanimals for the authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1,
              minimum: 1,
            },
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of habitanimals',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitanimalListResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Habitanimals'],
        summary: 'Create habitanimal',
        description: 'Create a new habitanimal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateHabitanimalRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Habitanimal created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitanimalResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/habitanimals/{id}': {
      get: {
        tags: ['Habitanimals'],
        summary: 'Get habitanimal',
        description: 'Get a specific habitanimal by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habitanimal ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Habitanimal details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitanimalResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habitanimal not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Habitanimals'],
        summary: 'Update habitanimal',
        description: 'Update a habitanimal',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habitanimal ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateHabitanimalRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Habitanimal updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitanimalResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habitanimal not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Habitanimals'],
        summary: 'Delete habitanimal',
        description: 'Delete a habitanimal and all associated habits',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habitanimal ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '204': {
            description: 'Habitanimal deleted',
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habitanimal not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/habitanimals/{id}/history': {
      get: {
        tags: ['Habitanimals'],
        summary: 'Get habitanimal history',
        description: 'Get detailed health and XP history for a habitanimal over time',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Habitanimal ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'days',
            in: 'query',
            description: 'Number of days of history to fetch',
            schema: {
              type: 'integer',
              default: 30,
              minimum: 1,
              maximum: 365,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Habitanimal history',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HabitanimalHistoryResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Habitanimal not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/habitanimals/recalculate-health': {
      post: {
        tags: ['Habitanimals'],
        summary: 'Recalculate habitanimal health',
        description: 'Recalculate health for all user habitanimals based on last interaction date',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Health recalculated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthRecalculationResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard data',
        description:
          'Get aggregated dashboard data including stats and recent activity',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DashboardResponse',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/integrations/whoop/connect': {
      post: {
        tags: ['Integrations'],
        summary: 'Connect WHOOP',
        description: 'Initialize WHOOP OAuth connection',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OAuth URL returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    data: {
                      type: 'object',
                      properties: {
                        authUrl: {
                          type: 'string',
                          format: 'uri',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/integrations/whoop/callback': {
      get: {
        tags: ['Integrations'],
        summary: 'WHOOP OAuth callback',
        description: 'Handle WHOOP OAuth callback',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            description: 'OAuth authorization code',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'state',
            in: 'query',
            required: true,
            description: 'OAuth state parameter',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '302': {
            description: 'Redirect to app after successful connection',
          },
          '400': {
            description: 'Invalid callback parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login or /auth/signup',
      },
    },
    schemas: {
      SignupRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            example: 'securePassword123',
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            example: 'John Doe',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'securePassword123',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User',
              },
              token: {
                type: 'string',
                description: 'JWT access token',
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          name: {
            type: 'string',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Invalid input data',
              },
              details: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
      CreateHabitRequest: {
        type: 'object',
        required: ['name', 'habitanimalId', 'frequency'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            example: 'Morning meditation',
          },
          description: {
            type: 'string',
            maxLength: 500,
            nullable: true,
            example: '10 minutes of mindfulness',
          },
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
            example: 'daily',
          },
          habitanimalId: {
            type: 'string',
            format: 'uuid',
          },
        },
      },
      UpdateHabitRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
          },
          description: {
            type: 'string',
            maxLength: 500,
            nullable: true,
          },
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
          },
        },
      },
      Habit: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
            nullable: true,
          },
          frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'monthly'],
          },
          habitanimalId: {
            type: 'string',
            format: 'uuid',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      HabitResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            $ref: '#/components/schemas/Habit',
          },
        },
      },
      HabitListResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Habit',
                },
              },
              pagination: {
                $ref: '#/components/schemas/Pagination',
              },
            },
          },
        },
      },
      HabitCompletionResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              completion: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid',
                  },
                  habitId: {
                    type: 'string',
                    format: 'uuid',
                  },
                  completedAt: {
                    type: 'string',
                    format: 'date-time',
                  },
                  xpEarned: {
                    type: 'integer',
                    example: 10,
                  },
                },
              },
              habitanimal: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid',
                  },
                  xp: {
                    type: 'integer',
                  },
                  level: {
                    type: 'integer',
                  },
                  health: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
      },
      CreateHabitanimalRequest: {
        type: 'object',
        required: ['name', 'species'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            example: 'Spark',
          },
          species: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            example: 'Phoenix',
          },
        },
      },
      UpdateHabitanimalRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
          },
        },
      },
      Habitanimal: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          species: {
            type: 'string',
          },
          health: {
            type: 'number',
            minimum: 0,
            maximum: 100,
          },
          xp: {
            type: 'integer',
            minimum: 0,
          },
          level: {
            type: 'integer',
            minimum: 1,
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      HabitanimalResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            $ref: '#/components/schemas/Habitanimal',
          },
        },
      },
      HabitanimalListResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Habitanimal',
                },
              },
              pagination: {
                $ref: '#/components/schemas/Pagination',
              },
            },
          },
        },
      },
      DashboardResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              stats: {
                type: 'object',
                properties: {
                  totalHabitanimals: {
                    type: 'integer',
                  },
                  totalHabits: {
                    type: 'integer',
                  },
                  completionsToday: {
                    type: 'integer',
                  },
                  currentStreak: {
                    type: 'integer',
                  },
                },
              },
              habitanimals: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Habitanimal',
                },
              },
              recentCompletions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                    },
                    habitId: {
                      type: 'string',
                    },
                    habitName: {
                      type: 'string',
                    },
                    completedAt: {
                      type: 'string',
                      format: 'date-time',
                    },
                    xpEarned: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1,
          },
          pageSize: {
            type: 'integer',
            example: 20,
          },
          totalCount: {
            type: 'integer',
            example: 100,
          },
          totalPages: {
            type: 'integer',
            example: 5,
          },
          hasNextPage: {
            type: 'boolean',
          },
          hasPreviousPage: {
            type: 'boolean',
          },
        },
      },
      HabitanimalHistoryResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              habitanimalId: {
                type: 'string',
                format: 'uuid',
              },
              period: {
                type: 'object',
                properties: {
                  start: {
                    type: 'string',
                    format: 'date',
                  },
                  end: {
                    type: 'string',
                    format: 'date',
                  },
                  days: {
                    type: 'integer',
                  },
                },
              },
              dailyHistory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: {
                      type: 'string',
                      format: 'date',
                    },
                    health: {
                      type: 'number',
                    },
                    xpEarned: {
                      type: 'integer',
                    },
                    completions: {
                      type: 'integer',
                    },
                  },
                },
              },
              levelMilestones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    level: {
                      type: 'integer',
                    },
                    date: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  totalXpEarned: {
                    type: 'integer',
                  },
                  totalCompletions: {
                    type: 'integer',
                  },
                  avgCompletionsPerDay: {
                    type: 'number',
                  },
                  avgHealth: {
                    type: 'number',
                  },
                  lowestHealth: {
                    type: 'number',
                  },
                  highestHealth: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
      },
      HealthRecalculationResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              recalculatedAt: {
                type: 'string',
                format: 'date-time',
              },
              habitanimals: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    type: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    health: {
                      type: 'number',
                    },
                    previousHealth: {
                      type: 'number',
                    },
                    healthChange: {
                      type: 'number',
                    },
                    mood: {
                      type: 'string',
                      enum: ['happy', 'neutral', 'tired', 'sad'],
                    },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total: {
                    type: 'integer',
                  },
                  healthDecayed: {
                    type: 'integer',
                  },
                  healthUnchanged: {
                    type: 'integer',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
