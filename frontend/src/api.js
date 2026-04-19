const API_BASE = "http://localhost:8000"

export async function submitPrepRequest(formData) {
  const response = await fetch(`${API_BASE}/prep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  })
  if (!response.ok) throw new Error(`Server error: ${response.status}`)
  return response.json() // returns { job_id }
}

export function streamPrepProgress(jobId, onUpdate, onComplete, onError) {
  const es = new EventSource(`${API_BASE}/prep/stream/${jobId}`)

  es.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.status === "complete") {
      es.close()
      onComplete(data.result)
    } else if (data.status === "error") {
      es.close()
      onError(data.message)
    } else {
      onUpdate(data)
    }
  }

  es.onerror = () => {
    es.close()
    onError("Connection lost. Please try again.")
  }

  return () => es.close()
}
