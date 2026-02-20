import { useState } from 'react'
import { useCarStore } from '@/store/carStore'
import { usePersistenceStore } from '@/store/persistenceStore'

interface SaveLoadControlsProps {
  carId: string
}

export default function SaveLoadControls({ carId }: SaveLoadControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const modifications = useCarStore(state => state.modifications)
  const saveSetup = usePersistenceStore(state => state.saveSetup)

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSaving(true)
    try {
      await saveSetup(trimmed, carId, modifications)
      setSavedMsg(`Saved "${trimmed}"`)
      setName('')
      setIsOpen(false)
      setTimeout(() => setSavedMsg(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2">
        {savedMsg && (
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-success)' }}
          >
            {savedMsg}
          </span>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="text-xs px-3 py-1 rounded transition-colors"
          style={{
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.06em',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--color-accent)'
            e.currentTarget.style.color = '#000'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-accent)'
          }}
          aria-label="Save setup"
        >
          SAVE SETUP
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Setup name…"
        autoFocus
        className="rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-1"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-1)',
          fontFamily: 'var(--font-mono)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        aria-label="Setup name"
      />
      <button
        onClick={handleSave}
        disabled={isSaving || !name.trim()}
        className="text-xs px-3 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--color-accent)',
          color: '#000',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.06em',
        }}
      >
        {isSaving ? 'SAVING…' : 'SAVE'}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="text-xs"
        style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-display)' }}
      >
        Cancel
      </button>
    </div>
  )
}
