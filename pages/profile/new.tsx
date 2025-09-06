import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

type FormValues = {
  fullName: string
  email: string
  dateOfBirth: string
  gender: string
  employmentStatus: string
  totalExperience: number
  skillProficiencyAvg: number
  trainingHours12mo: number
  performanceRating: number
  linkedinNetworkSize: string
  willingToRelocate: string
  preferredWorkModel: string
  noticePeriodDays: number
}

export default function NewProfile() {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      employmentStatus: 'Full-time',
      linkedinNetworkSize: '< 500',
      willingToRelocate: 'No',
      preferredWorkModel: 'Hybrid',
      skillProficiencyAvg: 3,
      performanceRating: 3,
      trainingHours12mo: 0,
      noticePeriodDays: 30,
      totalExperience: 5
    }
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(res => {
      const s = (res as any)?.data?.session
      setSession(s)
      if (!s) router.push('/login')
      else {
        // upsert user to DB by calling server API
        fetch('/api/users', { method: 'POST', headers: { Authorization: `Bearer ${s.access_token}` } })
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession((session as any)?.session ?? null)
    })
    return () => listener?.subscription?.unsubscribe?.()
  }, [router])

  async function onSubmit(data: FormValues) {
    if (!session) {
      alert('Sign in required')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...data,
        totalExperience: Number(data.totalExperience),
        skillProficiencyAvg: Number(data.skillProficiencyAvg),
        trainingHours12mo: Number(data.trainingHours12mo),
        performanceRating: Number(data.performanceRating),
        noticePeriodDays: Number(data.noticePeriodDays)
      }

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload)
      })
      const body = await res.json()
      if (!res.ok) {
        alert(body?.error || 'Failed to compute score')
      } else {
        router.push(`/profile/${body.profileId}`)
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow mt-6">
      <h1 className="text-xl font-bold mb-4">New Career Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register('fullName')} placeholder="Full name" required className="w-full border px-3 py-2 rounded" />
        <input {...register('email')} placeholder="Email" type="email" required className="w-full border px-3 py-2 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <input {...register('dateOfBirth')} placeholder="Date of birth" type="date" className="w-full border px-3 py-2 rounded" />
          <select {...register('gender')} className="w-full border px-3 py-2 rounded">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="nonbinary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select {...register('employmentStatus')} className="w-full border px-3 py-2 rounded">
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Freelance</option>
          </select>
          <input {...register('totalExperience')} type="number" min="0" step="0.1" className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input {...register('skillProficiencyAvg')} type="number" min="1" max="5" step="1" className="w-full border px-3 py-2 rounded" placeholder="Avg skill (1-5)" />
          <input {...register('trainingHours12mo')} type="number" min="0" className="w-full border px-3 py-2 rounded" placeholder="Training hours (12m)" />
          <input {...register('performanceRating')} type="number" min="1" max="5" step="1" className="w-full border px-3 py-2 rounded" placeholder="Performance rating (1-5)" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select {...register('linkedinNetworkSize')} className="w-full border px-3 py-2 rounded">
            <option>&lt; 500</option>
            <option>500–1,000</option>
            <option>1,001–5,000</option>
            <option>&gt; 5,000</option>
          </select>
          <select {...register('willingToRelocate')} className="w-full border px-3 py-2 rounded">
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select {...register('preferredWorkModel')} className="w-full border px-3 py-2 rounded">
            <option>Hybrid</option>
            <option>Remote</option>
            <option>On-site</option>
            <option>Willing to Relocate</option>
          </select>
          <input {...register('noticePeriodDays')} type="number" min="0" className="w-full border px-3 py-2 rounded" placeholder="Notice period days" />
        </div>

        <button className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>
          {loading ? 'Computing...' : 'Compute risk & Save'}
        </button>
      </form>
    </div>
  )
}
