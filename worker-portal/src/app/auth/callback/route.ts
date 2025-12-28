import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = await cookies()
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
                .eq('email', authData.user.email)
                .single()

            if (workerError || !worker) {
                // No worker profile - redirect to login with error
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/login?error=no-worker-profile`)
            }

            if (worker.status === 'pending_approval') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/login?error=pending-approval`)
            }

            if (worker.status === 'rejected') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/login?error=rejected`)
            }

            if (worker.status !== 'approved' && worker.status !== 'active') {
                await supabase.auth.signOut()
                return NextResponse.redirect(`${origin}/login?error=invalid-status`)
            }

            // Worker is approved - allow access
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
