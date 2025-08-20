import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokens = await prisma.apiToken.findMany({
      orderBy: {
        service: 'asc'
      }
    })

    // Don't return the actual token values for security
    const sanitizedTokens = tokens.map(token => ({
      ...token,
      token: token.token ? '***' + token.token.slice(-4) : ''
    }))

    return NextResponse.json(sanitizedTokens)
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { qualtricsToken, greatQuestionToken } = await request.json()

    const updates = []

    if (qualtricsToken) {
      const qualtricsUpdate = prisma.apiToken.upsert({
        where: {
          service: 'QUALTRICS'
        },
        update: {
          token: qualtricsToken,
          isActive: true
        },
        create: {
          service: 'QUALTRICS',
          token: qualtricsToken,
          isActive: true
        }
      })
      updates.push(qualtricsUpdate)
    }

    if (greatQuestionToken) {
      const greatQuestionUpdate = prisma.apiToken.upsert({
        where: {
          service: 'GREAT_QUESTION'
        },
        update: {
          token: greatQuestionToken,
          isActive: true
        },
        create: {
          service: 'GREAT_QUESTION',
          token: greatQuestionToken,
          isActive: true
        }
      })
      updates.push(greatQuestionUpdate)
    }

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}