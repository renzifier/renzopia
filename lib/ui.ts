export const input =
  'w-full rounded border border-neutral-500/40 bg-transparent px-3 py-2 outline-none focus:border-blue-500 [color-scheme:light_dark]'
export const btn =
  'rounded border border-neutral-500/40 px-3 py-2 text-sm hover:bg-neutral-500/10 disabled:opacity-50'
export const btnPrimary =
  'rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50'
export const btnDanger =
  'rounded border border-red-500/50 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10'
export const card = 'rounded-lg border border-neutral-500/30 p-4'

export const chip = (active: boolean) =>
  'rounded-full border px-3 py-1 text-sm ' +
  (active
    ? 'border-blue-500 bg-blue-600 text-white'
    : 'border-neutral-500/40 hover:bg-neutral-500/10')

export function fmtSize(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
