interface ThemePickerProps {
  theme: 'light' | 'dark'
  accent: 'blue' | 'violet' | 'teal' | 'orange'
  onThemeChange: (theme: 'light' | 'dark') => void
  onAccentChange: (accent: 'blue' | 'violet' | 'teal' | 'orange') => void
}

const ACCENTS: { key: 'blue' | 'violet' | 'teal' | 'orange'; color: string }[] = [
  { key: 'blue', color: '#2563eb' },
  { key: 'violet', color: '#7c3aed' },
  { key: 'teal', color: '#0d9488' },
  { key: 'orange', color: '#ea580c' },
]

export default function ThemePicker({ theme, accent, onThemeChange, onAccentChange }: ThemePickerProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Theme toggle */}
      <button
        onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
        className="px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-card text-foreground hover:bg-accent transition-colors"
      >
        {theme === 'light' ? 'Light' : 'Dark'}
      </button>

      {/* Accent swatches */}
      <div className="flex gap-1.5">
        {ACCENTS.map((a) => (
          <button
            key={a.key}
            onClick={() => onAccentChange(a.key)}
            className={`w-5 h-5 rounded-full border-2 transition-transform ${
              accent === a.key ? 'border-foreground scale-110' : 'border-transparent'
            }`}
            style={{ background: a.color }}
            title={a.key}
          />
        ))}
      </div>
    </div>
  )
}
