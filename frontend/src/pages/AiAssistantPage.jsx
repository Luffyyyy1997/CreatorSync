/**
 * Standalone AI Assistant page for content brainstorming.
 */
import { motion } from 'framer-motion'
import AiSuggestionPanel from '../components/AiSuggestionPanel.jsx'

export default function AiAssistantPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <span>✨</span> Powered by OpenAI GPT-4o-mini
        </div>
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">
          Generate content ideas, captions, and hashtags in seconds. Describe your topic and let AI do the heavy lifting.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <AiSuggestionPanel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5 text-xs text-purple-700"
      >
        <p className="font-bold text-sm mb-3 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Tips for better results
        </p>
        <ul className="space-y-2 list-none">
          {[
            'Be specific: "morning skincare routine for dry skin" beats "skincare".',
            'Select the target platform to get platform-optimized suggestions.',
            'Use the AI panel inside the Post editor to instantly insert generated content.',
            'Hashtag recommendations are limited to 15 per request.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 shrink-0 mt-0.5 text-[10px] font-bold">{i + 1}</span>
              {tip}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
