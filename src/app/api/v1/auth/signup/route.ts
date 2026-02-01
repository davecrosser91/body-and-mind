import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { HabitanimalType } from '@prisma/client'
import {
  createdResponse,
  validationError,
  conflictError,
  internalError,
} from '@/lib/api-response'

// Validation schema for signup request
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(1, 'Name is required').optional(),
})

// Default Habitanimals to create for new users
const DEFAULT_HABITANIMALS = [
  {
    type: HabitanimalType.FITNESS,
    species: 'gorilla',
    name: 'Guiro',
  },
  {
    type: HabitanimalType.MINDFULNESS,
    species: 'turtle',
    name: 'Zen',
  },
  {
    type: HabitanimalType.NUTRITION,
    species: 'ox',
    name: 'Greeny',
  },
  {
    type: HabitanimalType.SLEEP,
    species: 'sloth',
    name: 'Milo',
  },
  {
    type: HabitanimalType.LEARNING,
    species: 'fox',
    name: 'Finn',
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const result = signupSchema.safeParse(body)
    if (!result.success) {
      return validationError(
        'Validation failed',
        result.error.flatten().fieldErrors
      )
    }

    const { email, password, name } = result.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return conflictError('Email already registered')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user with default Habitanimals in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
        },
      })

      // Create default Habitanimals
      await tx.habitanimal.createMany({
        data: DEFAULT_HABITANIMALS.map((habitanimal) => ({
          ...habitanimal,
          userId: newUser.id,
        })),
      })

      return newUser
    })

    // Generate JWT token
    const token = await generateToken(user.id, user.email)

    return createdResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return internalError()
  }
}
