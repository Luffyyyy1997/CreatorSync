/**
 * PostCard — summary card for a single post shown in the dashboard.
 * Props: post, onDelete, onPublishNow
 */
import { Link } from 'react-router-dom'
import PlatformBadge from './PlatformBadge.jsx'

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function PostCard({ post, onDelete, onPublishNow, publishing }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1">{post.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[post.status] || STATUS_STYLES.draft}`}>
          {post.status}
        </span>
      </div>

      {/* Content preview */}
      <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>

      {/* Platforms */}
      <div className="flex flex-wrap gap-1">
        {post.platforms.map((p) => (
          <PlatformBadge key={p} platform={p} connected={null} small />
        ))}
      </div>

      {/* Scheduled time */}
      {post.scheduled_at && (
        <p className="text-xs text-gray-400">
          <span className="font-medium">Scheduled:</span> {formatDate(post.scheduled_at)}
        </p>
      )}

      {/* Error message */}
      {post.status === 'failed' && post.publish_error && (
        <p className="text-xs text-red-500 bg-red-50 rounded p-2">
          {post.publish_error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100 mt-auto">
        <Link
          to={`/posts/${post.id}/edit`}
          className="flex-1 text-center text-sm px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          Edit
        </Link>
        <button
          onClick={() => onPublishNow(post.id)}
          disabled={publishing}
          className="flex-1 text-sm px-3 py-1.5 rounded border border-brand-500 text-brand-600 hover:bg-brand-50 disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : 'Publish Now'}
        </button>
        <button
          onClick={() => onDelete(post.id)}
          className="text-sm px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
