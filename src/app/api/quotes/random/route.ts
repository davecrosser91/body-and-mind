import { NextRequest, NextResponse } from 'next/server'
import { QuoteCategory } from '@prisma/client'
import { getRandomQuote } from '@/lib/quotes'
import { successResponse, badRequestError, internalError } from '@/lib/api-response'

/**
 * GET /api/quotes/random
 * Get a random quote, optionally filtered by category
 *
 * Query Parameters:
 * - category: Optional QuoteCategory to filter quotes
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     text: string,
 *     author: string | null,
 *     category: string
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryParam = searchParams.get('category')

    // Validate category if provided
    let category: QuoteCategory | undefined

    if (categoryParam) {
      const upperCategory = categoryParam.toUpperCase()
      if (!Object.values(QuoteCategory).includes(upperCategory as QuoteCategory)) {
        return badRequestError(
          `Invalid category. Must be one of: ${Object.values(QuoteCategory).join(', ')}`
        )
      }
      category = upperCategory as QuoteCategory
    }

    const quote = await getRandomQuote(category)

    return successResponse({
      text: quote.text,
      author: quote.author,
      category: quote.category,
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/random:', error)
    return internalError('Failed to fetch random quote')
  }
}
