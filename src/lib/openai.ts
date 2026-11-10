import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getOpenAI() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

// 模型配置：便宜任務用 mini，品質任務用 4o
export const MODELS = {
  cheap: 'gpt-4o-mini',
  quality: 'gpt-4o',
  transcribe: 'whisper-1',
  tts: 'tts-1-hd',
} as const
