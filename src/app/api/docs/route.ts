import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/swagger'

/**
 * GET /api/docs
 * Returns the OpenAPI specification as JSON
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
