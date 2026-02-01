import { PrismaClient, QuoteCategory } from '@prisma/client'

const prisma = new PrismaClient()

interface QuoteData {
  text: string
  author: string | null
  category: QuoteCategory
}

const QUOTES: QuoteData[] = [
  // RUMI
  {
    text: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.',
    author: 'Rumi',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'The wound is the place where the Light enters you.',
    author: 'Rumi',
    category: QuoteCategory.MIND,
  },
  {
    text: 'What you seek is seeking you.',
    author: 'Rumi',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.',
    author: 'Rumi',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'The quieter you become, the more you can hear.',
    author: 'Rumi',
    category: QuoteCategory.MIND,
  },
  {
    text: 'Set your life on fire. Seek those who fan your flames.',
    author: 'Rumi',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Be like a tree and let the dead leaves drop.',
    author: 'Rumi',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Respond to every call that excites your spirit.',
    author: 'Rumi',
    category: QuoteCategory.MOTIVATION,
  },

  // JAY SHETTY
  {
    text: 'When you try to live your life based on what others think of you, you lose sight of who you are.',
    author: 'Jay Shetty',
    category: QuoteCategory.MIND,
  },
  {
    text: 'The more you feed your mind with positive thoughts, the more you can attract great things into your life.',
    author: 'Jay Shetty',
    category: QuoteCategory.MIND,
  },
  {
    text: 'Your routine creates you.',
    author: 'Jay Shetty',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'Small daily improvements are the key to staggering long-term results.',
    author: 'Jay Shetty',
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: 'The goal is not to be better than anyone else, but to be better than you used to be.',
    author: 'Jay Shetty',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'If you want to fly, you have to give up the things that weigh you down.',
    author: 'Jay Shetty',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Don\'t let someone who gave up on their dreams talk you out of yours.',
    author: 'Jay Shetty',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Trade your expectations for appreciation and your whole world changes.',
    author: 'Jay Shetty',
    category: QuoteCategory.MIND,
  },

  // ALBERT EINSTEIN
  {
    text: 'Life is like riding a bicycle. To keep your balance, you must keep moving.',
    author: 'Albert Einstein',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.',
    author: 'Albert Einstein',
    category: QuoteCategory.MIND,
  },
  {
    text: 'Try not to become a man of success, but rather try to become a man of value.',
    author: 'Albert Einstein',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'The measure of intelligence is the ability to change.',
    author: 'Albert Einstein',
    category: QuoteCategory.MIND,
  },
  {
    text: 'Strive not to be a success, but rather to be of value.',
    author: 'Albert Einstein',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'A calm and modest life brings more happiness than the pursuit of success combined with constant restlessness.',
    author: 'Albert Einstein',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Learn from yesterday, live for today, hope for tomorrow.',
    author: 'Albert Einstein',
    category: QuoteCategory.CONSISTENCY,
  },

  // JOE DISPENZA
  {
    text: 'Change as a choice is more evolved than change as a reaction.',
    author: 'Joe Dispenza',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'Your thoughts are incredibly powerful. Choose yours wisely.',
    author: 'Joe Dispenza',
    category: QuoteCategory.MIND,
  },
  {
    text: 'The moment you decide to make a different choice, get ready to be uncomfortable.',
    author: 'Joe Dispenza',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Meditation takes us from survival to creation.',
    author: 'Joe Dispenza',
    category: QuoteCategory.MIND,
  },
  {
    text: 'The best way to predict your future is to create it.',
    author: 'Joe Dispenza',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'We can\'t create a new future while we\'re living in the past.',
    author: 'Joe Dispenza',
    category: QuoteCategory.MOTIVATION,
  },
  {
    text: 'Where you place your attention is where you place your energy.',
    author: 'Joe Dispenza',
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: 'The privilege of being a human being is that we can make a thought more real than anything else.',
    author: 'Joe Dispenza',
    category: QuoteCategory.MIND,
  },
  {
    text: 'If you want a new outcome, you will have to break the habit of being yourself.',
    author: 'Joe Dispenza',
    category: QuoteCategory.ATOMIC_HABITS,
  },
  {
    text: 'Your body is your unconscious mind.',
    author: 'Joe Dispenza',
    category: QuoteCategory.BODY,
  },

  // SAM HARRIS
  {
    text: 'Almost all our suffering is the product of our thoughts. We spend nearly every moment of our lives lost in thought.',
    author: 'Sam Harris',
    category: QuoteCategory.MIND,
  },
  {
    text: 'The quality of your mind determines the quality of your life.',
    author: 'Sam Harris',
    category: QuoteCategory.MIND,
  },
  {
    text: 'The feeling that we call "I" is an illusion. There is no discrete self or ego living like a Minotaur in the labyrinth of the brain.',
    author: 'Sam Harris',
    category: QuoteCategory.MIND,
  },
  {
    text: 'If you want to be happy, you have to pay close attention to the nature of your own mind.',
    author: 'Sam Harris',
    category: QuoteCategory.BALANCE,
  },
  {
    text: 'Our minds are all we have. They are all we have ever had. And they are all we can offer others.',
    author: 'Sam Harris',
    category: QuoteCategory.MIND,
  },
  {
    text: 'There is nothing passive about mindfulness. One might even say that it expresses a specific kind of passion—a passion for discerning what is subjectively real in every moment.',
    author: 'Sam Harris',
    category: QuoteCategory.CONSISTENCY,
  },
  {
    text: 'How we pay attention to the present moment largely determines the character of our experience.',
    author: 'Sam Harris',
    category: QuoteCategory.MIND,
  },
  {
    text: 'Wisdom is nothing more profound than the ability to follow one\'s own advice.',
    author: 'Sam Harris',
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
