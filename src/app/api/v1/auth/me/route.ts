import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/auth-middleware'
import { comparePassword, hashPassword } from '@/lib/auth'
import {
  successResponse,
  validationError,
  unauthorizedError,
  internalError,
} from '@/lib/api-response'

// Validation schema for profile update
const updateProfileSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      )
      .optional(),
  })
  .refine(
    (data) => {
      // If newPassword is provided, currentPassword must also be provided
      if (data.newPassword && !data.currentPassword) {
        return false
      }
      return true
    },
    {
      message: 'Current password is required when changing password',
      path: ['currentPassword'],
    }
  )

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await withAuth(request)

    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult.context

    // Fetch full user profile with habitanimal count
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            habitanimals: true,
          },
        },
      },
    })

    if (!userProfile) {
      return unauthorizedError('User not found')
    }

    return successResponse({
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      createdAt: userProfile.createdAt,
      habitanimalCount: userProfile._count.habitanimals,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return internalError()
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await withAuth(request)

    if (!authResult.success) {
      return authResult.response
    }

    const { user } = authResult.context

    const body = await request.json()

    // Validate request body
    const result = updateProfileSchema.safeParse(body)
    if (!result.success) {
      return validationError(
        'Validation failed',
        result.error.flatten().fieldErrors
      )
    }

    const { name, currentPassword, newPassword } = result.data

    // Build update data
    const updateData: { name?: string; passwordHash?: string } = {}

    if (name !== undefined) {
      updateData.name = name
    }

    // Handle password change
    if (newPassword && currentPassword) {
      // Fetch user with password hash
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      })

      if (!userWithPassword) {
        return unauthorizedError('User not found')
      }

      // Verify current password
      const isValidPassword = await comparePassword(
        currentPassword,
        userWithPassword.passwordHash
      )

      if (!isValidPassword) {
        return unauthorizedError('Current password is incorrect')
      }

      // Hash new password
      updateData.passwordHash = await hashPassword(newPassword)
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return validationError('No valid fields to update')
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            habitanimals: true,
          },
        },
      },
      data: updateData,
    })

    return successResponse({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      createdAt: updatedUser.createdAt,
      habitanimalCount: updatedUser._count.habitanimals,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return internalError()
  }
}
