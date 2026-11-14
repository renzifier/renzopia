import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { card } from '@/lib/ui'

export default async function Dashboard() {
  const supabase = await createClient()

  const [subjects, notes, settings] = await Promise.all([
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'saved'),
    supabase
      .from('user_settings')
      .select('daily_goal, session_minutes')
      .single(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/subjects" className={`${card} hover:bg-neutral-500/10`}>
          <p className="text-3xl font-semibold">{subjects.count ?? 0}</p>
          <p className="text-sm opacity-60">Subjects</p>
        </Link>
        <Link href="/notes" className={`${card} hover:bg-neutral-500/10`}>
          <p className="text-3xl font-semibold">{notes.count ?? 0}</p>
          <p className="text-sm opacity-60">Notes</p>
        </Link>
        <div className={card}>
          <p className="text-3xl font-semibold">{settings.data?.daily_goal ?? 20}</p>
          <p className="text-sm opacity-60">Daily card goal</p>
        </div>
        <div className={card}>
          <p className="text-3xl font-semibold">
            {settings.data?.session_minutes ?? 25} min
          </p>
          <p className="text-sm opacity-60">Session length</p>
        </div>
      </div>
    </div>
  )
}
