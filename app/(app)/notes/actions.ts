'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createNote(formData: FormData) {
  const subjectId = String(formData.get('subject_id') ?? '') || null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      title: 'Untitled',
      status: 'saved',
      expires_at: null,
    })
    .select('id')
    .single()

  if (error || !data) redirect('/notes')
  revalidatePath('/notes')
  redirect(`/notes/${data.id}`)
}

export async function updateNote(
  id: string,
  data: { title: string; subject_id: string | null; content_md: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notes')
    .update({
      title: data.title.trim() || 'Untitled',
      subject_id: data.subject_id,
      content_md: data.content_md,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/notes')
  return {}
}

export async function deleteNote(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()

  const { data: sources } = await supabase
    .from('note_sources')
    .select('storage_path')
    .eq('note_id', id)
  if (sources?.length) {
    await supabase.storage
      .from('note-files')
      .remove(sources.map((s) => s.storage_path))
  }

  await supabase.from('notes').delete().eq('id', id)
  revalidatePath('/notes')
  redirect('/notes')
}

export async function deleteSource(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const noteId = String(formData.get('note_id') ?? '')
  if (!id) return

  const supabase = await createClient()
  const { data: src } = await supabase
    .from('note_sources')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (src) await supabase.storage.from('note-files').remove([src.storage_path])
  await supabase.from('note_sources').delete().eq('id', id)
  revalidatePath(`/notes/${noteId}`)
}
