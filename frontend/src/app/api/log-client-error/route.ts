import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

import { logger } from '@/lib/logger';
type LogPayload = {
  level?: 'error' | 'warn' | 'info' | 'debug'
  message?: string
  location?: string
  details?: any
  timestamp?: string
}

const LOG_FILE = path.resolve(process.cwd(), 'logs', 'client-errors.log')

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export async function POST(request: Request) {
  try {
    const body: LogPayload = await request.json().catch(() => ({}))
    const ts = body.timestamp || new Date().toISOString()
    const entry = {
      timestamp: ts,
      level: body.level || 'error',
      message: body.message || '',
      location: body.location || '',
      details: body.details || null
    }

    // Log to server console
    if (entry.level === 'error') logger.error('[client-log]', entry)
    else if (entry.level === 'warn') logger.warn('[client-log]', entry)
    else logger.debug('[client-log]', entry)

    // Append to file
    ensureLogDir()
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n')

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('Failed to write client log', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
