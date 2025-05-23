import { NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/db'

export async function GET() {
  try {
    const result = await testDatabaseConnection()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
        database: 'Neon PostgreSQL'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 