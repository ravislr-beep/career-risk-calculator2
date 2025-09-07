import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { deepseekGenerate } from '../../lib/deepseek'

type Payload = {
  fullName: string
  email: string
  dateOfBirth?: string
  gender?: string
  employmentStatus?: string
  totalExperience: number
  skillProficiencyAvg: number
  trainingHours12mo: number
  performanceRating: number
  linkedinNetworkSize: string
  willingToRelocate: string
  preferredWorkModel?: string
  noticePeriodDays: number
}

function clamp(v: number, a=0, b=100){ return Math.max(a, Math.min(b, v)) }

const DEFAULT_WEIGHTS = {
  skills: 0.28,
  performance: 0.22,
  network: 0.18,
  mobility: 0.12,
  notice: 0.12,
  plateau: 0.08
}

function buildDeepseekPrompt(p: Payload, details: any) {
  // Construct a clear, structured prompt for Deepseek to produce:
  //  - a 2-3 paragraph explainability narrative tailored to the candidate
  //  - a short list of 5 prioritized, actionable recommendations
  return `You are an expert career advisor. Given the structured profile below, produce:
1) A concise, human-readable explainability narrative (2-3 short paragraphs) that explains why the candidate received the computed risk score. Use non-technical language and reference the specific factor values.
2) A prioritized list of up to 5 specific, actionable recommendations tailored to the candidate, each 1 sentence.
3) Return only JSON with keys: "narrative" (string) and "recommendations" (array of strings).

Profile:
Full name: ${p.fullName}
Email: ${p.email}
Employment status: ${p.employmentStatus}
Total experience (years): ${p.totalExperience}
Avg skill proficiency (1-5): ${p.skillProficiencyAvg}
Training hours (12mo): ${p.trainingHours12mo}
Performance rating (1-5): ${p.performanceRating}
LinkedIn network: ${p.linkedinNetworkSize}
Willing to relocate: ${p.willingToRelocate}
Preferred work model: ${p.preferredWorkModel}
Notice period (days): ${p.noticePeriodDays}

Computed factor scores:
SkillsRisk: ${Math.round(details.skillsRisk)}
PerformanceRisk: ${Math.round(details.performanceRisk)}
NetworkRisk: ${Math.round(details.networkRisk)}
MobilityRisk: ${Math.round(details.mobilityRisk)}
NoticeRisk: ${Math.round(details.noticeRisk)}
PlateauRisk: ${Math.round(details.plateauRisk)}

Tone: empathetic, concise, professional.`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing token' })

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' })
    const user = userData.data.user

    const p = req.body as Payload

    // fetch weights from DB
    const { data: wdata } = await supabaseAdmin.from('weights').select('*').order('updated_at', { ascending: false }).limit(1).single()
    const weights = wdata?.weights ?? DEFAULT_WEIGHTS

    // compute factors
    const skillsRisk = 100 - (p.skillProficiencyAvg/5)*100
    const performanceRisk = 100 - (p.performanceRating/5)*100
    const networkMap: any = {
      '< 500': 70,
      '500–1,000': 50,
      '1,001–5,000': 30,
      '> 5,000': 10
    }
    const networkRisk = networkMap[p.linkedinNetworkSize] ?? 60
    const mobilityRisk = p.willingToRelocate === 'Yes' ? 10 : 40
    const notice = Number(p.noticePeriodDays ?? 30)
    let noticeRisk = 10
    if (notice >= 90) noticeRisk = 80
    else if (notice >= 60) noticeRisk = 70
    else if (notice >= 30) noticeRisk = 50
    else if (notice >= 15) noticeRisk = 30
    else if (notice >= 7) noticeRisk = 20
    const plateauRisk = p.totalExperience >= 12 ? 40 : 20

    const raw = skillsRisk*weights.skills +
                performanceRisk*weights.performance +
                networkRisk*weights.network +
                mobilityRisk*weights.mobility +
                noticeRisk*weights.notice +
                plateauRisk*weights.plateau

    const score = clamp(Math.round(raw))
    const tier = score <= 30 ? 'Low' : score <= 60 ? 'Medium' : 'High'

    const explainability = [
      { factor: 'Skills relevance', value: Math.round(skillsRisk), text: `Skill-related risk is ${Math.round(skillsRisk)}.` },
      { factor: 'Performance', value: Math.round(performanceRisk), text: `Performance risk ${Math.round(performanceRisk)}.` },
      { factor: 'Network', value: networkRisk, text: `Network risk ${networkRisk}.` },
      { factor: 'Mobility', value: mobilityRisk, text: `${p.willingToRelocate === 'Yes' ? 'Mobility lowers risk.' : 'Limited mobility increases risk.'}` },
      { factor: 'Notice period', value: noticeRisk, text: `Notice period risk ${noticeRisk}.` },
      { factor: 'Experience plateau', value: plateauRisk, text: `${plateauRisk === 40 ? 'Possible plateau.' : 'Balanced tenure.'}` }
    ]

    // call Deepseek to generate narrative & recommendations
    const prompt = buildDeepseekPrompt(p, { skillsRisk, performanceRisk, networkRisk, mobilityRisk, noticeRisk, plateauRisk })
    let llmNarrative = null
    let llmRecommendations: string[] = []

    try {
      const resp = await deepseekGenerate({ prompt, max_tokens: 400, temperature: 0.2 })
      // Expecting Deepseek to return JSON in text or choices[0].text
      const rawText = resp.text ?? (resp.choices && resp.choices[0]?.text) ?? ''
      // try parse JSON
      try {
        const parsed = JSON.parse(rawText)
        llmNarrative = parsed.narrative ?? rawText
        llmRecommendations = parsed.recommendations ?? []
      } catch (e) {
        // fallback: minimally parse lines
        llmNarrative = rawText
        // naive split to get lines that look like recommendations
        llmRecommendations = rawText.split('\n').slice(0,5).map(s => s.trim()).filter(Boolean)
      }
    } catch (err:any) {
      console.error('Deepseek error', err)
      // proceed without LLM outputs
    }

    // insert into profiles with user association and store llm outputs for retention/audit
    const profileId = uuidv4()
    const insert = {
      id: profileId,
      user_id: user.id,
      full_name: p.fullName,
      email: p.email,
      date_of_birth: p.dateOfBirth ?? null,
      gender: p.gender ?? null,
      employment_status: p.employmentStatus ?? null,
      total_experience: p.totalExperience,
      skill_proficiency_avg: p.skillProficiencyAvg,
      training_hours_12mo: p.trainingHours12mo,
      performance_rating: p.performanceRating,
      linkedin_network_size: p.linkedinNetworkSize,
      willing_to_relocate: p.willingToRelocate,
      preferred_work_model: p.preferredWorkModel ?? null,
      notice_period_days: p.noticePeriodDays,
      risk_score: score,
      risk_details: { skillsRisk, performanceRisk, networkRisk, mobilityRisk, noticeRisk, plateauRisk },
      llm_explain: llmNarrative,
      llm_recommendations: llmRecommendations
    }
    const { data, error } = await supabaseAdmin.from('profiles').insert([insert]).select().single()
    if (error) {
      console.error('Supabase insert error', error)
      return res.status(500).json({ error: error.message })
    }

    // persist llm output for retention/audit
    if (llmNarrative || (llmRecommendations && llmRecommendations.length)) {
      try {
        await supabaseAdmin.from('llm_outputs').insert([{
          id: uuidv4(),
          profile_id: profileId,
          provider: 'deepseek',
          model: 'deepseek-2025-small',
          prompt,
          response: { narrative: llmNarrative, recommendations: llmRecommendations },
          created_at: new Date().toISOString()
        }])
      } catch (e) {
        console.error('Failed to store LLM output', e)
      }
    }

    return res.status(200).json({ ok: true, score, tier, explainability, recommendations: llmRecommendations.length ? llmRecommendations : ['See dashboard for recommended actions.'], profileId: data.id })
  } catch (err:any) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
