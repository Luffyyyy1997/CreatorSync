/**
 * PostCard — summary card with hover lift, animated status badge, platform icons.
 * Props: post, onDelete, onPublishNow, publishing
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PlatformBadge from './PlatformBadge.jsx'

const STATUS_META = {
  draft:     { cls: 'bg-gray-100 text-gray-500 border border-gray-200',       dot: 'bg-gray-400',   label: 'Draft' },
  scheduled: { cls: 'bg-amber-50 text-amber-700 border border-amber-200',    dot: 'bg-amber-400',  label: 'Scheduled' },
  published: { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-400', label: 'Published' },
  failed:    { cls: 'bg-red-50 text-red-600 border border-red-200',           dot: 'bg-red-500',    label: 'Failed' },
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function PostCard({ post, onDelete, onPublishNow, publishing }) {
  const meta = STATUS_META[post.status] || STATUS_META.draft

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(109,40,217,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 cursor-default h-full"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1 text-base">{post.title}</h3>
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${meta.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {/* Content preview */}
      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>

      {/* Platforms */}
      <div className="flex flex-wrap gap-1">
        {post.platforms.map((p) => (
          <PlatformBadge key={p} platform={p} connected={null} small />
        ))}
      </div>

      {/* Scheduled time */}
      {post.scheduled_at && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDate(post.scheduled_at)}
        </div>
      )}

      {/* Error message */}
      {post.status === 'failed' && post.publish_error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg p-2 border border-red-100">
          {post.publish_error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 mt-auto">
        <Link
          to={`/posts/${post.id}/edit`}
          className="flex-1 text-center text-sm px-3 py-2 rounded-xl border border-gray-200 hover:border-purple-300 hover:text-purple-600 text-gray-600 transition-all duration-150"
        >
          Edit
        </Link>
        <button
          onClick={() => onPublishNow(post.id)}
          disabled={publishing}
          className="flex-1 text-sm px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-150 font-medium"
        >
          {publishing ? 'Publishing…' : 'Publish Now'}
        </button>
        <button
          onClick={() => onDelete(post.id)}
          className="text-sm px-3 py-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}
