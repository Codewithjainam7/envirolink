import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error_description = searchParams.get('error_description')
    const next = searchParams.get('next') ?? '/home'

    // Log for debugging
    console.log('Auth callback received:', { code: !!code, error_description, origin })

    // If there's an OAuth error from Supabase
    if (error_description) {
        console.error('OAuth error:', error_description)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description)}`)
    }

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
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
        }

        console.log('Session created successfully for:', data.user?.email)
        return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('No code received in callback')
    return NextResponse.redirect(`${origin}/login?error=no-code-received`)
}

