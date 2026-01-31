import { PrismaClient, Category, HabitanimalType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const HABITANIMALS = [
  { type: HabitanimalType.FITNESS, species: 'gorilla', name: 'Guiro' },
  { type: HabitanimalType.MINDFULNESS, species: 'turtle', name: 'Zen' },
  { type: HabitanimalType.NUTRITION, species: 'ox', name: 'Greeny' },
  { type: HabitanimalType.SLEEP, species: 'sloth', name: 'Milo' },
  { type: HabitanimalType.LEARNING, species: 'fox', name: 'Finn' },
]

const SAMPLE_HABITS = [
  { name: 'Morning Workout', category: Category.FITNESS, description: '30 minutes of exercise' },
  { name: 'Meditation', category: Category.MINDFULNESS, description: '10 minutes of mindfulness meditation' },
  { name: 'Eat Vegetables', category: Category.NUTRITION, description: 'Include vegetables in at least 2 meals' },
  { name: 'Sleep by 10pm', category: Category.SLEEP, description: 'Be in bed by 10pm for quality sleep' },
  { name: 'Read 20 Pages', category: Category.LEARNING, description: 'Read at least 20 pages of a book' },
  { name: 'Evening Walk', category: Category.FITNESS, description: '15 minute walk after dinner' },
  { name: 'Journal', category: Category.MINDFULNESS, description: 'Write 3 things you are grateful for' },
  { name: 'Drink Water', category: Category.NUTRITION, description: 'Drink 8 glasses of water' },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Create test user
  const passwordHash = await hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash,
      name: 'Test User',
    },
  })

  console.log(`✅ Created test user: ${user.email}`)

  // Create habitanimals for the user
  for (const habitanimal of HABITANIMALS) {
    await prisma.habitanimal.upsert({
      where: {
        id: `${user.id}-${habitanimal.type}`, // Use a deterministic ID for upsert
      },
      update: {},
      create: {
        type: habitanimal.type,
        species: habitanimal.species,
        name: habitanimal.name,
        userId: user.id,
      },
    })
  }

  console.log(`✅ Created ${HABITANIMALS.length} Habitanimals`)

  // Create sample habits
  for (const habit of SAMPLE_HABITS) {
    await prisma.habit.upsert({
      where: {
        id: `${user.id}-${habit.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        name: habit.name,
        category: habit.category,
        description: habit.description,
        userId: user.id,
      },
    })
  }

  console.log(`✅ Created ${SAMPLE_HABITS.length} sample habits`)

  console.log('🌱 Seed completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
