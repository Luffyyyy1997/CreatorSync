import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { postsApi } from '../api/postsApi.js'
import PostCard from '../components/PostCard.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const FILTERS = ['all', 'draft', 'scheduled', 'published', 'failed']

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' } }),
}

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

  const stats = [
    { label: 'Total Posts', value: posts.length, color: 'text-white', bg: 'from-purple-500 to-indigo-600' },
    { label: 'Scheduled', value: posts.filter((p) => p.status === 'scheduled').length, color: 'text-white', bg: 'from-amber-400 to-orange-500' },
    { label: 'Published', value: posts.filter((p) => p.status === 'published').length, color: 'text-white', bg: 'from-emerald-400 to-green-600' },
    { label: 'Drafts', value: posts.filter((p) => p.status === 'draft').length, color: 'text-white', bg: 'from-slate-400 to-gray-600' },
  ]

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Welcome back, {user?.display_name}! 👋
              </h1>
              <p className="text-purple-200 mt-2 text-base">
                Manage, schedule, and publish your content across all platforms.
              </p>
            </div>
            <Link
              to="/posts/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-purple-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </Link>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`bg-gradient-to-br ${s.bg} rounded-xl p-4 text-center shadow-md hover:scale-105 transition-transform duration-200`}
              >
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/80 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex gap-2 flex-wrap mb-6"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm rounded-full capitalize font-medium transition-all duration-200 ${
                filter === f
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md scale-105'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-purple-200"
          >
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium mb-2">
              {filter === 'all' ? 'No posts yet.' : `No ${filter} posts.`}
            </p>
            <p className="text-gray-300 text-sm mb-5">Create your first post and start publishing!</p>
            {filter === 'all' && (
              <Link
                to="/posts/new"
                className="inline-block px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
              >
                Create your first post
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <PostCard
                  post={post}
                  onDelete={handleDelete}
                  onPublishNow={handlePublishNow}
                  publishing={publishingId === post.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
