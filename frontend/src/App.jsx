import { useState } from "react"
import InputForm from "./components/InputForm"
import ProgressStream from "./components/ProgressStream"
import ResultsDashboard from "./components/ResultsDashboard"
import { submitPrepRequest, streamPrepProgress } from "./api"

export default function App() {
  const [step, setStep] = useState("input")       // "input" | "loading" | "results"
  const [progress, setProgress] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(formData) {
    setIsSubmitting(true)
    setError(null)
    try {
      const { job_id } = await submitPrepRequest(formData)
      setProgress([])
      setStep("loading")

      streamPrepProgress(
        job_id,
        (update) => setProgress((prev) => [...prev, update]),
        (res) => {
          setResult(res)
          setStep("results")
        },
        (err) => {
          setError(err)
          setStep("input")
        }
      )
    } catch (err) {
      setError(err.message)
      setStep("input")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartOver() {
    setStep("input")
    setProgress([])
    setResult(null)
    setError(null)
  }

  return (
    <>
      {error && step === "input" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl shadow-sm">
          {error}
        </div>
      )}

      {step === "input" && (
        <InputForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}

      {step === "loading" && (
        <ProgressStream progress={progress} />
      )}

      {step === "results" && result && (
        <ResultsDashboard result={result} onStartOver={handleStartOver} />
      )}
    </>
  )
}
