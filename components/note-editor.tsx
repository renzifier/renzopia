'use client'

import { useEffect, useState, useTransition } from 'react'
import { updateNote } from '@/app/(app)/notes/actions'
import { btnPrimary, input } from '@/lib/ui'
import type { Note, Subject } from '@/lib/types'

export default function NoteEditor({
  note,
  subjects,
}: {
  note: Note
  subjects: Subject[]
}) {
  const [title, setTitle] = useState(note.title)
  const [subjectId, setSubjectId] = useState<string>(note.subject_id ?? '')
  const [content, setContent] = useState(note.content_md)
  const [saved, setSaved] = useState({
    title: note.title,
    subjectId: note.subject_id ?? '',
    content: note.content_md,
  })
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty =
    title !== saved.title ||
    subjectId !== saved.subjectId ||
    content !== saved.content

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function save() {
    setMsg(null)
    startTransition(async () => {
      const res = await updateNote(note.id, {
        title,
        subject_id: subjectId || null,
        content_md: content,
      })
      if (res.error) {
        setMsg(res.error)
      } else {
        setSaved({ title, subjectId, content })
        setMsg('Saved')
      }
    })
  }

  return (
    <div className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={`${input} text-lg font-medium`}
      />

      <select
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        className={input}
      >
        <option value="">No subject</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write or paste your notes here..."
        className={`${input} min-h-[50vh] font-mono text-sm`}
      />

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending || !dirty} className={btnPrimary}>
          {pending ? 'Saving...' : 'Save'}
        </button>
        {dirty && !pending && <span className="text-sm opacity-60">Unsaved changes</span>}
        {!dirty && msg && <span className="text-sm opacity-60">{msg}</span>}
        {dirty && msg && msg !== 'Saved' && (
          <span className="text-sm text-red-500">{msg}</span>
        )}
      </div>
    </div>
  )
}
