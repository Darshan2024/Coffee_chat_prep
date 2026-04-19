import { useState } from "react"

// ── helpers ──────────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState(null)
  const copy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }
  return { copy, copied }
}

function CopyBtn({ text, id, copy, copied }) {
  return (
    <button
      onClick={() => copy(text, id)}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition shrink-0"
    >
      {copied === id ? (
        <>
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-500">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg">{icon}</span>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
  )
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}>
      {children}
    </div>
  )
}

function InfoCard({ label, text, copyId, copy, copied }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{label}</span>
        <CopyBtn text={text} id={copyId} copy={copy} copied={copied} />
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </Card>
  )
}

function BulletList({ items }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700">
          <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

const TIARA_COLORS = {
  Trends:      "bg-blue-50 text-blue-700 border-blue-100",
  Insights:    "bg-purple-50 text-purple-700 border-purple-100",
  Advice:      "bg-amber-50 text-amber-700 border-amber-100",
  Resources:   "bg-green-50 text-green-700 border-green-100",
  Assignments: "bg-rose-50 text-rose-700 border-rose-100",
}

// ── main component ────────────────────────────────────────────────────────────

export default function ResultsDashboard({ result, onStartOver }) {
  const { copy, copied } = useCopy()
  const [tiaraTab, setTiaraTab] = useState("Trends")

  const r = result
  const tiaraCategories = {
    Trends:      r.tiara_questions.trends,
    Insights:    r.tiara_questions.insights,
    Advice:      r.tiara_questions.advice,
    Resources:   r.tiara_questions.resources,
    Assignments: r.tiara_questions.assignments,
  }

  const scoreColor =
    r.quality_score >= 0.8
      ? "text-green-600 bg-green-50 border-green-200"
      : r.quality_score >= 0.7
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-red-600 bg-red-50 border-red-200"

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">Coffee Chat Prep</span>
          </div>
          <button
            onClick={onStartOver}
            className="text-xs font-medium text-gray-500 hover:text-indigo-600 transition"
          >
            ← Start Over
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* 1. Company Research */}
        <section>
          <SectionHeader icon="🏢" title="Company Research" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <InfoCard label="What They Do"       text={r.company_research.what_they_do}       copyId="wtd" copy={copy} copied={copied} />
            <InfoCard label="Current Momentum"   text={r.company_research.current_momentum}   copyId="cm"  copy={copy} copied={copied} />
            <InfoCard label="Future Initiatives" text={r.company_research.future_initiatives} copyId="fi"  copy={copy} copied={copied} />
            <InfoCard label="Engineering Culture" text={r.company_research.engineering_culture} copyId="ec" copy={copy} copied={copied} />
          </div>
          <Card>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Key Challenges</p>
            <BulletList items={r.company_research.key_challenges} />
          </Card>
        </section>

        {/* 2. Person Research */}
        <section>
          <SectionHeader icon="👤" title="Person Research" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <InfoCard label="Current Role"     text={r.person_research.current_role}        copyId="cr"  copy={copy} copied={copied} />
            <InfoCard label="Career Path"      text={r.person_research.career_path}         copyId="cp"  copy={copy} copied={copied} />
            <InfoCard label="Interests & Focus" text={r.person_research.interests_and_focus} copyId="if" copy={copy} copied={copied} className="sm:col-span-2" />
          </div>
          <Card className="mb-3">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Vibe</p>
            <p className="text-sm text-gray-700 leading-relaxed">{r.person_research.vibe}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Connection Points</p>
            <BulletList items={r.person_research.connection_points} />
          </Card>
        </section>

        {/* 3. FIT Intro */}
        <section>
          <SectionHeader icon="🧵" title="FIT Intro" />
          <div className="space-y-3 mb-4">
            {r.fit_intro.stages.map((stage, i) => (
              <Card key={i} className="border-l-4 border-l-indigo-400">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">{stage.stage}</p>
                <div className="space-y-2">
                  {[
                    { label: "Favorite", text: stage.favorite },
                    { label: "Insight",  text: stage.insight },
                    { label: "Transition", text: stage.transition },
                  ].map(({ label, text }) => (
                    <div key={label}>
                      <span className="text-xs font-semibold text-gray-500">{label}: </span>
                      <span className="text-sm text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Why This Company</p>
              <CopyBtn text={r.fit_intro.why_this_company} id="fitwtc" copy={copy} copied={copied} />
            </div>
            <p className="text-sm text-indigo-900 leading-relaxed">{r.fit_intro.why_this_company}</p>
          </div>
        </section>

        {/* 4. Why This Company */}
        <section>
          <SectionHeader icon="💡" title="Why This Company" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Reason",     text: r.why_this_company.reason,     id: "wtr" },
              { label: "Evidence",   text: r.why_this_company.evidence,   id: "wte" },
              { label: "Connection", text: r.why_this_company.connection, id: "wtconn" },
            ].map(({ label, text, id }) => (
              <Card key={label}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{label}</p>
                  <CopyBtn text={text} id={id} copy={copy} copied={copied} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 5. TIARA Questions */}
        <section>
          <SectionHeader icon="❓" title="TIARA Questions" />
          {/* Tabs */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {Object.keys(tiaraCategories).map((cat) => (
              <button
                key={cat}
                onClick={() => setTiaraTab(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  tiaraTab === cat
                    ? TIARA_COLORS[cat] + " border"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {tiaraCategories[tiaraTab].map((q, i) => (
              <Card key={i}>
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border shrink-0 ${TIARA_COLORS[tiaraTab]}`}>
                    {tiaraTab[0]}
                  </span>
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 leading-relaxed">{q}</p>
                    <CopyBtn text={q} id={`tiara-${tiaraTab}-${i}`} copy={copy} copied={copied} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 6. Call Structure */}
        <section>
          <SectionHeader icon="📞" title="Call Structure" />
          <div className="space-y-3">
            <Card>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Small Talk Openers</p>
              <BulletList items={r.call_structure.small_talk} />
            </Card>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Transition Phrase</p>
                <CopyBtn text={r.call_structure.transition_phrase} id="trans" copy={copy} copied={copied} />
              </div>
              <p className="text-sm text-indigo-900 italic">"{r.call_structure.transition_phrase}"</p>
            </div>

            <Card>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Active Listening Cues</p>
              <BulletList items={r.call_structure.active_listening_cues} />
            </Card>

            <Card>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Wrap-up</p>
              <BulletList items={r.call_structure.wrap_up} />
            </Card>
          </div>
        </section>

        {/* 7. Follow-up Messages */}
        <section>
          <SectionHeader icon="✉️" title="Follow-up Messages" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Thank You Message", text: r.followup_messages.thank_you,         id: "ty" },
              { label: "Application Nudge", text: r.followup_messages.application_nudge, id: "an" },
            ].map(({ label, text, id }) => (
              <Card key={label}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{label}</p>
                  <CopyBtn text={text} id={id} copy={copy} copied={copied} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 8. Metadata bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Quality Score</p>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-lg border ${scoreColor}`}>
                {Math.round(r.quality_score * 100)}%
              </span>
            </div>
            {r.skills_match_score != null && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Skills Match</p>
                <span className="text-sm font-bold text-gray-700">
                  {Math.round((r.skills_match_score > 1 ? r.skills_match_score / 100 : r.skills_match_score) * 100)}%
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onStartOver}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Start Over
          </button>
        </div>

      </div>
    </div>
  )
}
