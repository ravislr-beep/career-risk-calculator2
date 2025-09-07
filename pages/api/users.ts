import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing token' })

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || ! userData?.user) return res.status(401).json({ error: 'Invalid token' })
    const user = userData.data.user

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      is_admin: false
    }

    // upsert into app_users table
    const { data, error } = await supabaseAdmin.from('app_users').upsert([payload]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true, user: data })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
