interface SuggestionButtonsProps {
  suggestions: string[]
  onSelect: (text: string) => void
  disabled: boolean
}

export default function SuggestionButtons({ suggestions, onSelect, disabled }: SuggestionButtonsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((text, i) => (
        <button
          key={i}
          onClick={() => onSelect(text)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full text-sm border border-border bg-card text-foreground hover:bg-accent hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
