import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <h1 className="text-4xl font-bold text-gray-100 mb-4">ThrustCurves</h1>
      <p className="text-gray-400 text-lg mb-8">
        Generate thrust curves for cars using OEM specs, apply modifications,
        and compare performance setups.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          to="/simulator"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
        >
          Open Simulator
        </Link>
        <Link
          to="/saved"
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 font-medium rounded-lg transition-colors"
        >
          Saved Configs
        </Link>
      </div>
    </div>
  )
}
