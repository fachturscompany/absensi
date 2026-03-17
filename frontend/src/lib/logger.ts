/**
 * Production-Ready Logger Utility
 * ================================
 * 
 * Features:
 * - Environment-aware (dev vs production)
 * - Multiple log levels (debug, info, warn, error)
 * - Module-specific loggers
 * - Timestamp support
 * - Error tracking integration ready
 * - Type-safe
 * 
 * Usage:
 * ```typescript
 * import { logger, createLogger } from '@/lib/logger'
 * 
 * // Default logger
 * logger.debug('This only shows in development')
 * logger.error('This always shows')
 * 
 * // Module-specific logger
 * const accountLogger = createLogger('Account')
 * accountLogger.debug('User data:', user)
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  /** Enable debug logs (default: NODE_ENV === 'development') */
  enableDebug?: boolean
  /** Enable info logs (default: NODE_ENV === 'development') */
  enableInfo?: boolean
  /** Enable timestamps (default: true) */
  enableTimestamp?: boolean
  /** Error tracking service (e.g., Sentry) */
  errorTracker?: (error: any, context?: any) => void
}

class Logger {
  private prefix: string
  private config: {
    enableDebug: boolean
    enableInfo: boolean
    enableTimestamp: boolean
    errorTracker?: (error: any, context?: any) => void
  }

  constructor(prefix: string = '', config?: LoggerConfig) {
    this.prefix = prefix
    
    // Default configuration
    const isDev = process.env.NODE_ENV === 'development'
    this.config = {
      enableDebug: config?.enableDebug ?? isDev,
      enableInfo: config?.enableInfo ?? isDev,
      enableTimestamp: config?.enableTimestamp ?? true,
      errorTracker: config?.errorTracker
    }
  }

  /**
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    if (!this.config.enableTimestamp) return ''
    
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const ms = String(now.getMilliseconds()).padStart(3, '0')
    
    return `${hours}:${minutes}:${seconds}.${ms}`
  }

  /**
   * Get formatted prefix
   */
  private getPrefix(): string {
    const timestamp = this.getTimestamp()
    const prefix = this.prefix ? `[${this.prefix}]` : ''
    
    if (timestamp && prefix) {
      return `${timestamp} ${prefix}`
    } else if (timestamp) {
      return timestamp
    } else if (prefix) {
      return prefix
    }
    return ''
  }

  /**
   * Format log message
   */
  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const prefix = this.getPrefix()
    const levelTag = `[${level.toUpperCase()}]`
    
    if (prefix) {
      return [prefix, levelTag, ...args]
    }
    return [levelTag, ...args]
  }

  /**
   * DEBUG level - only shows in development
   * Use for: Detailed debugging information, variable values, flow control
   */
  debug(...args: any[]): void {
    if (!this.config.enableDebug) return
    console.log(...this.formatMessage('debug', ...args))
  }

  /**
   * INFO level - only shows in development
   * Use for: General information, process start/end, successful operations
   */
  info(...args: any[]): void {
    if (!this.config.enableInfo) return
    console.log(...this.formatMessage('info', ...args))
  }

  /**
   * WARN level - always shows
   * Use for: Warning conditions, deprecated usage, potential issues
   */
  warn(...args: any[]): void {
    console.warn(...this.formatMessage('warn', ...args))
  }

  /**
   * ERROR level - always shows
   * Use for: Error conditions, exceptions, failed operations
   */
  error(...args: any[]): void {
    console.error(...this.formatMessage('error', ...args))
    
    // Send to error tracking service if configured
    if (this.config.errorTracker) {
      try {
        const [firstArg, ...rest] = args
        this.config.errorTracker(firstArg, {
          module: this.prefix,
          additionalData: rest
        })
      } catch (err) {
        // Fail silently to avoid infinite error loops
        console.error('Failed to send error to tracker:', err)
      }
    }
  }

  /**
   * Create a child logger with additional prefix
   */
  child(childPrefix: string): Logger {
    const newPrefix = this.prefix 
      ? `${this.prefix}:${childPrefix}` 
      : childPrefix
    return new Logger(newPrefix, this.config)
  }

  /**
   * Group related logs
   */
  group(label: string): void {
    if (this.config.enableDebug) {
      console.group(label)
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.config.enableDebug) {
      console.groupEnd()
    }
  }

  /**
   * Log execution time
   */
  time(label: string): void {
    if (this.config.enableDebug) {
      console.time(label)
    }
  }

  /**
   * End timing
   */
  timeEnd(label: string): void {
    if (this.config.enableDebug) {
      console.timeEnd(label)
    }
  }

  /**
   * Table output (useful for arrays/objects)
   */
  table(data: any): void {
    if (this.config.enableDebug) {
      console.table(data)
    }
  }
}

/**
 * Create a logger instance with a specific prefix
 * 
 * @param prefix - Module or feature name
 * @param config - Optional configuration
 * 
 * @example
 * ```typescript
 * const userLogger = createLogger('User')
 * userLogger.debug('Fetching user data...')
 * userLogger.error('Failed to fetch user:', error)
 * ```
 */
export function createLogger(prefix: string, config?: LoggerConfig): Logger {
  return new Logger(prefix, config)
}

// ============================================
// PRE-CONFIGURED LOGGERS
// ============================================

/**
 * Default logger (no prefix)
 */
export const logger = new Logger()

/**
 * Module-specific loggers
 */
export const accountLogger = createLogger('Account')
export const analyticsLogger = createLogger('Analytics')
export const attendanceLogger = createLogger('Attendance')
export const authLogger = createLogger('Auth')
export const dashboardLogger = createLogger('Dashboard')
export const memberLogger = createLogger('Member')
export const scheduleLogger = createLogger('Schedule')
export const organizationLogger = createLogger('Organization')
export const notificationLogger = createLogger('Notification')

// ============================================
// ERROR TRACKING INTEGRATION
// ============================================

/**
 * Configure error tracking service (e.g., Sentry)
 * 
 * @example
 * ```typescript
 * import * as Sentry from '@sentry/nextjs'
 * 
 * configureErrorTracking((error, context) => {
 *   Sentry.captureException(error, {
 *     tags: { module: context?.module },
 *     extra: context?.additionalData
 *   })
 * })
 * ```
 */
export function configureErrorTracking(
  tracker: (error: any, context?: any) => void
): void {
  // Update all pre-configured loggers
  const loggers = [
    logger,
    accountLogger,
    analyticsLogger,
    attendanceLogger,
    authLogger,
    dashboardLogger,
    memberLogger,
    scheduleLogger,
    organizationLogger,
    notificationLogger
  ]

  loggers.forEach(log => {
    // @ts-ignore - accessing private property for configuration
    log.config.errorTracker = tracker
  })
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Log API request
 */
export function logRequest(method: string, url: string, data?: any): void {
  logger.debug(`→ ${method} ${url}`, data)
}

/**
 * Log API response
 */
export function logResponse(method: string, url: string, status: number, data?: any): void {
  if (status >= 200 && status < 300) {
    logger.debug(`← ${method} ${url} [${status}]`, data)
  } else {
    logger.error(`← ${method} ${url} [${status}]`, data)
  }
}

/**
 * Log function entry
 */
export function logEntry(functionName: string, ...args: any[]): void {
  logger.debug(`→ ${functionName}`, ...args)
}

/**
 * Log function exit
 */
export function logExit(functionName: string, result?: any): void {
  logger.debug(`← ${functionName}`, result)
}

/**
 * Log performance
 */
export function logPerformance(label: string, startTime: number): void {
  const duration = Date.now() - startTime
  logger.debug(`⏱ ${label}: ${duration}ms`)
}

// ============================================
// TYPES
// ============================================

export type { Logger, LogLevel, LoggerConfig }
