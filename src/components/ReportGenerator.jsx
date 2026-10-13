import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ReportCard from './ReportCard'
import { apiGet, apiPut } from '../utils/api'

function defaultSettings() {
  const now = new Date()
  const month = now.toLocaleString('en-US', { month: 'long' })
  const yy = String(now.getFullYear()).slice(-2)
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return {
    monthLabel: `${month} '${yy}`,
    tillDate: `${dd}/${mm}/${yy}`,
    matchesPlayed: 1,
    wins: '',
    losses: '',
    showWinsLosses: false,
    customMessage: '',
  }
}

const inputClass =
  'rounded-lg border border-purple-500/30 bg-[#1a0f2e] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-amber-400/60'
const labelClass = 'text-xs font-bold uppercase tracking-wider text-purple-300'

export default function ReportGenerator({
  ranked,
  battingLeader,
  bowlingLeader,
  fieldingLeader,
  overallLeader,
}) {
  const [settings, setSettings] = useState(defaultSettings)
  const [generating, setGenerating] = useState(false)
  const cardRef = useRef(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    apiGet('/api/report-settings')
      .then((data) => {
        if (cancelled) return
        setSettings({ ...defaultSettings(), ...data })
      })
      .catch((err) => console.error('Failed to load report settings from the API:', err))
      .finally(() => {
        if (!cancelled) loadedRef.current = true
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) return
    apiPut('/api/report-settings', settings).catch((err) =>
      console.error('Failed to save report settings to the API:', err),
    )
  }, [settings])

  function updateField(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  function fileSlug() {
    return `DBCC-${settings.monthLabel.replace(/[^a-z0-9]+/gi, '-')}`
  }

  async function renderCanvas() {
    await document.fonts.ready
    return html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      // html2canvas rasterizes a cloned copy of the card in its own hidden
      // iframe. That clone has its own FontFaceSet, separate from the one
      // `document.fonts.ready` above just waited on — without this, the
      // custom fonts can still be mid-fetch inside the clone when the
      // canvas is painted, so the export silently falls back to a system
      // font (thinner weight, different glyph widths → text reads lighter
      // and the centered headers/labels drift off-center even though nothing
      // moved on screen).
      onclone: (clonedDoc) => clonedDoc.fonts.ready,
    })
  }

  async function handleDownloadImage() {
    setGenerating(true)
    try {
      const canvas = await renderCanvas()
      const link = document.createElement('a')
      link.download = `${fileSlug()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownloadPdf() {
    setGenerating(true)
    try {
      const canvas = await renderCanvas()
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileSlug()}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-purple-500/20 bg-[#150f22] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
        Monthly Report
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Month</span>
          <input
            type="text"
            value={settings.monthLabel}
            onChange={(e) => updateField('monthLabel', e.target.value)}
            placeholder="Enter month"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Till Date</span>
          <input
            type="text"
            value={settings.tillDate}
            onChange={(e) => updateField('tillDate', e.target.value)}
            placeholder="Enter date"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Match Number</span>
          <input
            type="number"
            min="0"
            value={settings.matchesPlayed}
            onChange={(e) => updateField('matchesPlayed', e.target.value)}
            placeholder="Enter match number"
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
        <input
          type="checkbox"
          checked={settings.showWinsLosses}
          onChange={(e) => updateField('showWinsLosses', e.target.checked)}
          className="h-4 w-4 accent-amber-400"
        />
        Show Wins / Losses record
      </label>
      {settings.showWinsLosses && (
        <div className="grid grid-cols-2 gap-3 sm:w-1/2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Wins</span>
            <input
              type="number"
              min="0"
              value={settings.wins}
              onChange={(e) => updateField('wins', e.target.value)}
              placeholder="Enter wins"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Losses</span>
            <input
              type="number"
              min="0"
              value={settings.losses}
              onChange={(e) => updateField('losses', e.target.value)}
              placeholder="Enter losses"
              className={inputClass}
            />
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Message (optional)</span>
        <textarea
          value={settings.customMessage}
          onChange={(e) => updateField('customMessage', e.target.value)}
          placeholder="Enter a note, shoutout, or announcement to show on the report"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={generating}
          onClick={handleDownloadImage}
          className="rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200 transition-all hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? 'Generating…' : '🖼 Download Image'}
        </button>
        <button
          type="button"
          disabled={generating}
          onClick={handleDownloadPdf}
          className="rounded-lg border border-purple-400/40 bg-purple-400/15 px-4 py-2 text-sm font-bold text-purple-200 transition-all hover:bg-purple-400/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? 'Generating…' : '📄 Download PDF'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-purple-500/10 bg-black/20 p-3">
        <ReportCard
          ref={cardRef}
          ranked={ranked}
          battingLeader={battingLeader}
          bowlingLeader={bowlingLeader}
          fieldingLeader={fieldingLeader}
          overallLeader={overallLeader}
          monthLabel={settings.monthLabel}
          tillDate={settings.tillDate}
          matchesPlayed={settings.matchesPlayed}
          totalPlayers={ranked.length}
          wins={settings.wins}
          losses={settings.losses}
          showWinsLosses={settings.showWinsLosses}
          customMessage={settings.customMessage}
        />
      </div>
    </div>
  )
}
