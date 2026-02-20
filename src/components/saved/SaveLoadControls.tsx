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
            className="font-data text-xs"
            style={{ color: 'var(--success)' }}
          >
            {savedMsg}
          </span>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="font-ui text-xs px-3 py-1.5 rounded transition-all duration-150"
          style={{
            border: '1px solid var(--accent-dim)',
            color: 'var(--accent-text)',
            background: 'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--accent-glow)'
            e.currentTarget.style.borderColor = 'var(--accent)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--accent-dim)'
          }}
          aria-label="Save setup"
        >
          Save Setup
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
        className="font-data text-sm px-2.5 py-1.5 rounded focus:outline-none transition-all w-40"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        aria-label="Setup name"
      />
      <button
        onClick={handleSave}
        disabled={isSaving || !name.trim()}
        className="font-ui text-xs px-3 py-1.5 rounded transition-all"
        style={{
          background: 'var(--accent)',
          color: 'var(--bg)',
          opacity: isSaving || !name.trim() ? 0.5 : 1,
          cursor: isSaving || !name.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="font-ui text-xs transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
      >
        Cancel
      </button>
    </div>
  )
}
