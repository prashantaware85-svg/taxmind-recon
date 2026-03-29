import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function Reconciliation() {
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [booksFile, setBooksFile] = useState(null)
  const [partyFile, setPartyFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/clients/').then(res => setClients(res.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clientId || !booksFile || !partyFile) return
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('client_id', clientId)
      formData.append('books_file', booksFile)
      formData.append('party_file', partyFile)
      const res = await api.post('/reconciliation/', formData)
      setResult(res.data)
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || 'Something went wrong'))
    }
    setLoading(false)
  }

  const statusColor = (status) => {
    if (status === 'matched') return 'bg-green-100 text-green-700'
    if (status === 'missing_in_party') return 'bg-red-100 text-red-700'
    if (status === 'missing_in_books') return 'bg-orange-100 text-orange-700'
    return 'bg-gray-100 text-gray-700'
  }

  const statusLabel = (status) => {
    if (status === 'matched') return '✅ Matched'
    if (status === 'missing_in_party') return '❌ Missing in Party'
    if (status === 'missing_in_books') return '⚠️ Missing in Books'
    return status
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaxMind Recon</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/dashboard')} className="hover:underline">Dashboard</button>
          <button onClick={() => navigate('/clients')} className="hover:underline">Clients</button>
          <span>{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="bg-white text-blue-600 px-4 py-1 rounded font-semibold">Logout</button>
        </div>
      </nav>

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Reconciliation</h2>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} required
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Select Client --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Books File (Excel/CSV)</label>
              <input type="file" accept=".xlsx,.csv" onChange={e => setBooksFile(e.target.files[0])} required
                className="w-full border rounded-lg px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Statement (Excel/CSV)</label>
              <input type="file" accept=".xlsx,.csv" onChange={e => setPartyFile(e.target.files[0])} required
                className="w-full border rounded-lg px-4 py-2" />
            </div>
            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
              {loading ? 'Running Reconciliation...' : '🔍 Run Reconciliation'}
            </button>
          </form>
        </div>

        {result && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{result.matched_count}</p>
                <p className="text-sm text-green-700">Matched</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{result.missing_in_party}</p>
                <p className="text-sm text-red-700">Missing in Party</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{result.missing_in_books}</p>
                <p className="text-sm text-orange-700">Missing in Books</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Reference</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.results.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">{r.date}</td>
                      <td className="px-6 py-3 text-sm font-medium">₹{Number(r.amount).toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{r.reference || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
