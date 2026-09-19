import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { postsApi } from '../api/postsApi.js'
import PostCard from '../components/PostCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const FILTERS = ['all', 'draft', 'scheduled', 'published', 'failed']

export default function DashboardPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [publishingId, setPublishingId] = useState(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    try {
      const data = await postsApi.list()
      setPosts(data)
    } catch {
      toast.error('Failed to load posts.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this post?')) return
    try {
      await postsApi.remove(id)
      setPosts((p) => p.filter((x) => x.id !== id))
      toast.success('Post deleted.')
    } catch {
      toast.error('Failed to delete post.')
    }
  }

  async function handlePublishNow(id) {
    setPublishingId(id)
    try {
      const updated = await postsApi.publishNow(id)
      setPosts((p) => p.map((x) => (x.id === id ? updated : x)))
      if (updated.status === 'published') {
        toast.success('Post published!')
      } else {
        toast.error(`Publish failed: ${updated.publish_error}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Publish failed.')
    } finally {
      setPublishingId(null)
    }
  }

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.status === filter)

  // Stats summary
  const stats = {
    total: posts.length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.display_name}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage and publish your content.</p>
        </div>
        <Link
          to="/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-medium text-sm transition-colors"
        >
          + New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: stats.total, color: 'text-gray-800' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-yellow-600' },
          { label: 'Published', value: stats.published, color: 'text-green-600' },
          { label: 'Drafts', value: stats.draft, color: 'text-gray-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
              filter === f
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-lg mb-4">
            {filter === 'all' ? 'No posts yet.' : `No ${filter} posts.`}
          </p>
          {filter === 'all' && (
            <Link
              to="/posts/new"
              className="inline-block px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm"
            >
              Create your first post
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onPublishNow={handlePublishNow}
              publishing={publishingId === post.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
