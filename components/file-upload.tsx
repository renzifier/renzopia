'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { btn } from '@/lib/ui'

const MAX_BYTES = 10 * 1024 * 1024
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  docx: DOCX,
  txt: 'text/plain',
  md: 'text/markdown',
}

export default function FileUpload({
  noteId,
  userId,
}: {
  noteId: string
  userId: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const supabase = createClient()
    setBusy(true)
    setError(null)

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const mime = EXT_MIME[ext]

      if (!mime) {
        setError(`${file.name}: unsupported type (pdf, png, jpg, webp, docx, txt, md)`)
        continue
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: larger than 10 MB`)
        continue
      }

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${userId}/${noteId}/${crypto.randomUUID()}-${safe}`

      const { error: upErr } = await supabase.storage
        .from('note-files')
        .upload(path, file, { contentType: mime })
      if (upErr) {
        setError(`${file.name}: ${upErr.message}`)
        continue
      }

      const { error: dbErr } = await supabase.from('note_sources').insert({
        user_id: userId,
        note_id: noteId,
        storage_path: path,
        file_name: file.name,
        mime_type: mime,
        size_bytes: file.size,
      })
      if (dbErr) {
        await supabase.storage.from('note-files').remove([path])
        setError(`${file.name}: ${dbErr.message}`)
      }
    }

    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt,.md"
        onChange={onChange}
        disabled={busy}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className={`${btn} inline-block cursor-pointer`}>
        {busy ? 'Uploading...' : 'Upload files'}
      </label>
      <p className="text-xs opacity-60">pdf, png, jpg, webp, docx, txt, md. Max 10 MB each.</p>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
