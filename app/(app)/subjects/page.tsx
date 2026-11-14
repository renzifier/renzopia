import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/confirm-button'
import { btn, btnPrimary, btnDanger, card, input } from '@/lib/ui'
import { createSubject, renameSubject, deleteSubject } from './actions'

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, notes(count)')
    .order('created_at')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Subjects</h1>

      <form action={createSubject} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="New subject (e.g. Biology)"
          className={input}
        />
        <button className={btnPrimary}>Add</button>
      </form>

      {!subjects?.length && <p className="opacity-60">No subjects yet.</p>}

      <ul className="space-y-3">
        {subjects?.map((s) => {
          const count =
            (s.notes as unknown as { count: number }[] | null)?.[0]?.count ?? 0
          return (
            <li key={s.id} className={`${card} space-y-3`}>
              <div className="flex items-center justify-between">
                <Link
                  href={`/notes?subject=${s.id}`}
                  className="font-medium hover:underline"
                >
                  {s.name}
                </Link>
                <span className="text-sm opacity-60">
                  {count} {count === 1 ? 'note' : 'notes'}
                </span>
              </div>

              <div className="flex gap-2">
                <form action={renameSubject} className="flex flex-1 gap-2">
                  <input type="hidden" name="id" value={s.id} />
                  <input
                    name="name"
                    defaultValue={s.name}
                    required
                    className={input}
                  />
                  <button className={btn}>Rename</button>
                </form>
                <form action={deleteSubject}>
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton
                    message="Delete this subject? Its notes are kept but become unassigned."
                    className={btnDanger}
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
