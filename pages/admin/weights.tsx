import { useEffect, useState } from "react"

type Weights = {
  skills: number
  performance: number
  network: number
  mobility: number
  notice: number
  plateau: number
}
 
export default function WeightsAdmin() {
  const [form, setForm] = useState<Weights>({
    skills: 0.28,
    performance: 0.22,
    network: 0.18,
    mobility: 0.12,
    notice: 0.12,
    plateau: 0.08,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weights")
        if (res.ok) {
          const data = await res.json()
          if (data?.weights) {
            setForm(data.weights as Weights)
          }
        }
      } catch (e) {
        console.error("Failed to load weights", e)
      }
    }
    load()
  }, [])

  // ✅ Strongly type setField
  const setField = (k: keyof Weights, v: number) => {
    setForm({ ...form, [k]: v })
  }

  async function save() {
    setLoading(true)
    try {
      const res = await fetch("/api/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: form }),
      })
      if (res.ok) {
        alert("Weights updated")
      } else {
        alert("Failed to save weights")
      }
    } catch (e) {
      alert("Error saving weights")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Adjust Risk Weights</h1>
      <form className="space-y-3">
        {(Object.keys(form) as (keyof Weights)[]).map((k) => (
          <div key={k} className="flex items-center space-x-3">
            <label className="w-32">{k}</label>
            <input
              step="0.01"
              min="0"
              max="1"
              type="number"
              value={form[k]}   // ✅ safe
              onChange={(e) => setField(k, parseFloat(e.target.value))} // ✅ string → number
              className="border px-2 py-1 rounded flex-1"
            />
          </div>
        ))}
        <div className="flex space-x-2 mt-3">
          <button
            type="button"
            disabled={loading}
            onClick={save}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}
