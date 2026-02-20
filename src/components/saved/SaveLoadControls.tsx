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
      <div className="flex items-center gap-3">
        {savedMsg && (
          <span className="font-data text-xs text-green-400">{savedMsg}</span>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="font-display text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded border border-signal/50 text-signal-hi hover:bg-signal hover:text-white hover:border-signal transition-all"
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
        className="bg-lift border border-line rounded px-2.5 py-1.5 font-data text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal placeholder:text-muted-txt w-44 transition-colors"
        aria-label="Setup name"
      />
      <button
        onClick={handleSave}
        disabled={isSaving || !name.trim()}
        className="font-display text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded bg-signal text-white hover:bg-signal-hi disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="font-data text-xs text-muted-txt hover:text-gray-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
