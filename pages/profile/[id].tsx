import { useRouter } from 'next/router'
import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProfileView() {
  const router = useRouter()
  const { id } = router.query
  const { data, error } = useSWR(() => id ? `/api/profile/${id}` : null, fetcher)

  if (!data) return <p>Loading...</p>
  if (error) return <p>Error loading profile</p>

  const profile = data.profile
  const score = profile.risk_score

  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-2">{profile.full_name}</h1>
      <p className="mb-4">Risk score: <strong>{score}</strong> — <em>{score <= 30 ? 'Low' : score <= 60 ? 'Medium' : 'High'}</em></p>

      <section className="mb-4">
        <h2 className="font-semibold">Explainability</h2>
        {data.explainability.map((e: any, i: number) => (
          <div key={i} className="border p-2 rounded my-2">
            <strong>{e.factor}</strong>
            <p>{e.text}</p>
          </div>
        ))}
      </section>

      <section className="mb-4">
        <h2 className="font-semibold">Recommendations</h2>
        <ol className="list-decimal ml-6">
          {data.recommendations.map((r: string, idx: number) => <li key={idx}>{r}</li>)}
        </ol>
      </section>

      <div className="space-x-2">
        <a className="px-4 py-2 rounded bg-indigo-600 text-white" href={`/api/report/${id}`} target="_blank" rel="noreferrer">Download PDF report</a>
        <Link href="/"><a className="px-4 py-2 rounded border">Back</a></Link>
      </div>
    </div>
  )
}
