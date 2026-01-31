import { PrismaClient, QuoteCategory } from '@prisma/client'

const prisma = new PrismaClient()

interface QuoteData {
  text: string
  author: string | null
  category: QuoteCategory
}

const QUOTES: QuoteData[] = [
  // ATOMIC_HABITS - Quotes from James Clear's book
  {
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'Every action you take is a vote for the type of person you wish to become.',
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'Habits are the compound interest of self-improvement.',
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'The task of breaking a bad habit is like uprooting a powerful oak within us.',
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'Be the designer of your world and not merely the consumer of it.',
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: "You should be far more concerned with your current trajectory than with your current results.",
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become.',
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'Small habits don\'t add up. They compound.',
    author: 'James Clear',
    category: QuoteCategory.ATOMIC_HABITS,
  },

  // CONSISTENCY - Don't break the chain, etc.
  {
    text: "Don't break the chain.",
    author: 'Jerry Seinfeld',
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: "It's not what we do once in a while that shapes our lives. It's what we do consistently.",
    author: 'Tony Robbins',
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: 'Consistency is what transforms average into excellence.',
    author: null,
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: 'The secret of your future is hidden in your daily routine.',
    author: 'Mike Murdock',
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: 'Long-term consistency trumps short-term intensity.',
    author: 'Bruce Lee',
    category: QuoteCategory.CONSISTENCY,
  },

  // MOTIVATION - General motivation
  {
    text: 'The only bad workout is the one that didn\'t happen.',
    author: null,
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'The pain you feel today will be the strength you feel tomorrow.',
    author: null,
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Start where you are. Use what you have. Do what you can.',
    author: 'Arthur Ashe',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: 'Zig Ziglar',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'The difference between try and triumph is just a little umph!',
    author: 'Marvin Phillips',
    category: QuoteCategory.MOTIVATION,
  },

  // BODY - Physical fitness quotes
  {
    text: 'Take care of your body. It\'s the only place you have to live.',
    author: 'Jim Rohn',
    category: QuoteCategory.BODY,
  },
  {
    text: 'Physical fitness is the first requisite of happiness.',
    author: 'Joseph Pilates',
    category: QuoteCategory.BODY,
  },
  {
    text: 'Your body can stand almost anything. It\'s your mind that you have to convince.',
    author: null,
    category: QuoteCategory.BODY,
  },
  {
    text: 'Fitness is not about being better than someone else. It\'s about being better than you used to be.',
    author: null,
    category: QuoteCategory.BODY,
  },
  {
    text: 'The body achieves what the mind believes.',
    author: null,
    category: QuoteCategory.BODY,
  },
  {
    text: 'Exercise is king. Nutrition is queen. Put them together and you\'ve got a kingdom.',
    author: 'Jack LaLanne',
    category: QuoteCategory.BODY,
  },

  // MIND - Mental wellness, reading, learning
  {
    text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.',
    author: 'George R.R. Martin',
    category: QuoteCategory.MIND,
  },
  {
    text: 'The mind is everything. What you think you become.',
    author: 'Buddha',
    category: QuoteCategory.MIND,
  },
  {
    text: 'Reading is to the mind what exercise is to the body.',
    author: 'Joseph Addison',
    category: QuoteCategory.MIND,
  },
  {
    text: 'Meditation is not about stopping thoughts, but recognizing that we are more than our thoughts.',
    author: 'Arianna Huffington',
    category: QuoteCategory.MIND,
  },
  {
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
    category: QuoteCategory.MIND,
  },
  {
    text: 'The more that you read, the more things you will know. The more that you learn, the more places you\'ll go.',
    author: 'Dr. Seuss',
    category: QuoteCategory.MIND,
  },

  // BALANCE - Harmony of body and mind
  {
    text: 'A healthy outside starts from the inside.',
    author: 'Robert Urich',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Balance is not something you find, it\'s something you create.',
    author: 'Jana Kingsford',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'The groundwork for all happiness is good health.',
    author: 'Leigh Hunt',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Nurture your mind with great thoughts, for you will never go any higher than you think.',
    author: 'Benjamin Disraeli',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Happiness is not a matter of intensity but of balance and order and rhythm and harmony.',
    author: 'Thomas Merton',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Every day, do something for your Body and Mind.',
    author: null,
    category: QuoteCategory.BALANCE,
  },
]

async function seedQuotes() {
  console.log('Starting quotes seed...')

  // Clear existing quotes
  await prisma.quote.deleteMany({})
  console.log('Cleared existing quotes')

  // Insert all quotes
  const result = await prisma.quote.createMany({
    data: QUOTES,
  })

  console.log(`Seeded ${result.count} quotes successfully!`)

  // Show count by category
  const categories = Object.values(QuoteCategory)
  for (const category of categories) {
    const count = await prisma.quote.count({ where: { category } })
    console.log(`  - ${category}: ${count} quotes`)
  }

  console.log('Quotes seed completed!')
}

seedQuotes()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding quotes:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
