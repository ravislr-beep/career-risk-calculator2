import type { NextApiRequest, NextApiResponse } from "next"
import { getSupabaseAdmin } from "../../lib/supabaseClient"
import { v4 as uuidv4 } from "uuid"
import { deepseekGenerate } from "../../lib/deepseek"

type Weights = {
  skills: number
  performance: number
  network: number
  mobility: number
  notice: number
  plateau: number
}

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

function clamp(v: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, v))
}

const DEFAULT_WEIGHTS: Weights = {
  skills: 0.28,
  performance: 0.22,
  network: 0.18,
  mobility: 0.12,
  notice: 0.12,
  plateau: 0.08,
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end()

  const supabaseAdmin = getSupabaseAdmin()
  const payload: Payload = req.body

  // ✅ fetch weights and cast safely
  const { data: wdata } = await supabaseAdmin
    .from("weights")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single()

  const weights: Weights =
    (wdata?.weights as Weights) ?? DEFAULT_WEIGHTS

  // === Risk scoring logic ===
  const skillScore = clamp(
    (payload.skillProficiencyAvg / 5) * 100 * weights.skills +
      (Math.min(payload.trainingHours12mo, 100) / 100) * 100 * 0.1
  )
  const perfScore =
    (payload.performanceRating / 5) * 100 * weights.performance
  const networkScore =
    (parseInt(payload.linkedinNetworkSize) / 500) *
    100 *
    weights.network
  const mobilityScore =
    (payload.willingToRelocate === "Yes" ? 100 : 40) * weights.mobility
  const noticeScore =
    (90 - Math.min(payload.noticePeriodDays, 90)) *
    (100 / 90) *
    weights.notice
  const plateauScore =
    (payload.totalExperience < 15 ? 100 : 60) * weights.plateau

  const total =
    skillScore +
    perfScore +
    networkScore +
    mobilityScore +
    noticeScore +
    plateauScore

  const riskCategory =
    total >= 70 ? "Low" : total >= 40 ? "Medium" : "High"

  // === Generate narrative with Deepseek ===
  const narrative = await deepseekGenerate(
    `Profile: ${JSON.stringify(payload)}. 
    Risk score: ${total.toFixed(
      1
    )} (${riskCategory}). Provide a 200-word narrative assessment and career guidance.`
  )

  // === Save to DB ===
  const id = uuidv4()
  await supabaseAdmin.from("profiles").insert({
    id,
    ...payload,
    risk_score: total,
    risk_category: riskCategory,
    narrative,
  })

  res.json({
    id,
    score: total,
    category: riskCategory,
    narrative,
  })
}
