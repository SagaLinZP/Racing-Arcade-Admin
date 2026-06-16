import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  label?: string
  value?: string
  defaultValue?: string
  onChange?: (dataUrl: string) => void
  aspectRatio?: 'video' | 'square' | 'banner'
}

export function ImageUpload({ label, value, defaultValue, onChange, aspectRatio = 'video' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(value ?? defaultValue ?? '')
  const isControlled = value !== undefined

  const current = isControlled ? value : preview

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (!isControlled) setPreview(dataUrl)
      onChange?.(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleClear = () => {
    if (!isControlled) setPreview('')
    onChange?.('')
  }

  const arClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'banner' ? 'aspect-[3/1]' : 'aspect-video'

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {current ? (
        <div className="relative group">
          <div className={cn('w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-50', arClass)}>
            <img src={current} alt="" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400',
            arClass,
          )}
        >
          <ImageIcon className="w-8 h-8" />
          <span className="text-sm flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            Upload Image
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
