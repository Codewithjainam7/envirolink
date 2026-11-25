import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function getSafeRedirectOrigin(request: Request, fallbackOrigin: string): string {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (!isLocalEnv && forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`
    }
    return fallbackOrigin
}

function getSafeNextPath(rawNext: string | undefined | null): string {
    if (!rawNext) return '/home'
    try {
        const decoded = decodeURIComponent(rawNext)
        return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : '/home'
    } catch {
        return '/home'
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error_description = searchParams.get('error_description')
    const redirectOrigin = getSafeRedirectOrigin(request, origin)

    const cookieStore = await cookies()
    const rawNext = searchParams.get('next') ?? cookieStore.get('envirolink_auth_next')?.value
    const next = getSafeNextPath(rawNext)

    // Log for debugging
    console.log('Auth callback received:', { code: !!code, error_description, redirectOrigin, next })

    // If there's an OAuth error from Supabase
    if (error_description) {
        console.error('OAuth error:', error_description)
        return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent(error_description)}`)
    }

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch (e) {
                            console.error('Cookie set error:', e)
                        }
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('Session exchange error:', error.message)
            return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent(error.message)}`)
        }

        console.log('Session created successfully for:', data.user?.email)
        const response = NextResponse.redirect(`${redirectOrigin}${next}`)
        response.cookies.delete('envirolink_auth_next')
        return response
    }

    console.error('No code received in callback')
    return NextResponse.redirect(`${redirectOrigin}/login?error=no-code-received`)
}
