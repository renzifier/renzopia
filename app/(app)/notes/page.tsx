import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { btnPrimary, card, chip } from '@/lib/ui'
import { createNote } from './actions'

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>
}) {
  const { subject } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('notes')
    .select('id, title, subject_id, updated_at')
    .eq('status', 'saved')
    .order('updated_at', { ascending: false })
  if (subject) query = query.eq('subject_id', subject)

  const [{ data: notes }, { data: subjects }] = await Promise.all([
    query,
    supabase.from('subjects').select('id, name').order('name'),
  ])

  const names = new Map<string, string>(
    (subjects ?? []).map((s) => [s.id, s.name])
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <form action={createNote}>
          <input type="hidden" name="subject_id" value={subject ?? ''} />
          <button className={btnPrimary}>New note</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/notes" className={chip(!subject)}>
          All
        </Link>
        {subjects?.map((s) => (
          <Link
            key={s.id}
            href={`/notes?subject=${s.id}`}
            className={chip(subject === s.id)}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {!notes?.length && <p className="opacity-60">No notes yet.</p>}

      <ul className="space-y-2">
        {notes?.map((n) => (
          <li key={n.id}>
            <Link
              href={`/notes/${n.id}`}
              className={`${card} flex items-center justify-between gap-3 hover:bg-neutral-500/10`}
            >
              <span className="truncate font-medium">{n.title}</span>
              <span className="shrink-0 text-xs opacity-60">
                {n.subject_id ? names.get(n.subject_id) : 'No subject'}
                {' · '}
                {new Date(n.updated_at).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
