import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing id' })
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin.from('profiles').select('*, app_users(full_name,email,avatar_url)').eq('id', id).single()
  if (error) return res.status(500).json({ error: error.message })
  const explainability = [
    { factor: 'Skills relevance', text: `Score ${data.risk_details?.skillsRisk ?? 'N/A'}` },
    { factor: 'Performance', text: `Score ${data.risk_details?.performanceRisk ?? 'N/A'}` },
    { factor: 'Network', text: `Score ${data.risk_details?.networkRisk ?? 'N/A'}` }
  ]
  const recommendations = ['See dashboard for suggested actions.']
  res.status(200).json({ profile: data, explainability, recommendations })
}
