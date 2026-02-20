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
          <span className="text-xs text-green-400">{savedMsg}</span>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="text-xs px-3 py-1 rounded border border-indigo-600 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
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
        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-500 w-40"
        aria-label="Setup name"
      />
      <button
        onClick={handleSave}
        disabled={isSaving || !name.trim()}
        className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="text-xs text-gray-500 hover:text-gray-300"
      >
        Cancel
      </button>
    </div>
  )
}
