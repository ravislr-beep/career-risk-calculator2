import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return res.status(200).json({ isAdmin: false })

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userData } = await supabaseAdmin.auth.getUser(token)
    const user =  userData?.user
    if (!user) return res.status(200).json({ isAdmin: false })
    const { data: appUser } = await supabaseAdmin.from('app_users').select('*').eq('id', user.id).single()
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const isAdmin = adminEmails.includes(user.email ?? '') || appUser?.is_admin === true
    return res.status(200).json({ isAdmin })
  } catch (err:any) {
    console.error(err)
    return res.status(200).json({ isAdmin: false })
  }
}
