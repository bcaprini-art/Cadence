import { useEffect, useRef } from 'react'
import { format } from 'date-fns'

/**
 * CoachPrompts
 * Props:
 *   prompts          : array from backend (headline, summary, details, severity, window, score, actionLabel)
 *   smartSuggestions : array from backend CARA smart suggestions
 *   onSelect         : (window: { start, end }) => void — called when coach picks a slot
 *   onSmartAction    : ({ type, altDurationMinutes?, excludeAthletes? }) => void
 */
export default function CoachPrompts({ prompts = [], smartSuggestions = [], onSelect, onSmartAction }) {
  const containerRef = useRef(null)

  // Animate cards in on mount / update
  useEffect(() => {
    if (!containerRef.current) return
    const cards = containerRef.current.querySelectorAll('[data-card]')
    cards.forEach((card, i) => {
      card.style.opacity = '0'
      card.style.transform = 'translateY(12px)'
      setTimeout(() => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
        card.style.opacity = '1'
        card.style.transform = 'translateY(0)'
      }, i * 90)
    })
  }, [prompts])

  if ((!prompts || prompts.length === 0) && (!smartSuggestions || smartSuggestions.length === 0)) return null

  return (
    <div ref={containerRef} className="space-y-3">
      {prompts.map((prompt, i) => (
        <PromptCard
          key={i}
          prompt={prompt}
          isBest={prompt.severity !== 'blocked' && i === 1 && prompts.length > 1}
          onSelect={onSelect}
        />
      ))}

      {smartSuggestions && smartSuggestions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 flex items-center gap-1.5">
            <span>🧠</span> CARA Smart Suggestions
          </p>
          <div className="space-y-2">
            {smartSuggestions.map((s, i) => (
              <SmartSuggestionCard key={i} suggestion={s} onAction={onSmartAction} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SmartSuggestionCard({ suggestion, onAction }) {
  const { type, label, description, altDurationMinutes, excludeAthletes } = suggestion

  return (
    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-300">{label}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
          {type === 'exclude' && excludeAthletes && excludeAthletes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {excludeAthletes.map((a) => (
                <span key={a.id} className="text-xs bg-orange-500/15 text-orange-300 px-2 py-0.5 rounded-full">
                  {a.name} ({a.currentHours}h)
                </span>
              ))}
            </div>
          )}
        </div>
        {onAction && (
          <button
            onClick={() => onAction(suggestion)}
            className="flex-shrink-0 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  )
}

function PromptCard({ prompt, isBest, onSelect }) {
  const { headline, summary, details = [], severity, window: w, score, actionLabel } = prompt

  // Style map by severity
  const borderClass = {
    clear: 'border-green-500/50',
    warning: 'border-yellow-500/40',
    blocked: 'border-red-500/50',
  }[severity] ?? 'border-white/10'

  const bgClass = {
    clear: 'bg-green-500/5',
    warning: 'bg-yellow-500/5',
    blocked: 'bg-red-500/5',
  }[severity] ?? 'bg-white/5'

  const headlineColor = {
    clear: 'text-green-400',
    warning: 'text-yellow-400',
    blocked: 'text-red-400',
  }[severity] ?? 'text-white'

  const btnClass =
    severity === 'clear'
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : severity === 'warning'
      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
      : 'bg-gray-600 text-gray-300 cursor-not-allowed'

  const canSelect = severity !== 'blocked' && !!w && !!actionLabel

  return (
    <div
      data-card
      className={`
        rounded-xl border p-5 transition-shadow
        ${borderClass} ${bgClass}
        ${isBest ? 'ring-1 ring-green-500/30 shadow-lg shadow-green-500/10 scale-[1.01]' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className={`font-semibold text-base leading-snug ${headlineColor}`}>
            {headline}
          </h3>
          {isBest && (
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              ⭐ Recommended
            </span>
          )}
        </div>
        {score > 0 && (
          <div className="text-right shrink-0">
            <div className={`text-lg font-bold ${severity === 'clear' ? 'text-green-400' : severity === 'warning' ? 'text-yellow-400' : 'text-gray-500'}`}>
              {score}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">score</div>
          </div>
        )}
      </div>

      {/* Window times */}
      {w && (
        <p className="text-xs text-gray-400 mb-2 font-mono">
          {format(new Date(w.start), 'EEE MMM d')} · {format(new Date(w.start), 'h:mm a')} – {format(new Date(w.end), 'h:mm a')}
        </p>
      )}

      {/* Summary */}
      <p className="text-sm text-gray-300 mb-3 leading-relaxed">{summary}</p>

      {/* Detail bullets */}
      {details.length > 0 && (
        <ul className="space-y-1 mb-4">
          {details.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="mt-0.5 shrink-0 text-gray-600">•</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Action button */}
      {canSelect && (
        <button
          onClick={() => onSelect && onSelect(w)}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${btnClass}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
