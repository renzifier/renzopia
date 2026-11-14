import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NoteEditor from '@/components/note-editor'
import FileUpload from '@/components/file-upload'
import ConfirmButton from '@/components/confirm-button'
import { btnDanger, fmtSize } from '@/lib/ui'
import { deleteNote, deleteSource } from '../actions'

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: note }, { data: subjects }, { data: sources }] =
    await Promise.all([
      supabase.from('notes').select('*').eq('id', id).single(),
      supabase.from('subjects').select('id, name').order('name'),
      supabase
        .from('note_sources')
        .select('*')
        .eq('note_id', id)
        .order('created_at'),
    ])

  if (!note || !user) notFound()

  const urls = new Map<string, string>()
  if (sources?.length) {
    const { data: signed } = await supabase.storage
      .from('note-files')
      .createSignedUrls(
        sources.map((s) => s.storage_path),
        3600
      )
    signed?.forEach((d) => {
      if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl)
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/notes" className="text-sm opacity-60 hover:underline">
          Back to notes
        </Link>
        <form action={deleteNote}>
          <input type="hidden" name="id" value={note.id} />
          <ConfirmButton
            message="Delete this note and its files?"
            className={btnDanger}
          >
            Delete note
          </ConfirmButton>
        </form>
      </div>

      <NoteEditor note={note} subjects={subjects ?? []} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Files</h2>
        <FileUpload noteId={note.id} userId={user.id} />

        {!!sources?.length && (
          <ul className="space-y-2">
            {sources.map((s) => {
              const url = urls.get(s.storage_path)
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded border border-neutral-500/30 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {s.file_name}
                      </a>
                    ) : (
                      <span>{s.file_name}</span>
                    )}
                    <span className="ml-2 opacity-60">{fmtSize(s.size_bytes)}</span>
                  </div>
                  <form action={deleteSource}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="note_id" value={note.id} />
                    <ConfirmButton
                      message="Remove this file?"
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </ConfirmButton>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
