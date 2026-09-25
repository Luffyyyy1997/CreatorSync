/**
 * AI Suggestion Panel — embedded in PostForm and standalone AI page.
 * Features: typing animation, copy-to-clipboard with toast.
 * Props:
 *   onUseCaption(caption: string) — called when user clicks "Use Caption"
 *   onUseHashtags(hashtags: string[]) — called when user clicks "Use Hashtags"
 *   selectedPlatform — currently selected platform for context
 */
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { aiApi } from '../api/aiApi.js'
import LoadingSpinner from './LoadingSpinner.jsx'
import { validateTopic } from '../utils/validators.js'

const PLATFORMS = ['general', 'twitter', 'instagram', 'youtube', 'tiktok']

/** Animated "typing" text that reveals characters one by one */
function TypingText({ text, speed = 12 }) {
  const [displayed, setDisplayed] = useState('')
  const idxRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    idxRef.current = 0
    const interval = setInterval(() => {
      idxRef.current += 1
      setDisplayed(text.slice(0, idxRef.current))
      if (idxRef.current >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return <span>{displayed}</span>
}

/** Copy button with toast confirmation */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard!', { icon: '📋' })
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-all"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function AiSuggestionPanel({ onUseCaption, onUseHashtags, selectedPlatform = 'general' }) {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState(selectedPlatform)
  const [ideas, setIdeas] = useState([])
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState([])
  const [loading, setLoading] = useState({ ideas: false, caption: false, hashtags: false })
  const [topicError, setTopicError] = useState('')

  function validate() {
    const err = validateTopic(topic)
    setTopicError(err || '')
    return !err
  }

  async function handleIdeas() {
    if (!validate()) return
    setLoading((l) => ({ ...l, ideas: true }))
    setIdeas([])
    try {
      const result = await aiApi.ideas(topic, platform)
      setIdeas(result)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate ideas.')
    } finally {
      setLoading((l) => ({ ...l, ideas: false }))
    }
  }

  async function handleCaption() {
    if (!validate()) return
    setLoading((l) => ({ ...l, caption: true }))
    setCaption('')
    try {
      const result = await aiApi.caption(topic, platform)
      setCaption(result)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate caption.')
    } finally {
      setLoading((l) => ({ ...l, caption: false }))
    }
  }

  async function handleHashtags() {
    if (!validate()) return
    setLoading((l) => ({ ...l, hashtags: true }))
    setHashtags([])
    try {
      const result = await aiApi.hashtags(topic, platform)
      setHashtags(result)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate hashtags.')
    } finally {
      setLoading((l) => ({ ...l, hashtags: false }))
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-white border border-purple-100 rounded-2xl p-5 space-y-4 shadow-sm">
      <h3 className="font-bold text-purple-700 flex items-center gap-2 text-base">
        <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center text-sm">✨</span>
        AI Assistant
      </h3>

      {/* Topic + Platform inputs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setTopicError('') }}
            placeholder="Enter a topic or keyword…"
            className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white transition-all"
          />
          {topicError && <p className="text-red-500 text-xs mt-1">{topicError}</p>}
        </div>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white transition-all"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ideas', label: 'Ideas', icon: '💡', handler: handleIdeas },
          { key: 'caption', label: 'Caption', icon: '✍️', handler: handleCaption },
          { key: 'hashtags', label: 'Hashtags', icon: '#️⃣', handler: handleHashtags },
        ].map(({ key, label, icon, handler }) => (
          <button
            key={key}
            onClick={handler}
            disabled={loading[key]}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 transition-all font-medium shadow-sm"
          >
            {loading[key] ? <LoadingSpinner size="sm" /> : icon} {label}
          </button>
        ))}
      </div>

      {/* Ideas output */}
      <AnimatePresence>
        {ideas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">💡 Content Ideas</p>
              <CopyButton text={ideas.join('\n')} />
            </div>
            <ul className="space-y-1.5">
              {ideas.map((idea, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-purple-100 hover:border-purple-200 transition-colors"
                >
                  <TypingText text={idea} speed={8} />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caption output */}
      <AnimatePresence>
        {caption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">✍️ Generated Caption</p>
              <CopyButton text={caption} />
            </div>
            <div className="bg-white rounded-xl border border-purple-100 p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              <TypingText text={caption} speed={6} />
            </div>
            {onUseCaption && (
              <button
                onClick={() => { onUseCaption(caption); toast.success('Caption inserted!') }}
                className="mt-2 text-xs px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium"
              >
                Use This Caption
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hashtags output */}
      <AnimatePresence>
        {hashtags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">#️⃣ Hashtags</p>
              <CopyButton text={hashtags.map(t => `#${t}`).join(' ')} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium hover:bg-purple-200 transition-colors cursor-default"
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
            {onUseHashtags && (
              <button
                onClick={() => { onUseHashtags(hashtags); toast.success('Hashtags inserted!') }}
                className="mt-2 text-xs px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium"
              >
                Insert Hashtags
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
