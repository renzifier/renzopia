import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { btn } from '@/lib/ui'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/subjects', label: 'Subjects' },
  { href: '/notes', label: 'Notes' },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
      <aside className="flex shrink-0 items-center gap-3 border-b border-neutral-500/30 p-3 md:w-56 md:flex-col md:items-stretch md:border-b-0 md:border-r md:p-4">
        <div className="hidden px-3 pb-2 font-semibold md:block">Study</div>

        <nav className="flex flex-1 gap-1 md:flex-none md:flex-col">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-2 text-sm hover:bg-neutral-500/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:mt-auto md:flex-col md:items-stretch">
          <p className="hidden truncate px-1 text-xs opacity-60 md:block">
            {user.email}
          </p>
          <form action={signOut}>
            <button className={`${btn} w-full`}>Sign out</button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  )
}
