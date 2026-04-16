import { useState, useEffect, useRef, useCallback } from 'react'
import { readSettings } from './useSettings'

const LANG_MAP = {
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  tr: 'tr-TR',
}

/**
 * useSpeech — TTS + STT tek hook
 * @param {string} langId  'en' | 'de' | 'es'
 */
export function useSpeech(langId) {
  const locale = LANG_MAP[langId] ?? 'en-GB'

  // ── TTS ──────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false)
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback((text, { rate, pitch = 1.1, lang } = {}) => {
    if (!ttsSupported) return
    const settings = readSettings()
    if (settings.ttsEnabled === false) return
    const finalRate = rate ?? settings.ttsRate ?? 0.85
    const finalLang = lang ?? locale

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null
          trySpeak()
        }
        return
      }
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = finalLang
      const voice = voices.find(v => v.lang.startsWith(finalLang.split('-')[0]))
      if (voice) utt.voice = voice
      utt.rate = finalRate
      utt.pitch = pitch
      utt.onstart = () => setIsSpeaking(true)
      utt.onend   = () => setIsSpeaking(false)
      utt.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utt)
    }

    trySpeak()
  }, [locale, ttsSupported])

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [ttsSupported])

  // Sayfa kapanınca TTS'i durdur
  useEffect(() => {
    return () => { if (ttsSupported) window.speechSynthesis.cancel() }
  }, [ttsSupported])

  // ── STT ──────────────────────────────────────────────
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : null
  const sttSupported = Boolean(SpeechRecognition)

  const recognizerRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [sttError, setSttError] = useState(null)

  const startListening = useCallback(() => {
    if (!sttSupported || isListening) return
    setSttError(null)
    setTranscript('')

    const rec = new SpeechRecognition()
    rec.lang = locale
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setIsListening(true)
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.trim().toLowerCase()
      setTranscript(text)
    }
    rec.onerror = (e) => {
      setSttError(e.error)
      setIsListening(false)
    }
    rec.onend = () => setIsListening(false)

    recognizerRef.current = rec
    rec.start()
  }, [locale, sttSupported, isListening, SpeechRecognition])

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop()
    setIsListening(false)
  }, [])

  /**
   * checkAnswer — STT transcript'ini beklenen kelimeyle karşılaştırır
   * Küçük harf + trim normalize eder
   */
  const checkAnswer = useCallback((expected) => {
    if (!expected) return false
    if (!transcript) return false
    const t = transcript.toLowerCase().trim()
    const e = expected.toLowerCase().trim()
    return t === e || t.includes(e) || e.includes(t)
  }, [transcript])

  return {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    ttsSupported,
    // STT
    startListening,
    stopListening,
    isListening,
    transcript,
    sttError,
    sttSupported,
    checkAnswer,
    // Meta
    locale,
  }
}
