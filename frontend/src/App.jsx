import { useState } from "react"
import InputForm from "./components/InputForm"
import ProgressStream from "./components/ProgressStream"
import ResultsDashboard from "./components/ResultsDashboard"
import { submitPrepRequest, streamPrepProgress } from "./api"

export default function App() {
  const [step, setStep] = useState("input")
  const [progress, setProgress] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [meetingInfo, setMeetingInfo] = useState({ person_name: "", company: "" })

  async function handleSubmit(formData) {
    setMeetingInfo({ person_name: formData.person_name, company: formData.company })
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
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 50, background: "#FEF2F2", border: "1px solid #FECACA",
          color: "#DC2626", fontSize: 13, padding: "10px 16px",
          borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          {error}
        </div>
      )}

      {step === "input" && (
        <InputForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}

      {step === "loading" && (
        <ProgressStream
          progress={progress}
          personName={meetingInfo.person_name}
          company={meetingInfo.company}
        />
      )}

      {step === "results" && result && (
        <ResultsDashboard result={result} onStartOver={handleStartOver} />
      )}
    </>
  )
}
