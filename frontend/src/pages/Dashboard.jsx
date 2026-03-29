import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaxMind Recon</h1>
        <div className="flex items-center gap-4">
          <span>{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="bg-white text-blue-600 px-4 py-1 rounded font-semibold">Logout</button>
        </div>
      </nav>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Clients</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Recon Runs</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">0</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => navigate('/clients')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-blue-600">👥 Clients</h3>
            <p className="text-gray-500 text-sm mt-1">Manage your CA firm clients</p>
          </button>
          <button onClick={() => navigate('/reconciliation')}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-green-600">📊 Reconciliation</h3>
            <p className="text-gray-500 text-sm mt-1">Upload and match transactions</p>
          </button>
        </div>
      </div>
    </div>
  )
}
