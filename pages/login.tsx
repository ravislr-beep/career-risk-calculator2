import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>
      <p>Use the <strong>Sign in with Google</strong> button in the top-right to log in. This app uses Google via Supabase OAuth.</p>
      <div className="mt-4">
        <Link href="/"><a className="px-4 py-2 rounded border">Back</a></Link>
      </div>
    </div>
  )
}
