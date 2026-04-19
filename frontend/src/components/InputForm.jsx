import { useState } from "react"

export default function InputForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    person_name: "",
    company: "",
    linkedin_url: "",
    resume_text: "",
    job_description: "",
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  function validate() {
    const errs = {}
    if (!form.person_name.trim()) errs.person_name = "Required"
    if (!form.company.trim()) errs.company = "Required"
    if (!form.resume_text.trim()) errs.resume_text = "Required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      person_name: form.person_name.trim(),
      company: form.company.trim(),
      linkedin_url: form.linkedin_url.trim() || null,
      resume_text: form.resume_text.trim(),
      job_description: form.job_description.trim() || null,
    }
    onSubmit(payload)
  }

  const inputBase =
    "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
  const errorInput =
    "w-full rounded-lg border border-red-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition"

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Coffee Chat Prep</h1>
          <p className="text-gray-500 mt-1 text-sm">
            AI-powered prep using the FIT method and TIARA framework
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Name + Company row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
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
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
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

          {/* LinkedIn URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
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

          {/* Resume */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Your Resume <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-gray-400">
                {form.resume_text.length} chars
              </span>
            </div>
            <textarea
              rows={10}
              placeholder="Paste your full resume text here..."
              value={form.resume_text}
              onChange={set("resume_text")}
              className={`${errors.resume_text ? errorInput : inputBase} resize-none leading-relaxed`}
            />
            {errors.resume_text && (
              <p className="text-red-500 text-xs mt-1">{errors.resume_text}</p>
            )}
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Job Description{" "}
              <span className="text-gray-400 font-normal">
                (optional — enables skills match)
              </span>
            </label>
            <textarea
              rows={5}
              placeholder="Paste the job description if you're applying for a specific role..."
              value={form.job_description}
              onChange={set("job_description")}
              className={`${inputBase} resize-none leading-relaxed`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "Submitting..." : "Generate Prep Guide"}
          </button>
        </form>
      </div>
    </div>
  )
}
