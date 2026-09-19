import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { postsApi } from '../api/postsApi.js'
import PostForm from '../components/PostForm.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function EditPostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    postsApi.get(id)
      .then(setPost)
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Post not found.')
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(data) {
    setSubmitting(true)
    try {
      await postsApi.update(id, data)
      toast.success('Post updated!')
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : detail || 'Failed to update post.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Normalize scheduled_at to datetime-local format for the form
  const initialData = {
    ...post,
    scheduled_at: post.scheduled_at
      ? new Date(post.scheduled_at).toISOString().slice(0, 16)
      : '',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-gray-500 text-sm mt-1">Update your post details.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <PostForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  )
}
