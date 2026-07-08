import { useState, useRef } from "react"

// ── color tokens ──────────────────────────────────────────────────────────────
const C = {
  primary:       "#4F46E5",
  primaryLight:  "#EEF2FF",
  primaryBorder: "#C7D2FE",
  success:       "#22C55E",
  textPrimary:   "#0F0F0F",
  textSecondary: "#6B7280",
  textMuted:     "#9CA3AF",
  border:        "#E5E7EB",
  bg:            "#F8F9FA",
  card:          "#ffffff",
}

// ── small reusables ───────────────────────────────────────────────────────────

function IconBox({ color = C.primary, bg = C.primaryLight, size = 36, children }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: "20px 0" }} />
}

function Label({ children, required, optional }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      {optional && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 6 }}>Optional</span>}
    </label>
  )
}

function Input({ error, ...props }) {
  const base = {
    width: "100%", boxSizing: "border-box",
    border: `1px solid ${error ? "#FCA5A5" : C.border}`,
    borderRadius: 10, padding: "10px 14px",
    fontSize: 14, color: C.textPrimary,
    background: error ? "#FFF5F5" : C.card,
    outline: "none", transition: "border-color 0.15s",
    fontFamily: "Inter, sans-serif",
  }
  return (
    <input
      style={base}
      onFocus={e => e.target.style.borderColor = error ? "#EF4444" : C.primary}
      onBlur={e => e.target.style.borderColor = error ? "#FCA5A5" : C.border}
      {...props}
    />
  )
}

function Textarea({ error, style: styleProp, ...props }) {
  const base = {
    width: "100%", boxSizing: "border-box",
    border: `1px solid ${error ? "#FCA5A5" : C.border}`,
    borderRadius: 10, padding: "10px 14px",
    fontSize: 14, color: C.textPrimary,
    background: error ? "#FFF5F5" : C.card,
    outline: "none", resize: "vertical",
    fontFamily: "Inter, sans-serif", lineHeight: 1.6,
    transition: "border-color 0.15s",
    ...styleProp,
  }
  return (
    <textarea
      style={base}
      onFocus={e => e.target.style.borderColor = error ? "#EF4444" : C.primary}
      onBlur={e => e.target.style.borderColor = error ? "#FCA5A5" : C.border}
      {...props}
    />
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ color: "#EF4444", fontSize: 12, marginTop: 4 }}>{msg}</p>
}

// ── feature card icons ────────────────────────────────────────────────────────
const SearchIcon = () => (
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </>
)
const EditIcon = () => (
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
)
const MailIcon = () => (
  <>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </>
)
const UploadIcon = () => (
  <>
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </>
)
const PlayIcon = () => (
  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
)

// ── section header inside form ────────────────────────────────────────────────
function SectionHeader({ iconChildren, iconBg, iconColor, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <IconBox bg={iconBg} color={iconColor}>{iconChildren}</IconBox>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{title}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSecondary }}>{subtitle}</p>
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function InputForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState({ person_name: "", company: "", linkedin_url: "", job_description: "" })
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState("")
  const [useText, setUseText] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState({})
  const fileRef = useRef(null)

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  function handleFileSelect(file) {
    if (!file) return
    if (file.type !== "application/pdf") {
      setErrors((p) => ({ ...p, resume: "Only PDF files are accepted." }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, resume: "File exceeds 5 MB limit." }))
      return
    }
    setResumeFile(file)
    setErrors((p) => ({ ...p, resume: undefined }))
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  function validate() {
    const errs = {}
    if (!form.person_name.trim()) errs.person_name = "Required"
    if (!form.company.trim()) errs.company = "Required"
    if (useText ? !resumeText.trim() : !resumeFile) errs.resume = useText ? "Required" : "Please upload your resume PDF"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, resume_file: useText ? null : resumeFile, resume_text: useText ? resumeText : null })
  }

  const formatSize = (b) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "60px 16px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* ── Hero ── */}
        <div className="anim-hero" style={{ textAlign: "center", marginBottom: 40 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7,
            background: C.primaryLight, color: C.primary, borderRadius: 99,
            padding: "5px 14px", fontSize: 12, fontWeight: 500, marginBottom: 22 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.primary, display: "inline-block" }} />
            Powered by FIT + TIARA frameworks
          </div>

          {/* Headline */}
          <h1 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 700, lineHeight: 1.2, color: C.textPrimary }}>
            Walk into every coffee chat<br />
            <span style={{ color: C.primary }}>fully prepared.</span>
          </h1>

          {/* Subtitle */}
          <p style={{ margin: "0 auto 20px", maxWidth: 480, fontSize: 15,
            color: C.textSecondary, lineHeight: 1.6 }}>
            AI-powered prep using Steve Dalton's proven methodology from <em>The Two Hour Job Search</em> —
            personalized to the exact person you're meeting.
          </p>

          {/* Checklist */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {["Company + person research", "FIT intro generator", "TIARA questions", "Follow-up drafts"].map((item) => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 5,
                fontSize: 13, color: C.textSecondary }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={C.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── Feature cards ── */}
        <div className="anim-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          gap: 12, marginBottom: 24 }}>
          {[
            {
              icon: <SearchIcon />, title: "Deep research",
              desc: "Scrapes LinkedIn, news, company site automatically",
              highlighted: false,
            },
            {
              icon: <EditIcon />, title: "Personalized output",
              desc: "Every talking point references real specific details",
              highlighted: true,
            },
            {
              icon: <MailIcon />, title: "Follow-up ready",
              desc: "Thank you + application nudge drafted for you",
              highlighted: false,
            },
          ].map(({ icon, title, desc, highlighted }) => (
            <div key={title} style={{
              background: C.card, borderRadius: 14,
              border: highlighted ? `1.5px solid ${C.primaryBorder}` : `1px solid ${C.border}`,
              padding: "16px 14px",
              boxShadow: highlighted ? `0 0 0 3px ${C.primaryLight}` : "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <IconBox>{icon}</IconBox>
              <p style={{ margin: "10px 0 4px", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{title}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Form card ── */}
        <div className="anim-form">
          <form
            onSubmit={handleSubmit}
            style={{
              background: C.card, borderRadius: 20,
              border: `0.5px solid ${C.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              padding: 32,
            }}
          >
            {/* Section 1 */}
            <SectionHeader
              iconChildren={<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>}
              iconBg={C.primaryLight} iconColor={C.primary}
              title="Who are you meeting?"
              subtitle="We'll research them and the company automatically"
            />
            <Divider />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <Label required>Person's Name</Label>
                <Input placeholder="Patrick Collison" value={form.person_name}
                  onChange={set("person_name")} error={errors.person_name} />
                <FieldError msg={errors.person_name} />
              </div>
              <div>
                <Label required>Company</Label>
                <Input placeholder="Stripe" value={form.company}
                  onChange={set("company")} error={errors.company} />
                <FieldError msg={errors.company} />
              </div>
            </div>

            <div>
              <Label optional>LinkedIn URL</Label>
              <Input type="url" placeholder="https://linkedin.com/in/..."
                value={form.linkedin_url} onChange={set("linkedin_url")} />
            </div>

            <Divider />

            {/* Section 2 */}
            <SectionHeader
              iconChildren={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>}
              iconBg="#F0FDF4" iconColor={C.success}
              title="Your background"
              subtitle="We'll tailor talking points to your specific experience"
            />
            <Divider />

            {/* Resume upload */}
            <div style={{ marginBottom: 16 }}>
              <Label required>Your Resume</Label>

              {useText ? (
                <Textarea rows={8} placeholder="Paste your full resume text here..."
                  value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                  error={errors.resume} style={{ height: 180 }} />
              ) : resumeFile ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  border: `1px solid #BBF7D0`, background: "#F0FDF4",
                  borderRadius: 10, padding: "12px 14px",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8,
                    background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                      stroke={C.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.textPrimary,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {resumeFile.name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSecondary }}>
                      {formatSize(resumeFile.size)}
                    </p>
                  </div>
                  <button type="button"
                    onClick={() => { setResumeFile(null); if (fileRef.current) fileRef.current.value = "" }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
                      color: C.textMuted, display: "flex" }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${errors.resume ? "#FCA5A5" : isDragging ? C.primary : C.primaryBorder}`,
                    background: isDragging ? C.primaryLight : errors.resume ? "#FFF5F5" : "#FAFBFF",
                    borderRadius: 10, padding: "28px 20px",
                    textAlign: "center", cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => {
                    if (!isDragging) {
                      e.currentTarget.style.borderColor = C.primary
                      e.currentTarget.style.background = C.primaryLight
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isDragging) {
                      e.currentTarget.style.borderColor = errors.resume ? "#FCA5A5" : C.primaryBorder
                      e.currentTarget.style.background = errors.resume ? "#FFF5F5" : "#FAFBFF"
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                    <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
                      stroke={C.primary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <UploadIcon />
                    </svg>
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: C.textPrimary }}>
                    Drop your resume PDF here
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                    or browse files · PDF only · max 5MB
                  </p>
                  <input ref={fileRef} type="file" accept=".pdf,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileSelect(e.target.files[0])} />
                </div>
              )}

              <FieldError msg={errors.resume} />

              <button type="button"
                onClick={() => { setUseText(v => !v); setResumeFile(null); setResumeText(""); setErrors(p => ({ ...p, resume: undefined })) }}
                style={{ marginTop: 8, background: "none", border: "none", padding: 0,
                  fontSize: 12, color: C.textSecondary, cursor: "pointer",
                  textDecoration: "underline", textDecorationColor: C.border }}>
                {useText ? "Upload PDF instead" : "Prefer to paste text? Switch to text input"}
              </button>
            </div>

            {/* Job description */}
            <div style={{ width: "100%" }}>
              <Label optional>Job Description</Label>
              <textarea
                placeholder="Paste the job description if you're applying for a specific role..."
                value={form.job_description}
                onChange={set("job_description")}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: "140px",
                  resize: "vertical",
                  padding: "12px 14px",
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  color: "#111",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "#fff",
                }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textMuted }}>
                Without a JD, prep focuses on general networking and company research.
              </p>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 24 }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%", height: 48, border: "none",
                  background: isSubmitting ? "#818CF8" : C.primary,
                  borderRadius: 12, color: "#fff",
                  fontSize: 15, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.15s", fontFamily: "Inter, sans-serif",
                }}
                onMouseEnter={e => { if (!isSubmitting) e.target.style.background = "#4338CA" }}
                onMouseLeave={e => { if (!isSubmitting) e.target.style.background = C.primary }}
              >
                {!isSubmitting && (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="white" stroke="none">
                    <PlayIcon />
                  </svg>
                )}
                {isSubmitting ? "Generating…" : "Generate my prep guide"}
              </button>
              <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: 12, color: C.textMuted }}>
                Takes 7–10 minutes · Uses FIT method + TIARA framework
              </p>
            </div>
          </form>
        </div>

        {/* ── What you'll get ── */}
        <div className="anim-what" style={{ marginTop: 24 }}>
          <div style={{
            background: C.primaryLight, border: `1px solid ${C.primaryBorder}`,
            borderRadius: 16, padding: "20px 24px",
          }}>
            <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 600,
              color: C.primary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              What you'll get
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["1", "Company + person research", "Momentum, culture, vibe"],
                ["2", "FIT intro", "Your career story, stage by stage"],
                ["3", "TIARA questions", "10 questions across 5 categories"],
                ["4", "Call structure guide", "Small talk → Q&A → wrap-up"],
                ["5", "Follow-up messages", "Thank you + application nudge"],
              ].map(([num, label, desc]) => (
                <div key={num} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: C.card, border: `1px solid ${C.primaryBorder}`,
                    borderRadius: 99, padding: "4px 10px", flexShrink: 0,
                  }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%",
                      background: C.primary, color: "#fff",
                      fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {num}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.textSecondary }}>→ {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <p style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#D1D5DB" }}>
          Based on <em>The Two Hour Job Search</em> by Steve Dalton · Built with Claude + DeepSeek
        </p>

      </div>
    </div>
  )
}
