import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { platformsApi } from '../api/platformsApi.js'
import PlatformBadge from '../components/PlatformBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useSearchParams } from 'react-router-dom'

const PLATFORMS = ['twitter', 'instagram', 'youtube', 'tiktok']

const PLATFORM_NOTES = {
  twitter: 'Posts text updates up to 280 characters.',
  instagram: 'Requires a Business or Creator account. Image URL is required.',
  youtube: 'Posts YouTube Community updates.',
  tiktok: 'Requires developer API approval. Video URL is required.',
}

export default function ConnectPlatformsPage() {
  const [status, setStatus] = useState({})
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchStatus()
    // Show success toast if redirected back from OAuth
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Connect Platforms</h1>
        <p className="text-gray-500 text-sm mt-1">
          Connect your social media accounts to enable publishing.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {PLATFORMS.map((p) => (
            <div
              key={p}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <PlatformBadge platform={p} connected={status[p]} />
                <p className="text-xs text-gray-400">{PLATFORM_NOTES[p]}</p>
              </div>

              <div>
                {status[p] ? (
                  <button
                    onClick={() => handleDisconnect(p)}
                    disabled={disconnecting === p}
                    className="px-4 py-2 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {disconnecting === p ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => platformsApi.connect(p)}
                    className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
        <strong>Note:</strong> OAuth credentials for each platform must be configured in the
        backend environment variables before connections will work.
        See the <code>.env.example</code> file for required keys.
      </div>
    </div>
  )
}
