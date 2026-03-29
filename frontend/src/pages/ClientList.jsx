import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [gstin, setGstin] = useState('')
  const [pan, setPan] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const fetchClients = async () => {
    const res = await api.get('/clients/')
    setClients(res.data)
  }

  useEffect(() => { fetchClients() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setLoading(true)
    await api.post('/clients/', { name, gstin, pan })
    setName(''); setGstin(''); setPan('')
    setShowForm(false)
    setLoading(false)
    fetchClients()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    await api.delete(`/clients/${id}`)
    fetchClients()
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaxMind Recon</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/dashboard')} className="hover:underline">Dashboard</button>
          <span>{user?.email}</span>
          <button onClick={handleLogout} className="bg-white text-blue-600 px-4 py-1 rounded font-semibold">Logout</button>
        </div>
      </nav>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Clients</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Add Client
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">New Client</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Client Name *" required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={gstin} onChange={e => setGstin(e.target.value)} placeholder="GSTIN (optional)"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={pan} onChange={e => setPan(e.target.value)} placeholder="PAN (optional)"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Client'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
            <p className="text-lg">No clients yet</p>
            <p className="text-sm mt-1">Click "+ Add Client" to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">GSTIN</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">PAN</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{c.name}</td>
                    <td className="px-6 py-4 text-gray-500">{c.gstin || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{c.pan || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
