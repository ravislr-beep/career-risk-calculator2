import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ profiles: data })
}
