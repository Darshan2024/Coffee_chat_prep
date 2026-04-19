import { useEffect, useState } from "react"

const STEP_LABELS = [
  "Researching person and company...",
  "Parsing your resume...",
  "Matching skills to job description...",
  "Generating your prep guide...",
  "Running quality check...",
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Spinner({ small }) {
  return (
    <svg
      className={`animate-spin text-indigo-600 ${small ? "w-4 h-4" : "w-10 h-10"}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

export default function ProgressStream({ progress }) {
  const [visible, setVisible] = useState([])

  // Fade each step in as it arrives
  useEffect(() => {
    if (progress.length > visible.length) {
      const timer = setTimeout(() => setVisible(progress), 100)
      return () => clearTimeout(timer)
    }
  }, [progress])

  const completedCount = visible.length
  const currentLabel =
    visible.length > 0
      ? visible[visible.length - 1].message
      : "Starting pipeline..."

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Spinner />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Preparing your coffee chat guide
        </h2>
        <p className="text-sm text-gray-500 mb-8">
          This takes about 2 minutes — grab a coffee ☕
        </p>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left space-y-3">
          {STEP_LABELS.map((label, i) => {
            const done = i < completedCount
            const active = i === completedCount
            return (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  done || active ? "opacity-100" : "opacity-30"
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-100">
                  {done ? (
                    <CheckIcon />
                  ) : active ? (
                    <Spinner small />
                  ) : (
                    <span className="text-xs text-gray-300 font-medium">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    done
                      ? "text-gray-500 line-through"
                      : active
                      ? "text-gray-900 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Live message */}
        {visible.length > 0 && (
          <p className="text-xs text-indigo-600 mt-4 animate-pulse font-medium">
            {currentLabel}
          </p>
        )}
      </div>
    </div>
  )
}
