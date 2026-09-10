/**
 * 语音识别（服务端）。任何 OpenAI 兼容的 /audio/transcriptions 接口都行：
 *   ASR_BASE_URL  例如 https://api.groq.com/openai/v1 或 https://api.siliconflow.cn/v1
 *   ASR_API_KEY
 *   ASR_MODEL     例如 whisper-large-v3-turbo 或 FunAudioLLM/SenseVoiceSmall
 * 没配就整个功能隐藏。
 */
export function asrConfigured(): boolean {
  return Boolean(process.env.ASR_BASE_URL && process.env.ASR_API_KEY && process.env.ASR_MODEL);
}
