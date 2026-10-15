#!/usr/bin/env bash
# Migrasi class Tailwind zinc-* → semantic design tokens.
# Urutan penting: pola paling spesifik (dengan modifier opacity) lebih dulu.
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=$(find src -type f \( -name '*.tsx' -o -name '*.ts' \))

apply() {
  local from="$1" to="$2"
  # escape untuk sed basic regex
  local esc_from esc_to
  esc_from=$(printf '%s' "$from" | sed -e 's/[.[\*^$\/]/\\&/g')
  esc_to=$(printf '%s' "$to" | sed -e 's/[&\/]/\\&/g')
  # shellcheck disable=SC2086
  sed -i "s/${esc_from}/${esc_to}/g" $FILES
}

# --- Background surfaces ---
apply 'bg-zinc-950/85'  'bg-surface-0/85'
apply 'bg-zinc-950/80'  'bg-surface-1/80'
apply 'bg-zinc-950/70'  'bg-surface-1/70'
apply 'bg-zinc-950/50'  'bg-surface-2/50'
apply 'bg-zinc-950/40'  'bg-surface-2/40'
apply 'bg-zinc-950'     'bg-surface-0'
apply 'bg-zinc-900/95'  'bg-surface-1/95'
apply 'bg-zinc-900/70'  'bg-surface-1/70'
apply 'bg-zinc-900/60'  'bg-surface-1/60'
apply 'bg-zinc-900'     'bg-surface-1'
apply 'bg-zinc-800/70'  'bg-surface-2/70'
apply 'bg-zinc-800/60'  'bg-surface-2/60'
apply 'bg-zinc-800/40'  'bg-surface-2/40'
apply 'bg-zinc-800/30'  'bg-surface-2/30'
apply 'bg-zinc-800'     'bg-surface-2'
apply 'bg-zinc-700'     'bg-surface-3'

# --- Borders ---
apply 'border-zinc-800/70' 'border-line/70'
apply 'border-zinc-800/60' 'border-line/60'
apply 'border-zinc-800'    'border-line'
apply 'border-zinc-700/40' 'border-line-strong/40'
apply 'border-zinc-700'    'border-line-strong'
apply 'border-white/5'     'border-line'

# --- Text ---
apply 'text-zinc-50'       'text-ink-strong'
apply 'text-zinc-100'      'text-ink-strong'
apply 'text-zinc-200'      'text-ink'
apply 'text-zinc-300'      'text-ink'
apply 'text-zinc-400'      'text-ink-muted'
apply 'text-zinc-500'      'text-ink-faint'
apply 'text-zinc-600'      'text-ink-faintest'
apply 'text-zinc-700'      'text-ink-faintest'
apply 'placeholder-zinc-600' 'placeholder:text-ink-faintest'

# --- Divide / ring / gradient ---
apply 'divide-zinc-800'    'divide-line'
apply 'ring-zinc-800'      'ring-line'
apply 'from-zinc-700'      'from-surface-3'
apply 'to-zinc-800'        'to-surface-2'
apply 'from-zinc-800'      'from-surface-2'

# --- Callout text yang butuh kontras di kedua tema ---
for c in rose amber sky emerald violet; do
  apply "text-${c}-200/80" "text-${c}-600 dark:text-${c}-200"
  apply "text-${c}-200/90" "text-${c}-600 dark:text-${c}-200"
done

echo "migrasi selesai"
grep -rno 'zinc-[0-9]' src --include='*.tsx' --include='*.ts' | head -20 || true
