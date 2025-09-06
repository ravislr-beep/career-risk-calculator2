import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Career Risk Calculator — MVP</h1>
      <p className="mb-4">
        This Phase-1 MVP captures a user's career profile, computes a transparent 0-100 risk score via a deterministic engine, stores results in Supabase, and can generate a basic PDF report.
      </p>

      <div className="space-x-2">
        <Link href="/profile/new"><a className="px-4 py-2 rounded bg-green-600 text-white">Create Profile</a></Link>
        <Link href="/dashboard"><a className="px-4 py-2 rounded border">Enterprise Dashboard</a></Link>
      </div>

      <section className="mt-8 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold">What this MVP includes</h2>
        <ul className="list-disc ml-6 mt-2">
          <li>Profile capture form (subset of BRD fields)</li>
          <li>Rule-based risk scoring & explainability</li>
          <li>Store profiles to Supabase (profiles table)</li>
          <li>PDF report generation (serverless)</li>
        </ul>
      </section>
    </div>
  )
}
