import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Supabase OAuth / Email 驗證後導回這裡
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single()

        const target = profile?.onboarding_completed ? '/' : '/onboarding'
        return NextResponse.redirect(`${origin}${target}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
