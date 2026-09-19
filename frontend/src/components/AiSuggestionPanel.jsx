/**
 * AI Suggestion Panel — embedded in PostForm and standalone AI page.
 * Props:
 *   onUseCaption(caption: string) — called when user clicks "Use Caption"
 *   onUseHashtags(hashtags: string[]) — called when user clicks "Use Hashtags"
 *   selectedPlatform — currently selected platform for context
 */
import { useState } from 'react'
import toast from 'react-hot-toast'
import { aiApi } from '../api/aiApi.js'
import LoadingSpinner from './LoadingSpinner.jsx'
import { validateTopic } from '../utils/validators.js'

const PLATFORMS = ['general', 'twitter', 'instagram', 'youtube', 'tiktok']

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
    <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-brand-700 flex items-center gap-2">
        <span>✨</span> AI Assistant
      </h3>

      {/* Topic + Platform inputs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setTopicError('') }}
            placeholder="Enter a topic or keyword…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {topicError && <p className="text-red-500 text-xs mt-1">{topicError}</p>}
        </div>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleIdeas}
          disabled={loading.ideas}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-brand-300 text-brand-600 rounded-lg hover:bg-brand-50 disabled:opacity-50"
        >
          {loading.ideas ? <LoadingSpinner size="sm" /> : '💡'} Ideas
        </button>
        <button
          onClick={handleCaption}
          disabled={loading.caption}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-brand-300 text-brand-600 rounded-lg hover:bg-brand-50 disabled:opacity-50"
        >
          {loading.caption ? <LoadingSpinner size="sm" /> : '✍️'} Caption
        </button>
        <button
          onClick={handleHashtags}
          disabled={loading.hashtags}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-brand-300 text-brand-600 rounded-lg hover:bg-brand-50 disabled:opacity-50"
        >
          {loading.hashtags ? <LoadingSpinner size="sm" /> : '#️⃣'} Hashtags
        </button>
      </div>

      {/* Ideas output */}
      {ideas.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Content Ideas</p>
          <ul className="space-y-1">
            {ideas.map((idea, i) => (
              <li key={i} className="text-sm text-gray-700 bg-white rounded p-2 border border-gray-100">
                {idea}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Caption output */}
      {caption && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Generated Caption</p>
          <div className="bg-white rounded-lg border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {caption}
          </div>
          {onUseCaption && (
            <button
              onClick={() => { onUseCaption(caption); toast.success('Caption inserted!') }}
              className="mt-2 text-xs px-3 py-1.5 bg-brand-500 text-white rounded hover:bg-brand-600"
            >
              Use This Caption
            </button>
          )}
        </div>
      )}

      {/* Hashtags output */}
      {hashtags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Hashtags</p>
          <div className="flex flex-wrap gap-1">
            {hashtags.map((tag, i) => (
              <span key={i} className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
          {onUseHashtags && (
            <button
              onClick={() => { onUseHashtags(hashtags); toast.success('Hashtags inserted!') }}
              className="mt-2 text-xs px-3 py-1.5 bg-brand-500 text-white rounded hover:bg-brand-600"
            >
              Insert Hashtags
            </button>
          )}
        </div>
      )}
    </div>
  )
}
