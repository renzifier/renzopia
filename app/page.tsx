import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('theme, daily_goal, session_minutes')
    .single()

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-neutral-600">Signed in as {user?.email}</p>
      <pre className="mt-4 rounded bg-neutral-100 p-3 text-sm">
        {JSON.stringify(settings, null, 2)}
      </pre>
      <form action={signOut} className="mt-6">
        <button className="rounded border border-neutral-300 px-3 py-2">Sign out</button>
      </form>
    </main>
  )
}
