/**
 * PostForm — shared form for creating and editing posts.
 * Props:
 *   initialData — existing post data (for edit mode)
 *   onSubmit(formData) — async function called on valid submit
 *   submitting — boolean
 *   submitLabel — button text
 */
import { useState } from 'react'
import AiSuggestionPanel from './AiSuggestionPanel.jsx'
import { validatePostForm } from '../utils/validators.js'

const PLATFORMS = ['twitter', 'instagram', 'youtube', 'tiktok']

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
    // Build submit payload
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Internal label for this post"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content <span className="text-red-400">*</span>
          <span className="text-gray-400 font-normal ml-2">{form.content.length}/2200</span>
        </label>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          rows={5}
          placeholder="Write your post content here…"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-y ${errors.content ? 'border-red-400' : 'border-gray-300'}`}
        />
        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
      </div>

      {/* Media URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Media URL <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          name="media_url"
          value={form.media_url}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="text-xs text-gray-400 mt-1">
          Required for Instagram and TikTok posts.
        </p>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Platforms <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                form.platforms.includes(p)
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-brand-400'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        {errors.platforms && <p className="text-red-500 text-xs mt-1">{errors.platforms}</p>}
      </div>

      {/* Status + Scheduled At */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {form.status === 'scheduled' && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled At <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${errors.scheduledAt ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.scheduledAt && <p className="text-red-500 text-xs mt-1">{errors.scheduledAt}</p>}
          </div>
        )}
      </div>

      {/* AI Panel toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAi((v) => !v)}
          className="text-sm text-brand-600 hover:underline flex items-center gap-1"
        >
          {showAi ? '▲ Hide' : '▼ Show'} AI Assistant
        </button>
        {showAi && (
          <div className="mt-3">
            <AiSuggestionPanel
              onUseCaption={handleUseCaption}
              onUseHashtags={handleUseHashtags}
              selectedPlatform={selectedPlatform}
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
