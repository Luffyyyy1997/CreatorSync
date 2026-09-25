/**
 * PostForm — shared form for creating and editing posts.
 * Props:
 *   initialData — existing post data (for edit mode)
 *   onSubmit(formData) — async function called on valid submit
 *   submitting — boolean
 *   submitLabel — button text
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AiSuggestionPanel from './AiSuggestionPanel.jsx'
import { validatePostForm } from '../utils/validators.js'

const PLATFORMS = ['twitter', 'instagram', 'youtube', 'tiktok']

const PLATFORM_LIMITS = {
  twitter: 280,
  instagram: 2200,
  youtube: 5000,
  tiktok: 2200,
  default: 2200,
}

const PLATFORM_ICONS = {
  twitter: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.004 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  youtube: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  ),
}

const PLATFORM_COLORS = {
  twitter:   { active: 'bg-black text-white border-black',         inactive: 'border-gray-300 text-gray-600 hover:border-black hover:text-black' },
  instagram: { active: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent', inactive: 'border-gray-300 text-gray-600 hover:border-pink-400 hover:text-pink-600' },
  youtube:   { active: 'bg-red-600 text-white border-red-600',      inactive: 'border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600' },
  tiktok:    { active: 'bg-gray-900 text-white border-gray-900',    inactive: 'border-gray-300 text-gray-600 hover:border-gray-700 hover:text-gray-900' },
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
]

const DEFAULT_FORM = {
  title: '',
  content: '',
  media_url: '',
  platforms: [],
  status: 'draft',
  scheduled_at: '',
}

export default function PostForm({ initialData = {}, onSubmit, submitting = false, submitLabel = 'Save Post' }) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initialData })
  const [errors, setErrors] = useState({})
  const [showAi, setShowAi] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  function togglePlatform(p) {
    setForm((f) => {
      const platforms = f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p]
      return { ...f, platforms }
    })
    if (errors.platforms) setErrors((e) => ({ ...e, platforms: undefined }))
  }

  function handleUseCaption(caption) {
    setForm((f) => ({ ...f, content: caption }))
    if (errors.content) setErrors((e) => ({ ...e, content: undefined }))
  }

  function handleUseHashtags(hashtags) {
    const tags = hashtags.map((t) => `#${t}`).join(' ')
    setForm((f) => ({ ...f, content: f.content ? `${f.content}\n\n${tags}` : tags }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validatePostForm(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      media_url: form.media_url?.trim() || null,
      platforms: form.platforms,
      status: form.status,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    }
    onSubmit(payload)
  }

  const selectedPlatform = form.platforms[0] || 'general'
  const charLimit = form.platforms.length === 1 ? (PLATFORM_LIMITS[form.platforms[0]] || PLATFORM_LIMITS.default) : PLATFORM_LIMITS.default
  const charCount = form.content.length
  const charOverLimit = charCount > charLimit
  const charPct = Math.min(charCount / charLimit, 1)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Internal label for this post"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
            errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>}
      </div>

      {/* Content with live character counter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Content <span className="text-red-400">*</span>
          </label>
          <span className={`text-xs font-medium transition-colors ${charOverLimit ? 'text-red-500' : charPct > 0.85 ? 'text-amber-500' : 'text-gray-400'}`}>
            {charCount} / {charLimit}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-gray-100 rounded-full mb-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${charOverLimit ? 'bg-red-500' : charPct > 0.85 ? 'bg-amber-400' : 'bg-purple-500'}`}
            animate={{ width: `${charPct * 100}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          rows={5}
          placeholder="Write your post content here…"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-y ${
            errors.content || charOverLimit ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        />
        {errors.content && <p className="text-red-500 text-xs mt-1.5">{errors.content}</p>}
      </div>

      {/* Media URL */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Media URL <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          name="media_url"
          value={form.media_url}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white transition-all duration-150"
        />
        <p className="text-xs text-gray-400 mt-1.5">Required for Instagram and TikTok posts.</p>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Platforms <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const colors = PLATFORM_COLORS[p]
            const isActive = form.platforms.includes(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border transition-all duration-150 font-medium ${
                  isActive ? colors.active : colors.inactive
                }`}
              >
                {PLATFORM_ICONS[p]}
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            )
          })}
        </div>
        {errors.platforms && <p className="text-red-500 text-xs mt-1.5">{errors.platforms}</p>}
      </div>

      {/* Status + Scheduled At */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white transition-all duration-150"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {form.status === 'scheduled' && (
          <div className="flex-1">
            <label htmlFor="scheduled_at" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Scheduled At <span className="text-red-400">*</span>
            </label>
            <input
              id="scheduled_at"
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={handleChange}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-150 ${errors.scheduledAt ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}
            />
            {errors.scheduledAt && <p className="text-red-500 text-xs mt-1.5">{errors.scheduledAt}</p>}
          </div>
        )}
      </div>

      {/* AI Panel toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAi((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
        >
          <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs">✨</span>
          {showAi ? 'Hide AI Assistant' : 'Show AI Assistant'}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${showAi ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {showAi && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3">
                <AiSuggestionPanel
                  onUseCaption={handleUseCaption}
                  onUseHashtags={handleUseHashtags}
                  selectedPlatform={selectedPlatform}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || charOverLimit}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg disabled:opacity-50 transition-all duration-200"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
