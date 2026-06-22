import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/hooks/useAppStore'
import { useManagedOptions } from '@/hooks/useManagedOptions'
import { useDataVersion } from '@/data/store'
import { protests, updateProtest } from '@/data/protests'
import { competitions } from '@/data/competitions'
import { findStageById, getName } from '@/lib/results'
import { addNotification } from '@/data/notifications'
import { drivers } from '@/data/drivers'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PenaltyModal, type AppliedPenalty } from '@/components/PenaltyModal'
import { ArrowLeft, Gavel, XCircle, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function ProtestDetailPage() {
  const { t } = useTranslation()
  const { state } = useApp()
  const lang = state.language
  const penaltyOptions = useManagedOptions('penaltyType', lang)
  const navigate = useNavigate()
  const { id } = useParams()
  useDataVersion()

  const [rulingReason, setRulingReason] = useState('')
  const [showPenalty, setShowPenalty] = useState(false)

  const protest = protests.find(p => p.id === id)
  if (!protest) return <div className="text-center py-12 text-gray-500">Protest not found</div>

  const comp = competitions.find(c => c.id === protest.competitionId)
  const ctx = findStageById(protest.stageId)
  const reporter = drivers.find(d => d.id === protest.reporterId)
  const reported = drivers.find(d => d.id === protest.reportedId)

  const penaltyTypeFor = (kind: string): string | undefined => {
    switch (kind) {
      case 'time': return 'timePenalty'
      case 'position': return 'positionDrop'
      case 'dsq': return 'disqualifyRace'
      case 'warning': return 'warning'
      default: return undefined
    }
  }

  const handleResolveViolation = (summary: AppliedPenalty) => {
    const now = new Date().toISOString()
    updateProtest({
      ...protest,
      status: 'resolved',
      resolution: {
        decision: 'violation',
        penaltyType: penaltyTypeFor(summary.kind),
        penaltySeconds: summary.seconds,
        positionDrop: summary.positions,
        pointsDeduction: summary.points,
        dsq: summary.kind === 'dsq',
        reason: summary.reason || rulingReason || t('protest.violationConfirmed'),
        appliedAt: now,
        reviewedBy: 'admin1',
      },
    })
    addNotification({
      id: `ntf_p_${protest.id}`,
      type: 'penalty',
      title_zh: '处罚通知',
      title_en: 'Penalty Notification',
      body_zh: `您在抗议 #${protest.id} 中被判罚。`,
      body_en: `You received a penalty in protest #${protest.id}.`,
      link: `/protests/${protest.id}`,
      isRead: false,
      createdAt: now,
    })
  }

  const handleDismiss = () => {
    updateProtest({
      ...protest,
      status: 'dismissed',
      resolution: { decision: 'noFault', reason: rulingReason || 'No further action.', appliedAt: new Date().toISOString(), reviewedBy: 'admin1' },
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/protests')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('protest.protestDetail')}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={protest.status} label={t(`protest.status.${protest.status}`)} />
            <span className="text-sm text-gray-500">Protest #{protest.id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('protest.information')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.competition')}:</span><span>{comp ? getName(comp, lang) : protest.competitionId || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.stage')}:</span><span>{ctx ? getName(ctx.stage, lang) : protest.stageId || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.eventType')}:</span><span className="capitalize">{protest.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.reporter')}:</span><span>{reporter?.nickname || protest.reporterId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.reported')}:</span><span>{reported?.nickname || protest.reportedId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.lapNumber')}:</span><span>{protest.lapNumber || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.location')}:</span><span>{protest.location || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.submitted')}:</span><span>{formatDate(protest.createdAt, lang)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t('protest.deadline')}:</span><span>{formatDate(protest.deadline, lang)}</span></div>
            {ctx && (
              <button onClick={() => navigate(`/results/${protest.stageId}`)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 pt-1">
                <ExternalLink className="w-3.5 h-3.5" />{t('protest.viewResults')}
              </button>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('protest.description')}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{protest.description}</p>
          {protest.evidenceUrls.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2">{t('protest.evidence')}:</h4>
              {protest.evidenceUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block">{url}</a>
              ))}
            </div>
          )}
        </Card>
      </div>

      {protest.resolution ? (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('protest.rulingResolved')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={protest.resolution.decision === 'violation' ? 'resolved' : 'dismissed'} label={protest.resolution.decision === 'violation' ? t('protest.violationConfirmed') : t('protest.dismissed')} />
              {protest.resolution.penaltyType && <span className="text-gray-600">{t('protest.penalty')}: {penaltyOptions.find(o => o.value === protest.resolution!.penaltyType)?.label ?? protest.resolution.penaltyType}{protest.resolution.penaltySeconds ? ` (+${protest.resolution.penaltySeconds}s)` : ''}{protest.resolution.positionDrop ? ` (+${protest.resolution.positionDrop} pos)` : ''}</span>}
            </div>
            <p className="text-gray-700">{protest.resolution.reason}</p>
            {ctx && (
              <button onClick={() => navigate(`/results/${protest.stageId}`)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-3.5 h-3.5" />{t('protest.viewResults')}
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4 pb-2 border-b">{t('protest.ruling')}</h3>
          <div className="space-y-4">
            <Textarea label={t('protest.rulingReason')} value={rulingReason} onChange={(e) => setRulingReason(e.target.value)} placeholder={t('protest.rulingReasonPlaceholder')} />
            {!ctx && <p className="text-xs text-amber-600">{t('protest.noLinkedStage')}</p>}
            <div className="flex gap-2">
              <Button onClick={() => setShowPenalty(true)} disabled={!ctx}><Gavel className="w-4 h-4 mr-1" />{t('protest.confirmViolation')}</Button>
              <Button variant="secondary" onClick={handleDismiss}><XCircle className="w-4 h-4 mr-1" />{t('protest.dismissProtest')}</Button>
            </div>
          </div>
        </Card>
      )}

      {showPenalty && ctx && (
        <PenaltyModal
          isOpen={true}
          onClose={() => setShowPenalty(false)}
          competition={ctx.competition}
          stage={ctx.stage}
          sessionId={protest.sessionId}
          driverId={protest.reportedId}
          driverName={reported?.nickname ?? protest.reportedId}
          sessionName={getName(ctx.stage, lang)}
          scoringTable={ctx.competition.defaultRuleset.scoringTable}
          protestId={protest.id}
          defaultReason={rulingReason}
          onApplied={handleResolveViolation}
        />
      )}
    </div>
  )
}
