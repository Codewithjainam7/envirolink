import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = (process.env.NODE_ENV !== 'development' && forwardedHost)
        ? `${forwardedProto}://${forwardedHost}`
        : origin
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
        const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach((c) => pendingCookies.push(c))
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                        }
                    },
                },
            }
        )

        const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

        if (!authError && authData?.user) {
            // Check if user is an approved worker
            const { data: worker, error: workerError } = await supabase
                .from('workers')
                .select('status')
                .ilike('email', authData.user.email || '')
                .maybeSingle()

            if (workerError || !worker) {
                // No worker profile - redirect to login with error
                await supabase.auth.signOut()
                return NextResponse.redirect(`${baseUrl}/login?error=no-worker-profile`)
            }

            if (worker.status === 'pending_approval') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${baseUrl}/login?error=pending-approval`)
            }

            if (worker.status === 'rejected') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${baseUrl}/login?error=rejected`)
            }

            if (worker.status !== 'approved' && worker.status !== 'active') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${baseUrl}/login?error=invalid-status`)
            }

            // Worker is approved - allow access and explicitly forward session cookies
            const response = NextResponse.redirect(`${baseUrl}${next}`)
            pendingCookies.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, {
                    ...options,
                    maxAge: options?.maxAge ?? 60 * 60 * 24 * 30,
                })
            })
            return response
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${baseUrl}/login?error=auth-code-error`)
}
