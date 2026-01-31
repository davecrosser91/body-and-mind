/**
 * Migration script: Convert from old Category system to new Pillar/SubCategory
 *
 * Run with: npx tsx scripts/migrate-to-body-mind.ts
 */

import { PrismaClient, Category, Pillar, SubCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping from old Category to new Pillar + SubCategory
const CATEGORY_TO_PILLAR: Record<Category, { pillar: Pillar; subCategory: SubCategory }> = {
  FITNESS: { pillar: 'BODY', subCategory: 'TRAINING' },
  SLEEP: { pillar: 'BODY', subCategory: 'SLEEP' },
  NUTRITION: { pillar: 'BODY', subCategory: 'NUTRITION' },
  MINDFULNESS: { pillar: 'MIND', subCategory: 'MEDITATION' },
  LEARNING: { pillar: 'MIND', subCategory: 'LEARNING' },
};

async function migrateHabits() {
  console.log('Starting habit migration...');

  // Get all habits that don't have pillar set yet
  const habits = await prisma.habit.findMany({
    where: {
      pillar: null,
    },
  });

  console.log(`Found ${habits.length} habits to migrate`);

  for (const habit of habits) {
    const mapping = CATEGORY_TO_PILLAR[habit.category];

    if (mapping) {
      await prisma.habit.update({
        where: { id: habit.id },
        data: {
          pillar: mapping.pillar,
          subCategory: mapping.subCategory,
        },
      });
      console.log(`  Migrated habit "${habit.name}" -> ${mapping.pillar}/${mapping.subCategory}`);
    } else {
      console.warn(`  Warning: No mapping for category ${habit.category}`);
    }
  }

  console.log('Habit migration complete!');
}

async function initializeStreaks() {
  console.log('Initializing streaks for all users...');

  const users = await prisma.user.findMany({
    select: { id: true },
  });

  console.log(`Found ${users.length} users`);

  const pillarKeys = ['OVERALL', 'BODY', 'MIND'];

  for (const user of users) {
    for (const pillarKey of pillarKeys) {
      await prisma.streak.upsert({
        where: {
          userId_pillarKey: { userId: user.id, pillarKey },
        },
        update: {},
        create: {
          userId: user.id,
          pillarKey,
          current: 0,
          longest: 0,
        },
      });
    }

    console.log(`  Initialized streaks for user ${user.id}`);
  }

  console.log('Streak initialization complete!');
}

async function calculateInitialScores() {
  console.log('Calculating initial daily scores from existing completions...');

  const users = await prisma.user.findMany({
    select: { id: true },
  });

  for (const user of users) {
    // Get completions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completions = await prisma.habitCompletion.findMany({
      where: {
        habit: { userId: user.id },
        completedAt: { gte: thirtyDaysAgo },
      },
      include: {
        habit: true,
      },
      orderBy: { completedAt: 'asc' },
    });

    // Group completions by date
    const byDate: Record<string, typeof completions> = {};

    for (const completion of completions) {
      const dateKey = completion.completedAt.toISOString().split('T')[0];
      if (!dateKey) continue;
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(completion);
    }

    // Calculate score for each date
    const dateKeys = Object.keys(byDate);
    for (const dateKey of dateKeys) {
      const dayCompletions = byDate[dateKey] || [];
      const date = new Date(dateKey);

      // Count completions by pillar
      let bodyCompletions = 0;
      let bodyTotal = 0;
      let mindCompletions = 0;
      let mindTotal = 0;

      // Get all habits for this user
      const habits = await prisma.habit.findMany({
        where: { userId: user.id, archived: false },
      });

      for (const habit of habits) {
        const mapping = CATEGORY_TO_PILLAR[habit.category];
        if (!mapping) continue;

        const wasCompleted = dayCompletions.some((c: { habitId: string }) => c.habitId === habit.id);

        if (mapping.pillar === 'BODY') {
          bodyTotal++;
          if (wasCompleted) bodyCompletions++;
        } else {
          mindTotal++;
          if (wasCompleted) mindCompletions++;
        }
      }

      const bodyScore = bodyTotal > 0 ? Math.round((bodyCompletions / bodyTotal) * 100) : 0;
      const mindScore = mindTotal > 0 ? Math.round((mindCompletions / mindTotal) * 100) : 0;
      const balanceIndex = Math.round((bodyScore + mindScore) / 2);

      // Save daily score
      await prisma.dailyScore.upsert({
        where: {
          userId_date: { userId: user.id, date },
        },
        update: {
          bodyScore,
          mindScore,
          balanceIndex,
        },
        create: {
          userId: user.id,
          date,
          bodyScore,
          mindScore,
          balanceIndex,
        },
      });
    }

    console.log(`  Calculated scores for user ${user.id} (${dateKeys.length} days)`);
  }

  console.log('Score calculation complete!');
}

async function main() {
  console.log('=== Body + Mind Migration ===\n');

  try {
    await migrateHabits();
    console.log('');

    await initializeStreaks();
    console.log('');

    await calculateInitialScores();
    console.log('');

    console.log('=== Migration Complete! ===');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
