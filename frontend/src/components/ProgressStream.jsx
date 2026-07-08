import { useEffect, useState } from "react"

const API_BASE = "http://localhost:8000"

const STEP_LABELS = [
  "Researching person and company...",
  "Parsing your resume...",
  "Matching skills to job description...",
  "Generating your prep guide...",
  "Running quality check...",
]

const TYPE_CONFIG = {
  stat: {
    bg: "#FFF7ED", border: "#FED7AA",
    badge: "#EA580C", label: "Did you know",
  },
  quote: {
    bg: "#F0FDF4", border: "#BBF7D0",
    badge: "#16A34A", label: "Quote",
  },
  insight: {
    bg: "#EEF2FF", border: "#C7D2FE",
    badge: "#4F46E5", label: "Framework insight",
  },
  tip: {
    bg: "#FDF4FF", border: "#E9D5FF",
    badge: "#9333EA", label: "Pro tip",
  },
}

function CheckIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke="#4F46E5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function Spinner({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "spin 1s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="#C7D2FE" strokeWidth="4" />
      <path fill="#4F46E5" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function ShimmerBar({ width = "100%", height = 10, mb = 0 }) {
  return (
    <div style={{
      height, width, marginBottom: mb, borderRadius: 6,
      background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  )
}

export default function ProgressStream({ progress, personName, company }) {
  const [visible, setVisible] = useState([])
  const [facts, setFacts] = useState([])
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [factsLoading, setFactsLoading] = useState(true)

  // Fade steps in as they arrive
  useEffect(() => {
    if (progress.length > visible.length) {
      const t = setTimeout(() => setVisible(progress), 100)
      return () => clearTimeout(t)
    }
  }, [progress])

  // Fire facts request immediately on mount
  useEffect(() => {
    fetch(`${API_BASE}/generate-facts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_name: personName, company }),
    })
      .then(r => r.json())
      .then(data => {
        console.log("[Facts] Generated:", data.facts)
        setFacts(data.facts)
        setFactsLoading(false)
      })
      .catch(err => {
        console.error("[Facts] Failed:", err)
        setFactsLoading(false)
      })
  }, [])

  // Auto-rotate every 25 seconds
  useEffect(() => {
    if (facts.length === 0) return
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev === facts.length - 1 ? 0 : prev + 1))
    }, 25000)
    return () => clearInterval(interval)
  }, [facts])

  const completedCount = visible.length
  const currentLabel = visible.length > 0
    ? visible[visible.length - 1].message
    : "Starting pipeline..."

  const fact = facts[currentFactIndex]
  const cfg = fact ? (TYPE_CONFIG[fact.type] ?? TYPE_CONFIG.insight) : null

  const navBtn = {
    fontSize: 12, color: "#9CA3AF",
    background: "none", border: "none",
    cursor: "pointer", padding: "4px 8px",
    fontFamily: "Inter, sans-serif",
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#F8F9FA",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 16px", fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        {/* Top spinner + headline */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Spinner size={40} />
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#0F0F0F" }}>
            Preparing your coffee chat guide
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
            This takes about 2 minutes — grab a coffee ☕
          </p>
        </div>

        {/* Step tracker */}
        <div style={{
          background: "#fff", borderRadius: 16,
          border: "0.5px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: "18px 20px", marginBottom: 16,
        }}>
          {STEP_LABELS.map((label, i) => {
            const done = i < completedCount
            const active = i === completedCount
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: i < STEP_LABELS.length - 1 ? 12 : 0,
                opacity: done || active ? 1 : 0.3,
                transition: "opacity 0.5s",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: done ? "#EEF2FF" : active ? "#EEF2FF" : "#F9FAFB",
                  border: `1px solid ${done || active ? "#C7D2FE" : "#E5E7EB"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {done ? <CheckIcon /> : active ? <Spinner size={12} /> : (
                    <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{i + 1}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 13,
                  color: done ? "#9CA3AF" : active ? "#0F0F0F" : "#9CA3AF",
                  fontWeight: active ? 600 : 400,
                  textDecoration: done ? "line-through" : "none",
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Live message */}
        {visible.length > 0 && (
          <p style={{
            textAlign: "center", fontSize: 12, color: "#4F46E5",
            fontWeight: 500, margin: "0 0 16px",
            animation: "fadeUp 0.3s ease",
          }}>
            {currentLabel}
          </p>
        )}

        {/* Fact card */}
        {factsLoading ? (
          <div style={{
            background: "#F9FAFB", border: "0.5px solid #E5E7EB",
            borderRadius: 12, padding: "1.25rem", marginBottom: "1rem",
          }}>
            <ShimmerBar width="40%" height={12} mb={10} />
            <ShimmerBar width="100%" height={10} mb={6} />
            <ShimmerBar width="75%" height={10} />
          </div>
        ) : fact ? (
          <div style={{
            background: cfg.bg, border: `0.5px solid ${cfg.border}`,
            borderRadius: 12, padding: "1.25rem", marginBottom: "0.5rem",
            animation: "fadeUp 0.4s ease",
            transition: "all 0.4s ease",
          }}>
            {/* Badge + dots */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: cfg.badge,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {cfg.label}
              </span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {facts.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentFactIndex(i)}
                    style={{
                      width: i === currentFactIndex ? 16 : 6,
                      height: 6, borderRadius: 99,
                      background: i === currentFactIndex ? cfg.badge : "#E5E7EB",
                      cursor: "pointer", transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>
            </div>

            <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: "0 0 6px", lineHeight: 1.4 }}>
              {fact.headline}
            </p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: "0 0 10px" }}>
              {fact.body}
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontStyle: "italic" }}>
              — {fact.source}
            </p>
          </div>
        ) : null}

        {/* Prev / Next */}
        {!factsLoading && facts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <button style={navBtn}
              onClick={() => setCurrentFactIndex(prev => prev === 0 ? facts.length - 1 : prev - 1)}>
              ← Previous
            </button>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>
              {currentFactIndex + 1} of {facts.length}
            </span>
            <button style={navBtn}
              onClick={() => setCurrentFactIndex(prev => prev === facts.length - 1 ? 0 : prev + 1)}>
              Next →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
