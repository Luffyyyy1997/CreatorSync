import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { postsApi } from '../api/postsApi.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

// Configure date-fns localizer for react-big-calendar
const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const PLATFORM_COLORS = {
  twitter:   '#000000',
  instagram: '#e1306c',
  youtube:   '#ff0000',
  tiktok:    '#69c9d0',
}

const STATUS_COLORS = {
  draft:     '#9ca3af',
  scheduled: '#f59e0b',
  published: '#22c55e',
  failed:    '#ef4444',
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postsApi.list()
      .then((data) => setPosts(data))
      .catch(() => toast.error('Failed to load calendar.'))
      .finally(() => setLoading(false))
  }, [])

  // Convert posts to calendar events (only those with a scheduled_at)
  const events = posts
    .filter((p) => p.scheduled_at)
    .map((p) => ({
      id: p.id,
      title: p.title,
      start: new Date(p.scheduled_at),
      end: new Date(p.scheduled_at),
      resource: p,
    }))

  function handleSelectEvent(event) {
    navigate(`/posts/${event.id}/edit`)
  }

  function handleSelectSlot({ start }) {
    const iso = start.toISOString().slice(0, 16)
    navigate(`/posts/new?date=${encodeURIComponent(iso)}`)
  }

  function eventStyleGetter(event) {
    const post = event.resource
    // Use platform color if single platform, else status color
    const color = post.platforms?.length === 1
      ? (PLATFORM_COLORS[post.platforms[0]] || STATUS_COLORS[post.status] || '#6d28d9')
      : (STATUS_COLORS[post.status] || '#6d28d9')
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        borderRadius: '6px',
        color: '#fff',
        fontSize: '11px',
        fontWeight: '600',
        padding: '2px 6px',
        boxShadow: `0 1px 4px ${color}44`,
      },
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-500 text-sm mt-1">
              Click a date to create a post, or click an event to edit it.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">Platform colors:</div>
            {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
              <span key={platform} className="flex items-center gap-1.5 text-xs text-gray-600 capitalize">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                {platform}
              </span>
            ))}
          </div>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-3 mb-5">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5 text-xs text-gray-500 capitalize bg-white border border-gray-200 rounded-full px-2.5 py-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {status}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6"
            style={{ height: '70vh' }}
          >
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              popup
            />
          </div>
        )}

        {events.length === 0 && !loading && (
          <p className="text-center text-gray-400 mt-4 text-sm">
            No scheduled posts yet. Click a date to create one.
          </p>
        )}
      </motion.div>
    </div>
  )
}
