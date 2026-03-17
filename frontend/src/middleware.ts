export const runtime = 'nodejs'

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { logger } from "@/lib/logger"


const getProjectRef = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return supabaseUrl?.split("//")[1]?.split(".")[0]
}

const getAuthCookieNames = () => {
  const projectRef = getProjectRef()
  if (!projectRef) return []
  const base = `sb-${projectRef}-auth-token`
  return [base, `${base}.0`, `${base}.1`]
}

const isNetworkError = (error: unknown) => {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  const errorString = String(error).toLowerCase()
  return (
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("offline") ||
    errorString.includes("fetch") ||
    errorString.includes("network")
  )
}

const hasSupabaseSessionCookie = (req: NextRequest) =>
  getAuthCookieNames().some((name) => Boolean(req.cookies.get(name)))

export async function middleware(req: NextRequest) {
  // Early CORS handling for preflight requests to avoid 400 and heavy work
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') || '*'
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Vary': 'Origin',
        'Cache-Control': 'no-store',
      },
    })
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const orgIdCookie = req.cookies.get('org_id')
  if (orgIdCookie) {
    response.cookies.set({
      name: 'org_id',
      value: orgIdCookie.value,
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
    })
    logger.info(`[MIDDLEWARE] Preserving org_id cookie: ${orgIdCookie.value}`)
  }

  const authCookieNames = getAuthCookieNames()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options) {
          // Set cookie on both request and response
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          // Remove cookie from both request and response
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const hasSessionCookie = hasSupabaseSessionCookie(req)

  // Get user with error handling for malformed cookies
  let user = null
  let isOffline = false
  let isRefreshTokenError = false

  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user

    if (error) {
      // "Auth session missing!" is a normal case when user is not logged in
      const isSessionMissing = error.message === 'Auth session missing!'

      if (isSessionMissing) {
        // This is normal - user has no active session, don't log or clear cookies
        // The middleware will handle the redirect to login
      } else {
        const networkError = isNetworkError(error)
        const refreshTokenError =
          (error.message?.toLowerCase().includes('refresh') &&
            error.message?.toLowerCase().includes('token')) ||
          error.message?.includes('Invalid Refresh Token') ||
          (error.status === 400 && hasSessionCookie)

        isOffline = networkError && hasSessionCookie && !refreshTokenError
        isRefreshTokenError = refreshTokenError

        if (isOffline) {
          logger.warn("Supabase auth request failed due to network issues; assuming offline session")
        } else if (isRefreshTokenError) {
          logger.warn("Invalid refresh token detected, clearing auth cookies:", error.message)
          authCookieNames.forEach((cookieName) => {
            response.cookies.delete(cookieName)
          })
        } else {
          logger.warn("Error getting user, clearing auth cookies:", error)
          authCookieNames.forEach((cookieName) => {
            response.cookies.delete(cookieName)
          })
        }
      }
    }
  } catch (error: any) {
    // "Auth session missing!" is a normal case when user is not logged in
    const isSessionMissing = error?.message === 'Auth session missing!'

    if (isSessionMissing) {
      // This is normal - user has no active session, don't log or clear cookies
    } else {
      const networkError = isNetworkError(error)
      const refreshTokenError =
        (error?.message?.toLowerCase().includes('refresh') &&
          error?.message?.toLowerCase().includes('token')) ||
        error?.message?.includes('Invalid Refresh Token') ||
        (error?.status === 400 && hasSessionCookie)

      isOffline = networkError && hasSessionCookie && !refreshTokenError
      isRefreshTokenError = refreshTokenError

      if (isOffline) {
        logger.warn("Supabase auth network failure, assuming offline session")
      } else if (isRefreshTokenError) {
        logger.warn("Invalid refresh token detected, clearing auth cookies:", error?.message)
        authCookieNames.forEach((cookieName) => {
          response.cookies.delete(cookieName)
        })
      } else {
        // If there's an error (likely due to malformed cookies), clear auth cookies
        logger.warn("Error getting user, clearing auth cookies:", error)
        authCookieNames.forEach((cookieName) => {
          response.cookies.delete(cookieName)
        })
      }
    }
  }

  const { pathname } = req.nextUrl

  // Don't require auth for public pages
  const publicPaths = ["/auth", "/invite"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Handle refresh token error - redirect to login immediately
  if (isRefreshTokenError && !isPublicPath) {
    logger.warn("Redirecting to login due to invalid refresh token")
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  // Handle offline session - show offline page instead of login redirect
  // CRITICAL: This must come BEFORE the "!user && !isPublicPath" check
  if (isOffline && !user && !isPublicPath && !pathname.startsWith("/offline")) {
    return NextResponse.redirect(new URL("/offline", req.url))
  }

  // Redirect logic based on user authentication
  if (user && pathname.startsWith("/auth/login")) {
    // Redirect to organization instead of dashboard
    return NextResponse.redirect(new URL("/organization", req.url))
  }

  // Allow newly signed up users to see signup page briefly before redirect
  if (user && pathname.startsWith("/auth/signup")) {
    // Check if user has been recently created (within last minute)
    const userCreatedAt = new Date(user.created_at)
    const now = new Date()
    const timeDifference = now.getTime() - userCreatedAt.getTime()
    const oneMinuteInMs = 60 * 1000

    // If user was created more than 1 minute ago, redirect to dashboard
    if (timeDifference > oneMinuteInMs) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    // Otherwise, let them stay on signup page to see the success message
  }

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  // Check if authenticated user has selected organization
  // Allow access to organization and special pages without organization check
  const excludedPaths = [
    "/organization",
    "/onboarding",
    "/account-inactive",
    "/organization-inactive",
    "/subscription-expired",
  ]
  const isExcludedPath = excludedPaths.some((path) => pathname.startsWith(path))

  // For authenticated users accessing protected pages, check if organization is selected
  if (user && !isExcludedPath && !isPublicPath) {
    // Check if organization ID is in cookies or session
    // If not, redirect to organization
    const orgIdCookie = req.cookies.get('org_id')?.value

    logger.info(`[MIDDLEWARE] Checking org_id cookie for user ${user.id} on path ${pathname}`)
    logger.info(`[MIDDLEWARE] org_id cookie value: ${orgIdCookie || 'NOT FOUND'}`)
    logger.info(`[MIDDLEWARE] All cookies: ${JSON.stringify(req.cookies.getAll())}`)

    if (!orgIdCookie) {
      logger.warn(`[MIDDLEWARE] No org_id cookie found for path ${pathname}, redirecting to /organization`)
      return NextResponse.redirect(new URL("/organization", req.url))
    }

    logger.info(`[MIDDLEWARE] org_id cookie found: ${orgIdCookie}, allowing access to ${pathname}`)
  }

  return response
}

export const config = {
  // Exclude static assets, api routes, and PWA files from auth middleware
  // API routes will handle their own authentication
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|sw.js|workbox-.*\\.js|manifest.json|offline|icons/).*)",
  ],
}
