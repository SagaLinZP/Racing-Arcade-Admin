import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mozaDevices } from '@/data/mozaDevices'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'Wheel Base', label: 'Wheel Base' },
  { value: 'Pedals', label: 'Pedals' },
  { value: 'Handbrake', label: 'Handbrake' },
  { value: 'Shifter', label: 'Shifter' },
  { value: 'Steering Wheel', label: 'Steering Wheel' },
]

export function DeviceListPage() {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [editDevice, setEditDevice] = useState<typeof mozaDevices[0] | null>(null)

  const columns = [
    { key: 'icon', header: 'Icon', render: (d: typeof mozaDevices[0]) => <span className="text-xl">{d.icon}</span> },
    { key: 'name', header: t('device.deviceName'), render: (d: typeof mozaDevices[0]) => <span className="font-medium">{d.name}</span> },
    { key: 'category', header: t('device.category'), render: (d: typeof mozaDevices[0]) => <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{d.category}</span> },
    {
      key: 'actions', header: t('common.actions'),
      render: (d: typeof mozaDevices[0]) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditDevice(d); setShowModal(true) }}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('device.title')}</h1>
        <Button onClick={() => { setEditDevice(null); setShowModal(true) }}><Plus className="w-4 h-4 mr-1" />{t('device.createDevice')}</Button>
      </div>

      <Card padding={false}>
        <DataTable columns={columns} data={mozaDevices} keyExtractor={(d) => d.id} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editDevice ? t('device.editDevice') : t('device.createDevice')} size="sm">
        <div className="space-y-4">
          <Input label={t('device.deviceName')} defaultValue={editDevice?.name || ''} />
          <Select label={t('device.category')} options={CATEGORY_OPTIONS} value={editDevice?.category || 'Wheel Base'} />
          <Input label={t('device.icon')} defaultValue={editDevice?.icon || ''} placeholder="Emoji icon" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
