import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'
import {
  successResponse,
  unauthorizedError,
  validationError,
  internalError,
} from '@/lib/api-response'

// Validation schema for login request
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return validationError(
        'Validation failed',
        result.error.flatten().fieldErrors
      )
    }

    const { email, password } = result.data

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return unauthorizedError('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash)

    if (!isValidPassword) {
      return unauthorizedError('Invalid email or password')
    }

    // Generate JWT token
    const token = await generateToken(user.id, user.email)

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return internalError()
  }
}
