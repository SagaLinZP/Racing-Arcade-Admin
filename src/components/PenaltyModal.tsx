import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Gavel } from 'lucide-react'
import type { Competition, Stage } from '@/data/competitions'
import { applyPenaltyWithAudit, type PenaltyAction, type PenaltyKind } from '@/lib/penalties'
import type { ScoringTableEntry } from '@/lib/utils'

export interface PenaltyModalProps {
  isOpen: boolean
  onClose: () => void
  competition: Competition
  stage: Stage
  sessionId?: string
  driverId: string
  driverName: string
  sessionName?: string
  scoringTable?: ScoringTableEntry[]
  protestId?: string
  defaultReason?: string
  onApplied?: (summary: AppliedPenalty) => void
}

export interface AppliedPenalty {
  kind: PenaltyKind
  reason: string
  seconds?: number
}

export function PenaltyModal({
  isOpen,
  onClose,
  competition,
  stage,
  sessionId,
  driverId,
  driverName,
  sessionName,
  scoringTable,
  protestId,
  defaultReason,
  onApplied,
}: PenaltyModalProps) {
  const { t } = useTranslation()
  const [kind, setKind] = useState<PenaltyKind>('time')
  const [reason, setReason] = useState(defaultReason ?? '')
  const [seconds, setSeconds] = useState(5)
  const [error, setError] = useState<string | null>(null)

  const kindOptions = [
    { value: 'time', label: t('result.penaltyKindTime') },
    { value: 'dsq', label: t('result.penaltyKindDsq') },
    { value: 'warning', label: t('result.penaltyKindWarning') },
  ]

  const buildAction = (): PenaltyAction => {
    switch (kind) {
      case 'time': return { kind: 'time', seconds }
      case 'dsq': return { kind: 'dsq' }
      default: return { kind: 'warning' }
    }
  }

  const handleApply = () => {
    if (!reason.trim()) {
      setError(t('result.penaltyReasonRequired'))
      return
    }
    const changes = applyPenaltyWithAudit({
      stage,
      competition,
      sessionId,
      driverId,
      action: buildAction(),
      reason: reason.trim(),
      protestId,
      scoringTable,
    })
    if (changes.length === 0) {
      setError(t('result.penaltyNoResult'))
      return
    }
    setError(null)
    onApplied?.({
      kind,
      reason: reason.trim(),
      seconds: kind === 'time' ? seconds : undefined,
    })
    setReason('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('result.penaltyModalTitle')} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500">{t('result.penaltyTargetDriver')}: </span>
            <span className="font-medium text-gray-900">{driverName}</span>
          </div>
          {sessionName && (
            <div>
              <span className="text-gray-500">{t('result.penaltyTargetSession')}: </span>
              <span className="font-medium text-gray-900">{sessionName}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label={t('result.penaltyKind')} options={kindOptions} value={kind} onChange={(e) => setKind(e.target.value as PenaltyKind)} />
          {kind === 'time' && (
            <Input label={t('result.penaltySecondsLabel')} type="number" min={0} value={String(seconds)} onChange={(e) => setSeconds(Number(e.target.value))} />
          )}
        </div>

        <Textarea label={t('result.penaltyReason')} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('result.penaltyReasonPlaceholder')} />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleApply}>
            <Gavel className="w-4 h-4 mr-1" />{t('result.penaltyApply')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
