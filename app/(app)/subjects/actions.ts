'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createSubject(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('subjects').insert({ name, user_id: user.id })
  revalidatePath('/subjects')
}

export async function renameSubject(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id || !name) return

  const supabase = await createClient()
  await supabase.from('subjects').update({ name }).eq('id', id)
  revalidatePath('/subjects')
  revalidatePath('/notes')
}

export async function deleteSubject(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  await supabase.from('subjects').delete().eq('id', id)
  revalidatePath('/subjects')
  revalidatePath('/notes')
}
