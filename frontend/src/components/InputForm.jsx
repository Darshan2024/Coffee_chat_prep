import { useState, useRef, useEffect } from "react"

export default function InputForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    person_name: "",
    company: "",
    linkedin_url: "",
    job_description: "",
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeText, setResumeText] = useState("")
  const [useTextFallback, setUseTextFallback] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState({})
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // trigger fade-in on mount
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  function handleFileSelect(file) {
    if (!file) return
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, resume: "Only PDF files are accepted." }))
      return
    }
    setResumeFile(file)
    setErrors((prev) => ({ ...prev, resume: undefined }))
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  function validate() {
    const errs = {}
    if (!form.person_name.trim()) errs.person_name = "Required"
    if (!form.company.trim()) errs.company = "Required"
    if (useTextFallback) {
      if (!resumeText.trim()) errs.resume = "Required"
    } else {
      if (!resumeFile) errs.resume = "Please upload your resume PDF"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      resume_file: useTextFallback ? null : resumeFile,
      resume_text: useTextFallback ? resumeText : null,
    })
  }

  const inputBase =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
  const errorInput = inputBase.replace("border-gray-200", "border-red-300").replace("focus:border-indigo-500", "focus:border-red-400").replace("focus:ring-indigo-100", "focus:ring-red-100")

  const formatSize = (bytes) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-16 px-4">
      <div
        className={`w-full max-w-3xl transition-all duration-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-5 shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Coffee Chat Prep</h1>
          <p className="text-base text-gray-500 mt-2">
            AI-powered prep using the FIT method and TIARA framework
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6"
        >
          {/* Name + Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Person's Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Patrick Collison"
                value={form.person_name}
                onChange={set("person_name")}
                className={errors.person_name ? errorInput : inputBase}
              />
              {errors.person_name && (
                <p className="text-red-500 text-xs mt-1">{errors.person_name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Company <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Stripe"
                value={form.company}
                onChange={set("company")}
                className={errors.company ? errorInput : inputBase}
              />
              {errors.company && (
                <p className="text-red-500 text-xs mt-1">{errors.company}</p>
              )}
            </div>
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              LinkedIn URL{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={form.linkedin_url}
              onChange={set("linkedin_url")}
              className={inputBase}
            />
          </div>

          {/* Resume — PDF upload or text toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700">
                Your Resume <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseTextFallback((v) => !v)
                  setResumeFile(null)
                  setResumeText("")
                  setErrors((p) => ({ ...p, resume: undefined }))
                }}
                className="text-xs text-indigo-500 hover:text-indigo-700 underline transition"
              >
                {useTextFallback ? "Upload PDF instead" : "Paste text instead"}
              </button>
            </div>

            {useTextFallback ? (
              <textarea
                rows={8}
                placeholder="Paste your full resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className={`${errors.resume ? errorInput : inputBase} resize-none leading-relaxed h-48`}
              />
            ) : resumeFile ? (
              /* Selected file display */
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{resumeFile.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(resumeFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setResumeFile(null); fileInputRef.current.value = "" }}
                  className="text-gray-400 hover:text-red-500 transition shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                  isDragging
                    ? "border-indigo-400 bg-indigo-50"
                    : errors.resume
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <div className="flex justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Drop your resume PDF here
                </p>
                <p className="text-xs text-gray-400 mt-1">or click to browse — PDF only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
              </div>
            )}
            {errors.resume && (
              <p className="text-red-500 text-xs mt-1">{errors.resume}</p>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Job Description{" "}
              <span className="text-gray-400 font-normal">
                (optional — enables skills match)
              </span>
            </label>
            <textarea
              rows={6}
              placeholder="Paste the job description if you're applying for a specific role..."
              value={form.job_description}
              onChange={set("job_description")}
              className={`${inputBase} resize-none leading-relaxed h-36`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {isSubmitting ? "Submitting..." : "Generate Prep Guide"}
          </button>
        </form>
      </div>
    </div>
  )
}
