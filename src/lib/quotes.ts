import { prisma } from './db'
import { QuoteCategory } from '@prisma/client'

export interface QuoteResult {
  text: string
  author: string | null
}

export interface QuoteWithCategory extends QuoteResult {
  category: QuoteCategory
}

const DEFAULT_QUOTE: QuoteResult = {
  text: 'Every day, do something for your Body and Mind.',
  author: null,
}

/**
 * Simple hash function to generate a number from a string
 * Used for deterministic quote selection based on userId + date
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get a random quote from the database
 * @param category - Optional category to filter quotes
 * @returns A random quote or the default fallback
 */
export async function getRandomQuote(
  category?: QuoteCategory
): Promise<QuoteWithCategory> {
  try {
    const whereClause = category ? { category } : {}

    // Get count of quotes matching criteria
    const count = await prisma.quote.count({ where: whereClause })

    if (count === 0) {
      return {
        ...DEFAULT_QUOTE,
        category: QuoteCategory.BALANCE,
      }
    }

    // Get a random quote using skip
    const randomIndex = Math.floor(Math.random() * count)
    const quote = await prisma.quote.findFirst({
      where: whereClause,
      skip: randomIndex,
      orderBy: { createdAt: 'asc' },
    })

    if (!quote) {
      return {
        ...DEFAULT_QUOTE,
        category: QuoteCategory.BALANCE,
      }
    }

    return {
      text: quote.text,
      author: quote.author,
      category: quote.category,
    }
  } catch (error) {
    console.error('Error fetching random quote:', error)
    return {
      ...DEFAULT_QUOTE,
      category: QuoteCategory.BALANCE,
    }
  }
}

/**
 * Get a consistent daily quote for a user
 * Uses the date + userId as a seed to ensure the same quote
 * is returned for the same user on the same day
 * @param userId - The user's ID
 * @returns A quote that stays consistent throughout the day for this user
 */
export async function getDailyQuote(userId: string): Promise<QuoteResult> {
  try {
    // Create a seed based on userId and today's date (UTC)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const seed = `${userId}-${today}`
    const hash = hashString(seed)

    // Get count of all quotes
    const count = await prisma.quote.count()

    if (count === 0) {
      return DEFAULT_QUOTE
    }

    // Use hash to deterministically select a quote
    const quoteIndex = hash % count
    const quote = await prisma.quote.findFirst({
      skip: quoteIndex,
      orderBy: { createdAt: 'asc' },
    })

    if (!quote) {
      return DEFAULT_QUOTE
    }

    return {
      text: quote.text,
      author: quote.author,
    }
  } catch (error) {
    console.error('Error fetching daily quote:', error)
    return DEFAULT_QUOTE
  }
}

/**
 * Get the default fallback quote
 */
export function getDefaultQuote(): QuoteResult {
  return { ...DEFAULT_QUOTE }
}
