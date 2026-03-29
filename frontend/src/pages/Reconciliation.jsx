import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const MOCK_GST_DATA = {
  'GSTR-2A': [
    { gstin: '27AATFV7270Q1ZX', supplier: 'ABC Traders', invoice_no: 'INV001', date: '2024-01-05', taxable: 50000, igst: 9000, cgst: 0, sgst: 0, status: 'matched' },
    { gstin: '27BBCDE1234F1Z5', supplier: 'XYZ Supplies', invoice_no: 'INV002', date: '2024-01-10', taxable: 30000, igst: 0, cgst: 2700, sgst: 2700, status: 'missing' },
    { gstin: '27CCFGH5678G1Z3', supplier: 'PQR Enterprises', invoice_no: 'INV003', date: '2024-01-15', taxable: 75000, igst: 13500, cgst: 0, sgst: 0, status: 'matched' },
  ],
  'GSTR-2B': [
    { gstin: '27AATFV7270Q1ZX', supplier: 'ABC Traders', invoice_no: 'INV001', date: '2024-01-05', taxable: 50000, igst: 9000, cgst: 0, sgst: 0, itc_available: 'Y' },
    { gstin: '27CCFGH5678G1Z3', supplier: 'PQR Enterprises', invoice_no: 'INV003', date: '2024-01-15', taxable: 75000, igst: 13500, cgst: 0, sgst: 0, itc_available: 'N' },
    { gstin: '27DDIJK9012H1Z1', supplier: 'LMN Corp', invoice_no: 'INV004', date: '2024-01-20', taxable: 20000, igst: 0, cgst: 1800, sgst: 1800, itc_available: 'Y' },
  ],
  'GSTR-1': [
    { gstin: '27EEKLM3456I1Z9', customer: 'Customer A', invoice_no: 'SINV001', date: '2024-01-03', taxable: 100000, igst: 18000, cgst: 0, sgst: 0, status: 'filed' },
    { gstin: '27FFNOP7890J1Z7', customer: 'Customer B', invoice_no: 'SINV002', date: '2024-01-08', taxable: 45000, igst: 0, cgst: 4050, sgst: 4050, status: 'filed' },
    { gstin: '27GGQRS1234K1Z5', customer: 'Customer C', invoice_no: 'SINV003', date: '2024-01-12', taxable: 60000, igst: 10800, cgst: 0, sgst: 0, status: 'pending' },
    { gstin: '27HHTUV5678L1Z3', customer: 'Customer D', invoice_no: 'SINV004', date: '2024-01-18', taxable: 35000, igst: 6300, cgst: 0, sgst: 0, status: 'filed' },
  ],
  'GSTR-3B': [
    { period: 'Jan 2024', total_taxable: 205000, igst_paid: 28800, cgst_paid: 4050, sgst_paid: 4050, itc_claimed: 22500, net_tax: 14400, status: 'filed' },
    { period: 'Dec 2023', total_taxable: 180000, igst_paid: 25000, cgst_paid: 3500, sgst_paid: 3500, itc_claimed: 18000, net_tax: 14000, status: 'filed' },
    { period: 'Nov 2023', total_taxable: 220000, igst_paid: 32000, cgst_paid: 5000, sgst_paid: 5000, itc_claimed: 28000, net_tax: 14000, status: 'filed' },
    { period: 'Oct 2023', total_taxable: 195000, igst_paid: 27000, cgst_paid: 4200, sgst_paid: 4200, itc_claimed: 20000, net_tax: 15400, status: 'filed' },
  ]
}

export default function Reconciliation() {
  const [mainTab, setMainTab] = useState('tally')
  const [gstTab, setGstTab] = useState('GSTR-2A')
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [gstin, setGstin] = useState('')
  const [period, setPeriod] = useState('2024-01')
  const [booksFile, setBooksFile] = useState(null)
  const [partyFile, setPartyFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [gstLoading, setGstLoading] = useState(false)
  const [gstData, setGstData] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/clients/').then(res => setClients(res.data))
  }, [])

  const handleTallySubmit = async (e) => {
    e.preventDefault()
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

  const handleGstFetch = (e) => {
    e.preventDefault()
    setGstLoading(true)
    setGstData(null)
    setTimeout(() => {
      setGstData(MOCK_GST_DATA[gstTab])
      setGstLoading(false)
    }, 1500)
  }

  const statusColor = (status) => {
    if (status === 'matched' || status === 'filed') return 'bg-green-100 text-green-700'
    if (status === 'missing' || status === 'missing_in_party') return 'bg-red-100 text-red-700'
    if (status === 'missing_in_books') return 'bg-orange-100 text-orange-700'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const statusLabel = (status) => {
    if (status === 'matched') return '✅ Matched'
    if (status === 'missing_in_party') return '❌ Missing in Party'
    if (status === 'missing_in_books') return '⚠️ Missing in Books'
    if (status === 'filed') return '✅ Filed'
    if (status === 'pending') return '⏳ Pending'
    if (status === 'missing') return '❌ Missing'
    return status
  }

  const gstSummary = gstData && gstTab !== 'GSTR-3B' ? {
    total: gstData.length,
    taxable: gstData.reduce((s, r) => s + r.taxable, 0),
    igst: gstData.reduce((s, r) => s + r.igst, 0),
    cgst: gstData.reduce((s, r) => s + (r.cgst || 0), 0),
    sgst: gstData.reduce((s, r) => s + (r.sgst || 0), 0),
  } : null

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaxMind Recon</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/dashboard')} className="hover:underline text-sm">Dashboard</button>
          <button onClick={() => navigate('/clients')} className="hover:underline text-sm">Clients</button>
          <button onClick={() => navigate('/gst-recon')} className="hover:underline text-sm">GST Recon</button>
          <span className="text-sm">{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="bg-white text-blue-600 px-4 py-1 rounded font-semibold text-sm">Logout</button>
        </div>
      </nav>

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Reconciliation</h2>

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMainTab('tally')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${mainTab === 'tally' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            📊 Tally Reconciliation
          </button>
          <button onClick={() => setMainTab('gst')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${mainTab === 'gst' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            🏛️ GST Returns
          </button>
        </div>

        {/* Tally Tab */}
        {mainTab === 'tally' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Upload Books vs Party Statement</h3>
              <form onSubmit={handleTallySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                  <select value={clientId} onChange={e => setClientId(e.target.value)} required
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📚 Books File</label>
                    <input type="file" accept=".xlsx,.csv" onChange={e => setBooksFile(e.target.files[0])} required className="w-full border rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📄 Party Statement</label>
                    <input type="file" accept=".xlsx,.csv" onChange={e => setPartyFile(e.target.files[0])} required className="w-full border rounded-lg px-4 py-2" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
                  {loading ? '⏳ Running...' : '🔍 Run Reconciliation'}
                </button>
              </form>
            </div>
            {result && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{result.matched_count}</p>
                    <p className="text-sm text-green-700">✅ Matched</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{result.missing_in_party}</p>
                    <p className="text-sm text-red-700">❌ Missing in Party</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{result.missing_in_books}</p>
                    <p className="text-sm text-orange-700">⚠️ Missing in Books</p>
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
        )}

        {/* GST Tab */}
        {mainTab === 'gst' && (
          <div>
            {/* GST Sub Tabs */}
            <div className="flex gap-2 mb-6">
              {['GSTR-2A', 'GSTR-2B', 'GSTR-1', 'GSTR-3B'].map(tab => (
                <button key={tab} onClick={() => { setGstTab(tab); setGstData(null) }}
                  className={`px-5 py-2 rounded-lg font-semibold transition ${gstTab === tab ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {tab}
                  <span className="block text-xs font-normal">
                    {tab === 'GSTR-2A' ? 'Purchase (Supplier)' : tab === 'GSTR-2B' ? 'ITC Available' : tab === 'GSTR-1' ? 'Sales (Outward)' : 'Monthly Summary'}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">🔴 Mock Data</span>
                <span className="text-sm text-gray-500">Real GST API integration pending</span>
              </div>
              <h3 className="text-lg font-semibold mb-4">Fetch {gstTab} from GST Portal</h3>
              <form onSubmit={handleGstFetch} className="flex gap-4 items-end flex-wrap">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input value={gstin} onChange={e => setGstin(e.target.value)} placeholder="27AATFV7270Q1ZX" required
                    className="border rounded-lg px-4 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <input type="month" value={period} onChange={e => setPeriod(e.target.value)} required
                    className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <button type="submit" disabled={gstLoading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold">
                  {gstLoading ? '⏳ Fetching...' : '🌐 Fetch from Portal'}
                </button>
              </form>
            </div>

            {gstLoading && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-500">Fetching {gstTab} from GST Portal...</p>
              </div>
            )}

            {/* GSTR-1 Results */}
            {gstData && gstTab === 'GSTR-1' && (
              <div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{gstData.length}</p>
                    <p className="text-sm text-blue-700">Total Invoices</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{gstData.filter(r => r.status === 'filed').length}</p>
                    <p className="text-sm text-green-700">✅ Filed</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{gstData.filter(r => r.status === 'pending').length}</p>
                    <p className="text-sm text-yellow-700">⏳ Pending</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">₹{gstData.reduce((s, r) => s + r.taxable, 0).toLocaleString()}</p>
                    <p className="text-sm text-purple-700">Total Taxable</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50 flex justify-between">
                    <h3 className="font-semibold">GSTR-1 — Outward Sales — {period}</h3>
                    <span className="text-sm text-gray-500">{gstData.length} invoices</span>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Customer GSTIN</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Invoice No</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Date</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Taxable</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">IGST</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">CGST</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">SGST</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gstData.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs font-mono">{r.gstin}</td>
                          <td className="px-4 py-3 text-sm">{r.customer}</td>
                          <td className="px-4 py-3 text-sm font-medium">{r.invoice_no}</td>
                          <td className="px-4 py-3 text-sm">{r.date}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">₹{r.taxable.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right">{r.igst > 0 ? `₹${r.igst.toLocaleString()}` : '—'}</td>
                          <td className="px-4 py-3 text-sm text-right">{r.cgst > 0 ? `₹${r.cgst.toLocaleString()}` : '—'}</td>
                          <td className="px-4 py-3 text-sm text-right">{r.sgst > 0 ? `₹${r.sgst.toLocaleString()}` : '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                              {statusLabel(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-sm font-semibold">Total</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">₹{gstData.reduce((s,r) => s+r.taxable,0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">₹{gstData.reduce((s,r) => s+r.igst,0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">₹{gstData.reduce((s,r) => s+(r.cgst||0),0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">₹{gstData.reduce((s,r) => s+(r.sgst||0),0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* GSTR-3B Results */}
            {gstData && gstTab === 'GSTR-3B' && (
              <div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">₹{gstData.reduce((s,r) => s+r.total_taxable,0).toLocaleString()}</p>
                    <p className="text-sm text-blue-700">Total Taxable</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">₹{gstData.reduce((s,r) => s+r.igst_paid+r.cgst_paid+r.sgst_paid,0).toLocaleString()}</p>
                    <p className="text-sm text-red-700">Total Tax Paid</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">₹{gstData.reduce((s,r) => s+r.itc_claimed,0).toLocaleString()}</p>
                    <p className="text-sm text-green-700">Total ITC Claimed</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">₹{gstData.reduce((s,r) => s+r.net_tax,0).toLocaleString()}</p>
                    <p className="text-sm text-orange-700">Net Tax Paid</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="font-semibold">GSTR-3B — Monthly Summary</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600">Period</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600">Total Taxable</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600">IGST Paid</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600">CGST Paid</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600">SGST Paid</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600">ITC Claimed</th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600">Net Tax</th>
                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gstData.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{r.period}</td>
                          <td className="px-6 py-4 text-right">₹{r.total_taxable.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">₹{r.igst_paid.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">₹{r.cgst_paid.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">₹{r.sgst_paid.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-green-600 font-medium">₹{r.itc_claimed.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-red-600">₹{r.net_tax.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                              {statusLabel(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                      <tr>
                        <td className="px-6 py-3 font-bold">Total</td>
                        <td className="px-6 py-3 text-right font-bold">₹{gstData.reduce((s,r)=>s+r.total_taxable,0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-bold">₹{gstData.reduce((s,r)=>s+r.igst_paid,0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-bold">₹{gstData.reduce((s,r)=>s+r.cgst_paid,0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-bold">₹{gstData.reduce((s,r)=>s+r.sgst_paid,0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-bold text-green-600">₹{gstData.reduce((s,r)=>s+r.itc_claimed,0).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-bold text-red-600">₹{gstData.reduce((s,r)=>s+r.net_tax,0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* GSTR-2A / 2B Results */}
            {gstData && (gstTab === 'GSTR-2A' || gstTab === 'GSTR-2B') && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between">
                  <h3 className="font-semibold">{gstTab} — {period}</h3>
                  <span className="text-sm text-gray-500">{gstData.length} records</span>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">GSTIN</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Supplier</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Invoice No</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Taxable</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">IGST</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">CGST+SGST</th>
                      {gstTab === 'GSTR-2B' && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">ITC</th>}
                      {gstTab === 'GSTR-2A' && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Status</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gstData.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-mono">{r.gstin}</td>
                        <td className="px-4 py-3 text-sm">{r.supplier}</td>
                        <td className="px-4 py-3 text-sm">{r.invoice_no}</td>
                        <td className="px-4 py-3 text-sm">{r.date}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">₹{r.taxable.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right">{r.igst > 0 ? `₹${r.igst.toLocaleString()}` : '—'}</td>
                        <td className="px-4 py-3 text-sm text-right">{(r.cgst||0) > 0 ? `₹${((r.cgst||0)+(r.sgst||0)).toLocaleString()}` : '—'}</td>
                        {gstTab === 'GSTR-2B' && (
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.itc_available === 'Y' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {r.itc_available === 'Y' ? '✅ Available' : '🚫 Blocked'}
                            </span>
                          </td>
                        )}
                        {gstTab === 'GSTR-2A' && (
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                              {statusLabel(r.status)}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
