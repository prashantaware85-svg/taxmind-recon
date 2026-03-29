import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useAuth } from '../contexts/AuthContext'

const MOCK_GSTR2A = [
  { gstin: '27AABCU9603R1ZX', supplier: 'ABC Traders Pvt Ltd', invoice_no: 'INV-001', date: '2024-01-05', taxable: 50000, igst: 9000, cgst: 0, sgst: 0 },
  { gstin: '27AACCM9716D1ZN', supplier: 'XYZ Supplies', invoice_no: 'INV-002', date: '2024-01-10', taxable: 30000, igst: 0, cgst: 2700, sgst: 2700 },
  { gstin: '27AADCB2230M1ZV', supplier: 'PQR Enterprises', invoice_no: 'INV-003', date: '2024-01-15', taxable: 75000, igst: 13500, cgst: 0, sgst: 0 },
  { gstin: '27AAEPM9895G1ZQ', supplier: 'LMN Corporation', invoice_no: 'INV-005', date: '2024-01-22', taxable: 40000, igst: 7200, cgst: 0, sgst: 0 },
]

const MOCK_GSTR2B = [
  { gstin: '27AABCU9603R1ZX', supplier: 'ABC Traders Pvt Ltd', invoice_no: 'INV-001', date: '2024-01-05', taxable: 50000, igst: 9000, cgst: 0, sgst: 0, itc: 'Y' },
  { gstin: '27AADCB2230M1ZV', supplier: 'PQR Enterprises', invoice_no: 'INV-003', date: '2024-01-15', taxable: 75000, igst: 13500, cgst: 0, sgst: 0, itc: 'N' },
  { gstin: '27AAEPM9895G1ZQ', supplier: 'LMN Corporation', invoice_no: 'INV-005', date: '2024-01-22', taxable: 40000, igst: 7200, cgst: 0, sgst: 0, itc: 'Y' },
  { gstin: '27AAFRS1234K1ZP', supplier: 'New Supplier', invoice_no: 'INV-006', date: '2024-01-25', taxable: 20000, igst: 3600, cgst: 0, sgst: 0, itc: 'Y' },
]

function matchRecords(tally, gst, type) {
  const results = []
  const gstUsed = new Set()

  // Match each tally entry with GST
  for (const t of tally) {
    const matchIdx = gst.findIndex((g, i) =>
      !gstUsed.has(i) &&
      g.gstin?.trim() === t.gstin?.trim() &&
      g.invoice_no?.trim() === t.invoice_no?.trim()
    )

    if (matchIdx !== -1) {
      gstUsed.add(matchIdx)
      const g = gst[matchIdx]
      const amtDiff = Math.abs(Number(t.taxable) - Number(g.taxable))
      results.push({
        ...t,
        gst_taxable: g.taxable,
        gst_igst: g.igst,
        gst_cgst: g.cgst,
        gst_sgst: g.sgst,
        itc: type === '2B' ? g.itc : null,
        status: amtDiff < 1 ? 'matched' : 'mismatch',
        diff: amtDiff
      })
    } else {
      results.push({ ...t, status: 'missing_in_gst', diff: 0 })
    }
  }

  // Missing in Tally (in GST but not in Tally)
  gst.forEach((g, i) => {
    if (!gstUsed.has(i)) {
      results.push({ ...g, status: 'missing_in_tally', diff: 0 })
    }
  })

  return results
}

export default function GSTRecon() {
  const [gstType, setGstType] = useState('2A')
  const [period, setPeriod] = useState('2024-01')
  const [gstin, setGstin] = useState('')
  const [tallyData, setTallyData] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws)
      const normalized = data.map(row => ({
        gstin: String(row['GSTIN'] || row['gstin'] || '').trim(),
        supplier: String(row['Supplier'] || row['supplier'] || row['Party Name'] || '').trim(),
        invoice_no: String(row['Invoice No'] || row['invoice_no'] || row['Voucher No'] || '').trim(),
        date: String(row['Date'] || row['date'] || '').trim(),
        taxable: Number(row['Taxable'] || row['taxable'] || row['Taxable Amount'] || 0),
        igst: Number(row['IGST'] || row['igst'] || 0),
        cgst: Number(row['CGST'] || row['cgst'] || 0),
        sgst: Number(row['SGST'] || row['sgst'] || 0),
      }))
      setTallyData(normalized)
      setStep(2)
    }
    reader.readAsBinaryString(file)
  }

  const handleFetchAndMatch = (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      const gstData = gstType === '2A' ? MOCK_GSTR2A : MOCK_GSTR2B
      const matched = matchRecords(tallyData, gstData, gstType)
      setResult(matched)
      setLoading(false)
      setStep(3)
    }, 1500)
  }

  const summary = result ? {
    matched: result.filter(r => r.status === 'matched').length,
    mismatch: result.filter(r => r.status === 'mismatch').length,
    missing_gst: result.filter(r => r.status === 'missing_in_gst').length,
    missing_tally: result.filter(r => r.status === 'missing_in_tally').length,
    itc_available: result.filter(r => r.itc === 'Y').length,
    itc_blocked: result.filter(r => r.itc === 'N').length,
  } : null

  const statusColor = (s) => ({
    matched: 'bg-green-100 text-green-700',
    mismatch: 'bg-yellow-100 text-yellow-700',
    missing_in_gst: 'bg-red-100 text-red-700',
    missing_in_tally: 'bg-orange-100 text-orange-700',
  }[s] || 'bg-gray-100 text-gray-600')

  const statusLabel = (s) => ({
    matched: '✅ Matched',
    mismatch: '⚠️ Amount Mismatch',
    missing_in_gst: '❌ Missing in GST Portal',
    missing_in_tally: '📋 Missing in Tally',
  }[s] || s)

  const downloadSample = () => {
    const sample = [
      { GSTIN: '27AABCU9603R1ZX', Supplier: 'ABC Traders Pvt Ltd', 'Invoice No': 'INV-001', Date: '2024-01-05', Taxable: 50000, IGST: 9000, CGST: 0, SGST: 0 },
      { GSTIN: '27AACCM9716D1ZN', Supplier: 'XYZ Supplies', 'Invoice No': 'INV-002', Date: '2024-01-10', Taxable: 30000, IGST: 0, CGST: 2700, SGST: 2700 },
      { GSTIN: '27AADCB2230M1ZV', Supplier: 'PQR Enterprises', 'Invoice No': 'INV-003', Date: '2024-01-15', Taxable: 75000, IGST: 13500, CGST: 0, SGST: 0 },
      { GSTIN: '27ZZZZZ9999Z1ZZ', Supplier: 'Extra in Tally', 'Invoice No': 'INV-004', Date: '2024-01-18', Taxable: 20000, IGST: 3600, CGST: 0, SGST: 0 },
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(sample)
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Register')
    XLSX.writeFile(wb, 'tally_purchase_sample.xlsx')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaxMind Recon</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/dashboard')} className="hover:underline text-sm">Dashboard</button>
          <button onClick={() => navigate('/clients')} className="hover:underline text-sm">Clients</button>
          <button onClick={() => navigate('/reconciliation')} className="hover:underline text-sm">Recon</button>
          <span className="text-sm">{user?.email}</span>
          <button onClick={() => { logout(); navigate('/login') }} className="bg-white text-blue-600 px-3 py-1 rounded font-semibold text-sm">Logout</button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold">GST Reconciliation</h2>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Tally vs GST Portal</span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Upload Tally' },
            { n: 2, label: 'Fetch GST Portal' },
            { n: 3, label: 'View Results' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={`text-sm font-medium ${step >= s.n ? 'text-blue-600' : 'text-gray-400'}`}>{s.label}</span>
              {i < 2 && <div className={`w-12 h-0.5 ${step > s.n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload Tally */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-1">Step 1: Upload Tally Purchase Register</h3>
          <p className="text-sm text-gray-500 mb-4">Tally मधून Purchase Register Excel export करा आणि upload करा</p>

          <div className="flex gap-4 items-center">
            <label className="cursor-pointer bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg px-6 py-4 hover:bg-blue-100 transition">
              <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" />
              <div className="text-center">
                <div className="text-2xl mb-1">📂</div>
                <p className="text-sm font-medium text-blue-600">Click to Upload Excel</p>
                <p className="text-xs text-gray-400">.xlsx or .csv</p>
              </div>
            </label>

            <button onClick={downloadSample}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium">
              📥 Download Sample Format
            </button>

            {tallyData && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <p className="text-green-700 font-medium text-sm">✅ {tallyData.length} records loaded</p>
                <p className="text-green-600 text-xs">Tally data ready</p>
              </div>
            )}
          </div>

          {tallyData && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['GSTIN', 'Supplier', 'Invoice No', 'Date', 'Taxable', 'IGST', 'CGST', 'SGST'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tallyData.slice(0, 5).map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{r.gstin}</td>
                      <td className="px-3 py-2">{r.supplier}</td>
                      <td className="px-3 py-2">{r.invoice_no}</td>
                      <td className="px-3 py-2">{r.date}</td>
                      <td className="px-3 py-2 text-right">₹{Number(r.taxable).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{r.igst > 0 ? `₹${r.igst.toLocaleString()}` : '—'}</td>
                      <td className="px-3 py-2 text-right">{r.cgst > 0 ? `₹${r.cgst.toLocaleString()}` : '—'}</td>
                      <td className="px-3 py-2 text-right">{r.sgst > 0 ? `₹${r.sgst.toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tallyData.length > 5 && <p className="text-xs text-gray-400 mt-1 px-3">...आणि {tallyData.length - 5} records</p>}
            </div>
          )}
        </div>

        {/* Step 2: Fetch GST */}
        {tallyData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-1">Step 2: GST Portal वरून Data Fetch करा</h3>
            <p className="text-sm text-gray-500 mb-4">GSTIN आणि period select करा — GSTR-2A/2B fetch होईल</p>

            <form onSubmit={handleFetchAndMatch} className="space-y-4">
              {/* GST Type */}
              <div className="flex gap-3">
                {['2A', '2B'].map(t => (
                  <button key={t} type="button" onClick={() => setGstType(t)}
                    className={`px-6 py-3 rounded-lg font-semibold border-2 transition ${gstType === t ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <div className="text-lg">GSTR-{t}</div>
                    <div className="text-xs font-normal">{t === '2A' ? 'Supplier Filed' : 'ITC Available'}</div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input value={gstin} onChange={e => setGstin(e.target.value)}
                    placeholder="27AATFV7270Q1ZX" required
                    className="border rounded-lg px-4 py-2 w-52 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <input type="month" value={period} onChange={e => setPeriod(e.target.value)} required
                    className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold flex items-center gap-2">
                {loading ? '⏳ Fetching & Matching...' : '🌐 Fetch from GST Portal & Match'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Results */}
        {result && summary && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{summary.matched}</p>
                <p className="text-sm text-green-700">✅ Matched</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{summary.mismatch}</p>
                <p className="text-sm text-yellow-700">⚠️ Amount Mismatch</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{summary.missing_gst}</p>
                <p className="text-sm text-red-700">❌ Missing in GST</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{summary.missing_tally}</p>
                <p className="text-sm text-orange-700">📋 Missing in Tally</p>
              </div>
            </div>

            {gstType === '2B' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{summary.itc_available}</p>
                  <p className="text-sm text-blue-700">✅ ITC Available</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{summary.itc_blocked}</p>
                  <p className="text-sm text-red-700">🚫 ITC Blocked</p>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold">Tally vs GSTR-{gstType} — {period}</h3>
                <span className="text-sm text-gray-500">{result.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">GSTIN</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Supplier</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Invoice No</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Tally Amount</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">GST Amount</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Diff</th>
                      {gstType === '2B' && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">ITC</th>}
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-mono">{r.gstin}</td>
                        <td className="px-4 py-3 text-sm">{r.supplier}</td>
                        <td className="px-4 py-3 text-sm">{r.invoice_no}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {r.status !== 'missing_in_tally' ? `₹${Number(r.taxable).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {r.gst_taxable !== undefined ? `₹${Number(r.gst_taxable).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {r.diff > 0 ? <span className="text-red-600">₹{r.diff.toLocaleString()}</span> : '—'}
                        </td>
                        {gstType === '2B' && (
                          <td className="px-4 py-3 text-center">
                            {r.itc ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.itc === 'Y' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {r.itc === 'Y' ? '✅ Available' : '🚫 Blocked'}
                              </span>
                            ) : '—'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
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
          </div>
        )}
      </div>
    </div>
  )
}
