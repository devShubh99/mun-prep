import { useState, useRef } from 'react'
import { useConference } from '../../hooks/useConference'
import { evaluateSpeech, sttProxy } from '../../lib/api'
import { Mic, Square, Send } from 'lucide-react'
import type { SpeechEvaluation } from '../../types'

export default function SpeechPractice() {
  const { conference } = useConference()
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const [evaluation, setEvaluation] = useState<SpeechEvaluation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      chunks.current = []
      recorder.ondataavailable = (e) => chunks.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm;codecs=opus' })
        const buffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
        const base64 = btoa(binary)
        try {
          const { transcript: t } = await sttProxy({ audioBase64: base64 })
          setTranscript(t)
        } catch {
          setTranscript('(Transcription failed. Try typing manually.)')
        }
        stream.getTracks().forEach(track => track.stop())
      }
      recorder.start()
      mediaRecorder.current = recorder
      setRecording(true)
    } catch {
      setError('Microphone access denied. Allow mic access or type your speech manually.')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const handleEvaluate = async () => {
    if (!transcript.trim() || !conference) return
    setLoading(true)
    setError(null)
    try {
      const result = await evaluateSpeech({
        transcript,
        researchContext: conference.research_data?.content || '',
        cheatSheetContext: JSON.stringify(conference.cheat_sheet_data || {}),
      })
      setEvaluation(result)
    } catch (e: any) {
      setError(e?.message || 'Failed to evaluate speech')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2">{error}</div>
      )}
      <div className="card-light">
        <h3 className="font-[500] text-sm text-body mb-4">Record or type your speech</h3>
        <div className="flex items-center gap-3 mb-4">
          {!recording ? (
            <button onClick={startRecording} className="btn-primary">
              <Mic className="w-4 h-4" /> Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} className="btn bg-error text-white hover:bg-red-600">
              <Square className="w-4 h-4" /> Stop Recording
            </button>
          )}
        </div>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Your speech will appear here after recording, or type it manually…"
          className="input min-h-[120px] resize-y"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleEvaluate}
            disabled={loading || !transcript.trim()}
            className="btn-primary"
          >
            {loading ? 'Evaluating…' : 'Evaluate Speech'}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {evaluation && (
        <div className="space-y-4">
          <div className="card-light">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[500] text-lg text-ink">Evaluation</h3>
              <span className="text-2xl font-serif text-primary">
                {evaluation.overallScore.toFixed(1)}/10
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(evaluation.evaluation).map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-[500] text-body capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-[500] text-primary">{val.score}/10</span>
                  </div>
                  <div className="w-full bg-surface-soft rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5" style={{ width: `${val.score * 10}%` }} />
                  </div>
                  <p className="text-xs text-muted mt-1">{val.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-light">
            <h3 className="font-[500] text-sm text-body mb-2">Suggested Improvements</h3>
            <ul className="list-disc pl-5 space-y-1">
              {evaluation.suggestedImprovements.map((s, i) => (
                <li key={i} className="text-sm text-body">{s}</li>
              ))}
            </ul>
          </div>

          <div className="card-light">
            <h3 className="font-[500] text-sm text-body mb-2">Rebuttal Ready</h3>
            <p className="text-sm text-body">{evaluation.rebuttalReady}</p>
          </div>
        </div>
      )}
    </div>
  )
}
