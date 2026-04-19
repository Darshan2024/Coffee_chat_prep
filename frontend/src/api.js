const API_BASE = "http://localhost:8000"

export async function submitPrepRequest(data) {
  // PDF path: send multipart form data
  // Text fallback path: send JSON
  let response

  if (data.resume_file) {
    const formData = new FormData()
    formData.append("person_name", data.person_name)
    formData.append("company", data.company)
    if (data.linkedin_url) formData.append("linkedin_url", data.linkedin_url)
    formData.append("resume_file", data.resume_file)
    if (data.job_description) formData.append("job_description", data.job_description)

    // No Content-Type header — browser sets multipart boundary automatically
    response = await fetch(`${API_BASE}/prep`, {
      method: "POST",
      body: formData,
    })
  } else {
    // Text fallback
    response = await fetch(`${API_BASE}/prep`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_name: data.person_name,
        company: data.company,
        linkedin_url: data.linkedin_url || null,
        resume_text: data.resume_text,
        job_description: data.job_description || null,
      }),
    })
  }

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
