import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function WeightsAdmin() {
  const [weights, setWeights] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [adminMode, setAdminMode] = useState(false)
  const [form, setForm] = useState({
    skills: 0.28,
    performance: 0.22,
    network: 0.18,
    mobility: 0.12,
    notice: 0.12,
    plateau: 0.08
  })

  useEffect(() => {
    supabase.auth.getSession().then(res => {
      const s = (res as any)?.data?.session
      setSession(s)
      if (s) {
        // check if admin via server API
        fetch('/api/check-admin', { headers: { Authorization: `Bearer ${s.access_token}` } }).then(r => r.json()).then(b => {
          setAdminMode(!!b?.isAdmin)
        })
      }
    })
    load()
  }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/weights')
    const body = await res.json()
    setWeights(body?.weights ?? null)
    if (body?.weights) setForm(body.weights)
    setLoading(false)
  }

  async function save(e:any) {
    e.preventDefault()
    if (!adminMode) { alert('Admin only'); return }
    setLoading(true)
    const res = await fetch('/api/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ weights: form })
    })
    const b = await res.json()
    if (!res.ok) alert(b?.error || 'Failed')
    else alert('Saved')
    await load()
    setLoading(false)
  }

  function setField(k:any, v:any) {
    setForm(prev => ({ ...prev, [k]: Number(v) }))
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Weights Admin</h1>
      {!adminMode && <p className="mb-4 text-red-600">You must be an admin to update weights. Contact the project owner to be added.</p>}
      {loading ? <p>Loading...</p> : (
        <form onSubmit={save} className="space-y-3 max-w-md">
          {['skills','performance','network','mobility','notice','plateau'].map((k) => (
            <div key={k} className="flex items-center space-x-3">
              <label className="w-32">{k}</label>
              <input step="0.01" min="0" max="1" type="number" value={form[k as any]} onChange={e => setField(k, e.target.value)} className="border px-2 py-1 rounded flex-1" />
            </div>
          ))}
          <div className="flex space-x-2 mt-3">
            <button className="px-4 py-2 rounded bg-blue-600 text-white" disabled={!adminMode || loading}>Save</button>
            <button type="button" onClick={load} className="px-4 py-2 rounded border">Reload</button>
          </div>
        </form>
      )}
    </div>
  )
}
