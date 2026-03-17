import { NextResponse } from 'next/server'

export function GET(request: Request) {
  // Construct an absolute URL based on the incoming request to satisfy NextResponse
  const destination = new URL('/group', request.url)
  // Permanent redirect to the new /group route
  return NextResponse.redirect(destination, 301)
}
