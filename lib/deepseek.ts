/**
 * Simple Deepseek client wrapper.
 * Usage: call `generateExplainability(payload)` from server-side API routes.
 * Note: This file runs only on the server (API routes). Never expose DEEPSEEK_API_KEY to the browser.
 */

type DeepseekRequest = {
  model?: string
  prompt: string
  max_tokens?: number
  temperature?: number
}

type DeepseekResponse = {
  id?: string
  text?: string
  choices?: Array<{ text: string }>
  error?: any
}

export async function deepseekGenerate(payload: DeepseekRequest): Promise<DeepseekResponse> {
  const url = process.env.DEEPSEEK_API_URL
  const key = process.env.DEEPSEEK_API_KEY
  if (!url || !key) {
    throw new Error('Missing Deepseek API configuration. Set DEEPSEEK_API_URL and DEEPSEEK_API_KEY in your environment variables.')
  }

  const body = {
    model: payload.model ?? 'deepseek-2025-small',
    prompt: payload.prompt,
    max_tokens: payload.max_tokens ?? 400,
    temperature: payload.temperature ?? 0.2
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const txt = await res.text()
    return { error: { status: res.status, body: txt } }
  }
  const data = await res.json()
  return data as DeepseekResponse
}
