import { PrismaClient, HabitanimalType, Pillar, Frequency } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const HABITANIMALS = [
  { type: HabitanimalType.FITNESS, species: 'gorilla', name: 'Guiro' },
  { type: HabitanimalType.MINDFULNESS, species: 'turtle', name: 'Zen' },
  { type: HabitanimalType.NUTRITION, species: 'ox', name: 'Greeny' },
  { type: HabitanimalType.SLEEP, species: 'sloth', name: 'Milo' },
  { type: HabitanimalType.LEARNING, species: 'fox', name: 'Finn' },
]

const SAMPLE_ACTIVITIES = [
  { name: 'Morning Workout', pillar: Pillar.BODY, subCategory: 'TRAINING', description: '30 minutes of exercise', points: 30 },
  { name: 'Meditation', pillar: Pillar.MIND, subCategory: 'MEDITATION', description: '10 minutes of mindfulness meditation', points: 25 },
  { name: 'Eat Vegetables', pillar: Pillar.BODY, subCategory: 'NUTRITION', description: 'Include vegetables in at least 2 meals', points: 20 },
  { name: 'Sleep by 10pm', pillar: Pillar.BODY, subCategory: 'SLEEP', description: 'Be in bed by 10pm for quality sleep', points: 25 },
  { name: 'Read 20 Pages', pillar: Pillar.MIND, subCategory: 'READING', description: 'Read at least 20 pages of a book', points: 25 },
  { name: 'Evening Walk', pillar: Pillar.BODY, subCategory: 'TRAINING', description: '15 minute walk after dinner', points: 20 },
  { name: 'Journal', pillar: Pillar.MIND, subCategory: 'JOURNALING', description: 'Write 3 things you are grateful for', points: 20 },
  { name: 'Drink Water', pillar: Pillar.BODY, subCategory: 'NUTRITION', description: 'Drink 8 glasses of water', points: 15 },
]

async function main() {
  console.log('Starting seed...')

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

  console.log(`Created test user: ${user.email}`)

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

  console.log(`Created ${HABITANIMALS.length} Habitanimals`)

  // Create sample activities
  for (const activity of SAMPLE_ACTIVITIES) {
    await prisma.activity.upsert({
      where: {
        id: `${user.id}-${activity.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        name: activity.name,
        pillar: activity.pillar,
        subCategory: activity.subCategory,
        description: activity.description,
        points: activity.points,
        isHabit: true,
        frequency: Frequency.DAILY,
        userId: user.id,
      },
    })
  }

  console.log(`Created ${SAMPLE_ACTIVITIES.length} sample activities`)

  console.log('Seed completed!')
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
