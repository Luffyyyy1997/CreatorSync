import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { postsApi } from '../api/postsApi.js'
import PostForm from '../components/PostForm.jsx'

export default function NewPostPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)

  // Pre-fill scheduled_at from calendar click
  const prefillDate = searchParams.get('date') || ''

  const initialData = prefillDate
    ? { status: 'scheduled', scheduled_at: prefillDate }
    : {}

  async function handleSubmit(data) {
    setSubmitting(true)
    try {
      await postsApi.create(data)
      toast.success('Post created!')
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : detail || 'Failed to create post.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
        <p className="text-gray-500 text-sm mt-1">
          Create a new post to schedule or publish across your platforms.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PostForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Create Post"
        />
      </div>
    </div>
  )
}
