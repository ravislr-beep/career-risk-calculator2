import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { useState, useEffect } from 'react'

export default function Nav() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(res => {
      const session = (res as any)?.data?.session
      setUser(session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session as any)?.user ?? null)
    })
    return () => {
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <nav className="p-4 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/"><a className="font-bold">Career Risk Calculator</a></Link>
        <div className="space-x-4 flex items-center">
          <Link href="/"><a>Home</a></Link>
          <Link href="/profile/new"><a>New Profile</a></Link>
          <Link href="/dashboard"><a>Dashboard</a></Link>
          <Link href="/admin/weights"><a>Weights</a></Link>
          {user ? (
            <div className="flex items-center space-x-3">
              {user.user_metadata?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm">{user.email}</span>
              <button onClick={signOut} className="px-3 py-1 rounded bg-red-500 text-white">Sign out</button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="px-3 py-1 rounded bg-blue-600 text-white">Sign in with Google</button>
          )}
        </div>
      </div>
    </nav>
  )
}
