import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataVersion } from '@/data/store'
import { flowSteps, getFlowProgress } from '@/lib/flowSteps'
import type { FlowStep } from '@/lib/flowSteps'
import { resetDemoScenario, DEMO_COMP_ID } from '@/data/demoScenario'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Sparkles, Check, ArrowRight, Wand2, RotateCcw, X, Trophy, Upload, Download } from 'lucide-react'

interface Rect { top: number; left: number; width: number; height: number }
type TFn = (key: string) => string

const RESULTS_ROUTE = `/results/competition/${DEMO_COMP_ID}`
const CREATE_ROUTE = '/competitions/create'
const CREATE_TOUR = [
  { target: 'create-name', key: 'name' },
  { target: 'create-game', key: 'game' },
  { target: 'create-carClass', key: 'carClass' },
  { target: 'create-desc', key: 'desc' },
  { target: 'create-regions', key: 'regions' },
]

interface TourCtl {
  idx: number
  total: number
  stepKey: string
  onPrev: () => void
  onNext: () => void
  onFinish: () => void
}

export function FlowAssistant() {
  const { t } = useTranslation()
  const version = useDataVersion()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())
  const [rect, setRect] = useState<Rect | null>(null)
  const [flash, setFlash] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)
  const scrolledRef = useRef('')
  const prevHasTarget = useRef(false)
  const prevStepIdRef = useRef<string | null>(null)
  const prevDoneRef = useRef(0)
  const mountedRef = useRef(false)

  const { doneCount, requiredCount, currentIndex } = getFlowProgress(skipped)
  const current = flowSteps[currentIndex]
  const allDone = doneCount >= requiredCount

  const onCreatePage = location.pathname === CREATE_ROUTE
  const isCreateTour = !allDone && current.id === 'create' && onCreatePage
  const tourIdx = Math.min(tourIndex, CREATE_TOUR.length - 1)
  const activeTarget = !active || allDone ? undefined : isCreateTour ? CREATE_TOUR[tourIdx].target : current.target

  // Locate/track the active on-page target; step the panel aside when one is present.
  useEffect(() => {
    const sel = activeTarget ? `[data-flow="${activeTarget}"]` : null
    const scrolledKey = `${activeTarget}|${location.pathname}`
    const applyHasTarget = (has: boolean) => {
      if (has && !prevHasTarget.current) setExpanded(false)
      if (!has && prevHasTarget.current) setExpanded(true)
      prevHasTarget.current = has
    }
    const measure = () => {
      const el = sel ? document.querySelector<HTMLElement>(sel) : null
      if (!el) {
        setRect(prev => (prev === null ? prev : null))
        applyHasTarget(false)
        return
      }
      const r = el.getBoundingClientRect()
      const next: Rect = { top: r.top, left: r.left, width: r.width, height: r.height }
      setRect(prev => (prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height ? prev : next))
      applyHasTarget(true)
      if (scrolledRef.current !== scrolledKey && (r.top < 80 || r.bottom > window.innerHeight - 24)) {
        scrolledRef.current = scrolledKey
        el.scrollIntoView({ block: 'center' })
      }
    }
    const raf = requestAnimationFrame(measure)
    const timers = [120, 300, 600, 1000].map(d => window.setTimeout(measure, d))
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [activeTarget, location.pathname, location.search, version, allDone])

  // Take the user to the right page when a page-step becomes current (once per transition).
  useEffect(() => {
    const prev = prevStepIdRef.current
    prevStepIdRef.current = current.id
    if (!active) return
    if (prev === null || prev === current.id) return
    if (allDone || !current.target) return
    const route = current.route()
    if (location.pathname !== route.split('?')[0]) navigate(route)
  }, [current, active, allDone, location.pathname, navigate])

  // Brief "step done" confirmation when progress advances.
  useEffect(() => {
    const prev = prevDoneRef.current
    prevDoneRef.current = doneCount
    if (!mountedRef.current) { mountedRef.current = true; return }
    if (doneCount > prev) {
      const a = window.setTimeout(() => setFlash(true), 0)
      const b = window.setTimeout(() => setFlash(false), 1900)
      return () => { clearTimeout(a); clearTimeout(b) }
    }
  }, [doneCount])

  const skip = (id: string) => setSkipped(prev => new Set(prev).add(id))
  const reset = () => {
    resetDemoScenario()
    setSkipped(new Set())
    setExpanded(true)
    setTourIndex(0)
    prevStepIdRef.current = null
    if (location.pathname.startsWith('/results/competition/') || location.pathname.startsWith('/registrations') || location.pathname.startsWith('/competitions/')) {
      navigate('/competitions')
    }
  }
  const pct = requiredCount > 0 ? Math.round((doneCount / requiredCount) * 100) : 0

  const tourCtl: TourCtl | undefined = isCreateTour ? {
    idx: tourIdx,
    total: CREATE_TOUR.length,
    stepKey: CREATE_TOUR[tourIdx].key,
    onPrev: () => setTourIndex(i => Math.max(i - 1, 0)),
    onNext: () => setTourIndex(i => Math.min(i + 1, CREATE_TOUR.length - 1)),
    onFinish: () => { current.run?.(); setTourIndex(0) },
  } : undefined

  return (
    <>
      {active && rect && !allDone && <Spotlight rect={rect} step={current} t={t} showBubble={!expanded} tour={tourCtl} />}

      {active && flash && (
        <div className="fixed bottom-24 right-5 z-[61] flex items-center gap-1.5 rounded-lg bg-green-600 text-white text-xs font-medium px-3 py-2 shadow-lg">
          <Check className="w-3.5 h-3.5" />{t('flowAssistant.stepDone')}
        </div>
      )}

      {!active ? (
        <button
          onClick={() => { setActive(true); setExpanded(true) }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-lg pl-3 pr-4 py-2.5 hover:bg-blue-700 transition-colors"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="text-left">
            <span className="block text-xs font-semibold leading-tight">{t('flowAssistant.launch')}</span>
            <span className="block text-[10px] text-blue-100 leading-tight mt-0.5">{t('flowAssistant.launchHint')}</span>
          </span>
        </button>
      ) : !expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-lg pl-3 pr-4 py-2.5 hover:bg-blue-700 transition-colors"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="text-left">
            <span className="block text-xs font-semibold leading-tight">
              {allDone ? t('flowAssistant.allDoneTitle') : `${currentIndex + 1}. ${t(`flowAssistant.steps.${current.id}.title`)}`}
            </span>
            <span className="block text-[10px] text-blue-100 leading-tight mt-0.5">
              {rect ? t('flowAssistant.miniHint') : `${doneCount}/${requiredCount}`}
            </span>
          </span>
        </button>
      ) : (
        <div className="fixed bottom-5 right-5 z-50 w-80 max-h-[84vh] flex flex-col rounded-xl bg-white shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">{t('flowAssistant.title')}</span>
            </div>
            <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600" title={t('flowAssistant.collapse')}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 pt-3 shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{t('flowAssistant.progress')}</span>
              <span>{doneCount}/{requiredCount}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-2 py-3 space-y-0.5">
              {flowSteps.map((step, i) => {
                const done = step.isDone()
                const isCurrent = i === currentIndex && !allDone
                const isSkipped = skipped.has(step.id) && !done
                return (
                  <button
                    key={step.id}
                    onClick={() => navigate(step.route())}
                    className={cn('w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors', isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50')}
                  >
                    <span className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold shrink-0',
                      done ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500',
                    )}>
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span className={cn('text-xs font-medium truncate', done ? 'text-gray-400' : isCurrent ? 'text-blue-900' : 'text-gray-700')}>
                      {t(`flowAssistant.steps.${step.id}.title`)}
                      {step.optional && <span className="ml-1 text-[10px] text-gray-400">{t('flowAssistant.optional')}</span>}
                      {isSkipped && <span className="ml-1 text-[10px] text-gray-400">· {t('flowAssistant.skipped')}</span>}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-gray-100 p-3 space-y-3">
              {allDone ? (
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-green-700">{t('flowAssistant.allDoneTitle')}</div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">{t('flowAssistant.allDoneDesc')}</div>
                  </div>
                  <Button size="sm" variant="primary" className="w-full" onClick={() => navigate(RESULTS_ROUTE)}>
                    <Trophy className="w-3.5 h-3.5 mr-1" />{t('flowAssistant.viewStandings')}
                  </Button>
                </div>
              ) : current.id === 'create' ? (
                <>
                  {!onCreatePage && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                      <div className="text-xs font-semibold text-blue-900 mb-1">{t('flowAssistant.overviewTitle')}</div>
                      <div className="text-[11px] text-blue-800 leading-relaxed">{t('flowAssistant.overview')}</div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-semibold shrink-0">1</span>
                    <span className="text-sm font-semibold text-gray-900">{t('flowAssistant.steps.create.title')}</span>
                  </div>
                  {onCreatePage && tourCtl ? (
                    <TourBody ctl={tourCtl} t={t} />
                  ) : (
                    <>
                      <div className="text-xs text-gray-600 leading-relaxed">{t('flowAssistant.steps.create.summary')}</div>
                      <Button size="sm" variant="primary" className="w-full" onClick={() => navigate(CREATE_ROUTE)}>
                        <ArrowRight className="w-3.5 h-3.5 mr-1" />{t('flowAssistant.startCreate')}
                      </Button>
                    </>
                  )}
                </>
              ) : !current.target ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-semibold shrink-0">{currentIndex + 1}</span>
                    <span className="text-sm font-semibold text-gray-900">{t(`flowAssistant.steps.${current.id}.title`)}</span>
                  </div>
                  <Explainer step={current} t={t} />
                  <div className="flex items-center gap-2 pt-0.5">
                    {current.run && (
                      <Button size="sm" variant="primary" className="flex-1" onClick={() => current.run!()}>
                        <Wand2 className="w-3.5 h-3.5 mr-1" />{t('flowAssistant.doItForMe')}
                      </Button>
                    )}
                    {current.optional && (
                      <button onClick={() => skip(current.id)} className="text-xs text-gray-400 hover:text-gray-600 px-1">
                        {t('flowAssistant.skip')}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-semibold shrink-0">{currentIndex + 1}</span>
                    <span className="text-sm font-semibold text-gray-900">{t(`flowAssistant.steps.${current.id}.title`)}</span>
                  </div>
                  <Explainer step={current} t={t} />
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button size="sm" variant="primary" onClick={() => navigate(current.route())}>
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />{t('flowAssistant.goToStep')}
                    </Button>
                    {current.run && (
                      <Button size="sm" variant="secondary" onClick={() => current.run!()}>
                        <Wand2 className="w-3.5 h-3.5 mr-1" />{t('flowAssistant.doItForMe')}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 px-3 py-2 shrink-0 flex items-center justify-between">
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />{t('flowAssistant.reset')}
            </button>
            <button onClick={() => { setActive(false); setExpanded(false) }} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-3.5 h-3.5" />{t('flowAssistant.exit')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  )
}

function FlowChips({ text, dark }: { text: string; dark?: boolean }) {
  const parts = text.split('→').map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ArrowRight className={cn('w-3 h-3 shrink-0', dark ? 'text-blue-200' : 'text-gray-300')} />}
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] leading-none', dark ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600')}>{p}</span>
        </span>
      ))}
    </div>
  )
}

function Explainer({ step, t }: { step: FlowStep; t: TFn }) {
  const base = `flowAssistant.steps.${step.id}`
  const flow = t(`${base}.flow`)
  const server = t(`${base}.server`)
  const tip = t(`${base}.tip`)
  const DirIcon = step.serverDir === 'pull' ? Download : Upload
  const dirLabel = step.serverDir === 'pull' ? t('flowAssistant.dirPull') : t('flowAssistant.dirPush')
  return (
    <div className="space-y-2.5">
      <Section label={t('flowAssistant.secWhat')}><span className="text-gray-600">{t(`${base}.summary`)}</span></Section>
      {flow && <Section label={t('flowAssistant.secFlow')}><FlowChips text={flow} /></Section>}
      {server && step.serverDir && (
        <Section label={t('flowAssistant.secServer')}>
          <span className="flex items-start gap-1.5 text-gray-600">
            <span className={cn('inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] shrink-0', step.serverDir === 'pull' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700')}>
              <DirIcon className="w-3 h-3" />{dirLabel}
            </span>
            <span>{server}</span>
          </span>
        </Section>
      )}
      <Section label={t('flowAssistant.secAction')}><span className="text-gray-700 font-medium">{t(`${base}.action`)}</span></Section>
      {tip && <Section label={t('flowAssistant.secResult')}><span className="text-gray-500">{tip}</span></Section>}
    </div>
  )
}

function TourBody({ ctl, t, dark }: { ctl: TourCtl; t: TFn; dark?: boolean }) {
  const isLast = ctl.idx === ctl.total - 1
  const base = `flowAssistant.createTour.${ctl.stepKey}`
  return (
    <div className="space-y-1.5">
      <div className={cn('text-[10px]', dark ? 'text-blue-100' : 'text-gray-400')}>{t('flowAssistant.field')} {ctl.idx + 1}/{ctl.total}</div>
      <div className={cn('text-xs font-semibold', dark ? 'text-white' : 'text-gray-900')}>{t(`${base}.title`)}</div>
      <div className={cn('text-[11px] leading-snug', dark ? 'text-blue-50' : 'text-gray-600')}>{t(`${base}.desc`)}</div>
      <div className="flex items-center gap-2 pt-1">
        {ctl.idx > 0 && (
          <button onClick={ctl.onPrev} className={cn('text-[11px] px-2 py-1 rounded', dark ? 'bg-white/15 text-white hover:bg-white/25' : 'border border-gray-300 text-gray-600 hover:bg-gray-50')}>
            {t('flowAssistant.prev')}
          </button>
        )}
        {!isLast ? (
          <button onClick={ctl.onNext} className={cn('text-[11px] px-2.5 py-1 rounded font-medium', dark ? 'bg-white text-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')}>
            {t('flowAssistant.next')}
          </button>
        ) : (
          <button onClick={ctl.onFinish} className={cn('inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded font-medium', dark ? 'bg-white text-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700')}>
            <Wand2 className="w-3 h-3" />{t('flowAssistant.createFinish')}
          </button>
        )}
      </div>
    </div>
  )
}

function Spotlight({ rect, step, t, showBubble, tour }: { rect: Rect; step: FlowStep; t: TFn; showBubble: boolean; tour?: TourCtl }) {
  const pad = 6
  const bubbleW = 300
  const bubbleH = tour ? 150 : 180
  const vw = window.innerWidth
  const vh = window.innerHeight
  const below = rect.top + rect.height + 14
  const placeAbove = below + bubbleH > vh || rect.top > vh * 0.5
  const top = placeAbove ? Math.max(12, rect.top - 14 - bubbleH) : below
  const left = rect.left > vw - bubbleW - 24
    ? Math.max(12, rect.left + rect.width - bubbleW)
    : Math.min(Math.max(12, rect.left), vw - bubbleW - 12)
  const arrowLeft = Math.min(Math.max(14, rect.left + rect.width / 2 - left - 6), bubbleW - 26)
  const base = `flowAssistant.steps.${step.id}`
  const flow = t(`${base}.flow`)
  return createPortal(
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div
        className="absolute rounded-lg border-2 border-blue-500 animate-pulse"
        style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 4px rgba(59,130,246,0.25)' }}
      />
      {showBubble && (
        <div className="absolute pointer-events-auto rounded-lg bg-blue-600 text-white shadow-xl p-3" style={{ top, left, width: bubbleW }}>
          <div className="absolute w-3 h-3 bg-blue-600 rotate-45" style={{ left: arrowLeft, ...(placeAbove ? { bottom: -5 } : { top: -5 }) }} />
          {tour ? (
            <div className="relative"><TourBody ctl={tour} t={t} dark /></div>
          ) : (
            <div className="relative space-y-1.5">
              <div className="text-xs font-semibold">{t(`${base}.title`)}</div>
              <div className="text-[11px] text-blue-50 leading-snug">{t(`${base}.summary`)}</div>
              {flow && <FlowChips text={flow} dark />}
              <div className="text-[11px] font-medium">👉 {t(`${base}.action`)}</div>
              {step.run && (
                <button onClick={() => step.run!()} className="mt-0.5 inline-flex items-center gap-1 rounded bg-white/15 hover:bg-white/25 px-2 py-1 text-[11px] font-medium">
                  <Wand2 className="w-3 h-3" />{t('flowAssistant.doItForMe')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  )
}
