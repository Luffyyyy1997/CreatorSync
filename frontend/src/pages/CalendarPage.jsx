import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { postsApi } from '../api/postsApi.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

// Configure date-fns localizer for react-big-calendar
const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const STATUS_COLORS = {
  draft: '#9ca3af',
  scheduled: '#f59e0b',
  published: '#22c55e',
  failed: '#ef4444',
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
    // Navigate to new post form with date pre-filled
    const iso = start.toISOString().slice(0, 16) // datetime-local format
    navigate(`/posts/new?date=${encodeURIComponent(iso)}`)
  }

  function eventStyleGetter(event) {
    const color = STATUS_COLORS[event.resource.status] || '#3b82f6'
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        borderRadius: '4px',
        color: '#fff',
        fontSize: '12px',
      },
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">
            Click a date to create a post, or click an event to edit it.
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-600">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1 capitalize">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              {status}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ height: '70vh' }}>
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
    </div>
  )
}
