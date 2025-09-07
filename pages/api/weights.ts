import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = getSupabaseAdmin()
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('weights').select('*').order('updated_at', { ascending: false }).limit(1).single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ weights: data?.weights ?? null })
  } else if (req.method === 'POST') {
    const auth = req.headers.authorization || ''
    const token = auth.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing token' })
    // check admin
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || ! userData?.user) return res.status(401).json({ error: 'Invalid token' })
    const user = userData.data.user
    // check app_users for is_admin
    const { data: appUser } = await supabaseAdmin.from('app_users').select('*').eq('id', user.id).single()
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const isAdmin = adminEmails.includes(user.email ?? '') || appUser?.is_admin === true
    if (!isAdmin) return res.status(403).json({ error: 'Not admin' })

    const payload = { weights: req.body.weights }
    const { data, error } = await supabaseAdmin.from('weights').insert([payload]).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true, weights: data })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
