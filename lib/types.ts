export type Subject = {
  id: string
  name: string
}

export type Note = {
  id: string
  title: string
  subject_id: string | null
  content_md: string
  status: 'draft' | 'saved'
}

export type NoteSource = {
  id: string
  note_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number | null
  status: 'uploaded' | 'processing' | 'ready' | 'failed'
}
