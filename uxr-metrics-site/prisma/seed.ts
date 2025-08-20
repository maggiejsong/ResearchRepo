import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uxr.com' },
    update: {},
    create: {
      email: 'admin@uxr.com',
      password: hashedPassword,
      name: 'UXR Admin',
      role: 'ADMIN'
    }
  })

  // Create default categories
  const researchTypeCategory = await prisma.category.upsert({
    where: { name: 'Research Type' },
    update: {},
    create: {
      name: 'Research Type',
      description: 'Type of research methodology used',
      color: '#3B82F6'
    }
  })

  const platformCategory = await prisma.category.upsert({
    where: { name: 'Platform' },
    update: {},
    create: {
      name: 'Platform',
      description: 'Platform or product area being researched',
      color: '#10B981'
    }
  })

  const audienceCategory = await prisma.category.upsert({
    where: { name: 'Audience' },
    update: {},
    create: {
      name: 'Audience',
      description: 'Target audience or user segment',
      color: '#F59E0B'
    }
  })

  // Create default tags
  const researchTypeTags = [
    'Usability Testing',
    'User Interviews',
    'Survey Research',
    'A/B Testing',
    'Card Sorting',
    'Tree Testing',
    'Diary Studies',
    'Focus Groups'
  ]

  const platformTags = [
    'Web App',
    'Mobile App',
    'Desktop',
    'API',
    'Marketing Site',
    'Admin Panel'
  ]

  const audienceTags = [
    'New Users',
    'Existing Users',
    'Power Users',
    'Enterprise',
    'SMB',
    'Consumer'
  ]

  for (const tagName of researchTypeTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        categoryId: researchTypeCategory.id
      }
    })
  }

  for (const tagName of platformTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        categoryId: platformCategory.id
      }
    })
  }

  for (const tagName of audienceTags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        categoryId: audienceCategory.id
      }
    })
  }

  // Create sample project
  const usabilityTag = await prisma.tag.findFirst({
    where: { name: 'Usability Testing' }
  })

  const webAppTag = await prisma.tag.findFirst({
    where: { name: 'Web App' }
  })

  const newUsersTag = await prisma.tag.findFirst({
    where: { name: 'New Users' }
  })

  if (usabilityTag && webAppTag && newUsersTag) {
    await prisma.project.upsert({
      where: { id: 'sample-project' },
      update: {},
      create: {
        id: 'sample-project',
        title: 'Onboarding Flow Usability Study',
        description: 'Comprehensive usability testing of the new user onboarding experience to identify pain points and optimize conversion rates.',
        status: 'ACTIVE',
        source: 'MANUAL',
        startDate: new Date('2024-01-15'),
        participantCount: 24,
        budget: 5000,
        createdById: admin.id,
        tags: {
          create: [
            { tagId: usabilityTag.id },
            { tagId: webAppTag.id },
            { tagId: newUsersTag.id }
          ]
        },
        metrics: {
          create: [
            { metricKey: 'completion_rate', value: '78%' },
            { metricKey: 'avg_time_to_complete', value: '12.5 minutes' },
            { metricKey: 'user_satisfaction', value: '4.2/5' }
          ]
        }
      }
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })