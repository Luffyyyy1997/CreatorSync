/**
 * Standalone AI Assistant page for content brainstorming.
 * Shows the full AiSuggestionPanel without being attached to a specific post.
 */
import AiSuggestionPanel from '../components/AiSuggestionPanel.jsx'

export default function AiAssistantPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate content ideas, captions, and hashtags powered by OpenAI.
        </p>
      </div>

      <AiSuggestionPanel />

      <div className="mt-6 bg-brand-50 border border-brand-100 rounded-xl p-4 text-xs text-brand-700">
        <strong>Tips:</strong>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Be specific with your topic for better results (e.g. "morning skincare routine for dry skin").</li>
          <li>Select the target platform to get platform-optimized suggestions.</li>
          <li>Use the AI panel inside the Post editor to instantly insert generated content.</li>
          <li>Hashtag recommendations are limited to 15 per request.</li>
        </ul>
      </div>
    </div>
  )
}
