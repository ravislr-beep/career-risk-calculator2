import useSWR from 'swr'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Dashboard() {
  const { data, error } = useSWR('/api/profiles', fetcher)

  if (!data) return <p>Loading...</p>
  if (error) return <p>Error loading</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Enterprise Dashboard</h1>
      <p className="mb-4">Profiles saved: {data.profiles.length}</p>

      <table className="w-full bg-white rounded shadow">
        <thead className="text-left border-b">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Score</th>
            <th className="p-2">Created</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.profiles.map((p: any) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.full_name}</td>
              <td className="p-2">{p.email}</td>
              <td className="p-2">{p.risk_score}</td>
              <td className="p-2">{new Date(p.created_at).toLocaleString()}</td>
              <td className="p-2">
                <Link href={`/profile/${p.id}`}><a className="text-indigo-600">Open</a></Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
