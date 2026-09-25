import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { platformsApi } from '../api/platformsApi.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useSearchParams } from 'react-router-dom'

const PLATFORMS = ['twitter', 'instagram', 'youtube', 'tiktok']

const PLATFORM_META = {
  twitter: {
    label: 'Twitter / X',
    note: 'Posts text updates up to 280 characters.',
    cardClass: 'bg-black',
    textClass: 'text-white',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.004 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    connectCls: 'bg-white text-black hover:bg-gray-100',
    disconnectCls: 'bg-white/20 text-white hover:bg-white/30',
  },
  instagram: {
    label: 'Instagram',
    note: 'Requires a Business or Creator account. Image URL is required.',
    cardClass: 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500',
    textClass: 'text-white',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    connectCls: 'bg-white text-pink-600 hover:bg-pink-50',
    disconnectCls: 'bg-white/20 text-white hover:bg-white/30',
  },
  youtube: {
    label: 'YouTube',
    note: 'Posts YouTube Community updates.',
    cardClass: 'bg-red-600',
    textClass: 'text-white',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    connectCls: 'bg-white text-red-600 hover:bg-red-50',
    disconnectCls: 'bg-white/20 text-white hover:bg-white/30',
  },
  tiktok: {
    label: 'TikTok',
    note: 'Requires developer API approval. Video URL is required.',
    cardClass: 'bg-gray-900',
    textClass: 'text-white',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
      </svg>
    ),
    connectCls: 'bg-[#69c9d0] text-black hover:brightness-110',
    disconnectCls: 'bg-white/20 text-white hover:bg-white/30',
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function ConnectPlatformsPage() {
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchStatus()
    const connected = searchParams.get('connected')
    if (connected) {
      toast.success(`${connected} connected successfully!`)
    }
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const data = await platformsApi.status()
      setStatus(data)
    } catch {
      toast.error('Failed to load platform status.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect(platform) {
    if (!window.confirm(`Disconnect ${platform}? Your stored token will be deleted.`)) return
    setDisconnecting(platform)
    try {
      await platformsApi.disconnect(platform)
      setStatus((s) => ({ ...s, [platform]: false }))
      toast.success(`${platform} disconnected.`)
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to disconnect ${platform}.`)
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900">Connect Platforms</h1>
        <p className="text-gray-500 text-sm mt-1">
          Connect your social media accounts to enable publishing.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORMS.map((p, i) => {
            const meta = PLATFORM_META[p]
            const isConnected = !!status[p]
            return (
              <motion.div
                key={p}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className={`${meta.cardClass} rounded-2xl p-5 flex flex-col gap-3 shadow-md hover:shadow-xl transition-shadow duration-200`}
              >
                {/* Icon + Name row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={meta.textClass}>{meta.icon}</div>
                    <span className={`font-bold text-lg ${meta.textClass}`}>{meta.label}</span>
                  </div>
                  {/* Connected badge */}
                  <AnimatePresence mode="wait">
                    {isConnected ? (
                      <motion.div
                        key="connected"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1"
                      >
                        <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-white font-medium">Connected</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="disconnected"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-1"
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-xs text-white/70 font-medium">Not connected</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Note */}
                <p className={`text-xs ${meta.textClass} opacity-70`}>{meta.note}</p>

                {/* Action button */}
                <div className="pt-1">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(p)}
                      disabled={disconnecting === p}
                      className={`w-full py-2 text-sm rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 ${meta.disconnectCls}`}
                    >
                      {disconnecting === p ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={() => platformsApi.connect(p)}
                      className={`w-full py-2 text-sm rounded-xl font-semibold transition-all duration-150 ${meta.connectCls}`}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
        <strong>Note:</strong> OAuth credentials for each platform must be configured in the
        backend environment variables before connections will work.
        See the <code>.env.example</code> file for required keys.
      </div>
    </div>
  )
}
