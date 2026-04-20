import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, FileText } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  files: File[]
  onChange: (files: File[]) => void
}

export default function Dropzone({ files, onChange }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    onDrop: (accepted) => onChange([...files, ...accepted]),
    multiple: true,
  })

  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-sage-400 bg-sage-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud size={28} className={clsx('mx-auto mb-3', isDragActive ? 'text-sage-500' : 'text-ink-300')} />
        <p className="text-sm font-medium text-ink-700">
          {isDragActive ? 'Drop resumes here' : 'Drag & drop resumes'}
        </p>
        <p className="text-xs text-ink-400 mt-1">PDF or DOCX — multiple files supported</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-white border border-ink-100 rounded-xl px-3 py-2">
              <FileText size={14} className="text-ink-400 shrink-0" />
              <span className="text-xs text-ink-700 flex-1 truncate">{f.name}</span>
              <span className="text-[10px] text-ink-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => remove(i)} className="text-ink-300 hover:text-rose-500 transition-colors ml-1">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
