import { useEffect, useRef, useState } from 'react'
import { PRODUCT_ARCHETYPE } from '@/product-config'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShineBorder } from '@/components/ui/shine-border'
import { DotPattern } from '@/components/ui/dot-pattern'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useJobs, useUploadJob, downloadJobResult, type Job } from '../data/jobs'

function statusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'failed') return 'destructive'
  if (status === 'processing') return 'secondary'
  return 'outline' // pending
}

function statusLabel(status: string): string {
  if (status === 'pending') return 'Queued'
  if (status === 'processing') return 'Processing'
  if (status === 'completed') return 'Done'
  if (status === 'failed') return 'Failed'
  return status
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function jobDisplayName(job: Job): string {
  if (job.input_file_paths && job.input_file_paths.length > 0) {
    const names = job.input_file_paths.map((p) => p.split('/').pop() ?? p)
    return names.length === 1 ? names[0] : `${names.length} files`
  }
  return job.input_file_path?.split('_').slice(1).join('_') ?? 'Upload'
}


// PRODUCT_CUSTOMIZE: the `accept` attribute on the file input describes
// what file types this product processes (e.g. '.csv,.xlsx,.pdf').
// Set MULTI_FILE = true for products needing more than one input file per job.
function FullscreenDropOverlay({ onDrop }: { onDrop: (files: File[]) => void }) {
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer.files ?? [])
        if (files.length > 0) onDrop(files)
      }}
    >
      <div className='relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-16 py-12'>
        <div className='flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5'>
          <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='text-white/60'>
            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/>
            <polyline points='17 8 12 3 7 8'/>
            <line x1='12' y1='3' x2='12' y2='15'/>
          </svg>
        </div>
        <p className='text-lg font-medium tracking-tight text-white'>Drop to upload</p>
        <p className='text-sm text-white/40'>Release to start processing</p>
      </div>
    </div>
  )
}

const SHOW_UPLOAD = PRODUCT_ARCHETYPE === 'extraction' || PRODUCT_ARCHETYPE === 'report'
const MULTI_FILE = false

export function JobsCard() {
  const { uploadFile, uploadFiles, uploading, error } = useUploadJob()
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    if (!SHOW_UPLOAD) return
    function onDragEnter(e: DragEvent) {
      e.preventDefault()
      dragCounter.current++
      if (dragCounter.current === 1) setIsDraggingOver(true)
    }
    function onDragLeave(e: DragEvent) {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current === 0) setIsDraggingOver(false)
    }
    function onDrop(e: DragEvent) {
      e.preventDefault()
      dragCounter.current = 0
      setIsDraggingOver(false)
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [])

  function handleFiles(files: File[]) {
    dragCounter.current = 0
    setIsDraggingOver(false)
    if (files.length === 0) return
    if (MULTI_FILE) uploadFiles(files)
    else if (files[0]) uploadFile(files[0])
  }
  const { data: jobs, isLoading } = useJobs()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (MULTI_FILE) {
      uploadFiles(files)
    } else if (files[0]) {
      uploadFile(files[0])
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length === 0) return
    if (MULTI_FILE) {
      uploadFiles(files)
    } else if (files[0]) {
      uploadFile(files[0])
    }
  }

  return (
    <>
      {isDraggingOver && SHOW_UPLOAD && (
        <FullscreenDropOverlay onDrop={handleFiles} />
      )}
    <Card className='relative overflow-hidden'>
        <ShineBorder shineColor={['#5e6ad2', '#a78bfa', '#5e6ad2']} borderWidth={1} />
      <CardHeader>
        <div className='flex items-center gap-2'>
          <CardTitle>
            {SHOW_UPLOAD ? (MULTI_FILE ? 'Upload files' : 'Upload a file') : 'Processing Queue'}
          </CardTitle>
          <Badge variant='secondary'>Free</Badge>
        </div>
        {SHOW_UPLOAD && (
          <CardDescription>
            {MULTI_FILE
              ? (import.meta.env.VITE_UPLOAD_DESCRIPTION_MULTI as string ?? 'Drop your files here and we’ll process them automatically. Free, unlimited uploads.')
              : (import.meta.env.VITE_UPLOAD_DESCRIPTION as string ?? 'Upload a file and we’ll process it automatically. Free, unlimited uploads.')}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        {SHOW_UPLOAD && (
          <div
            className='relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center overflow-hidden'
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <DotPattern className='absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]' />
            <p className='relative text-sm text-muted-foreground'>
              Drag and drop {MULTI_FILE ? 'files' : 'a file'} here, or
            </p>
            <RippleButton
              rippleColor="#5e6ad2"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className='border-[#5e6ad2]/50 text-white bg-[#5e6ad2]/10 hover:border-[#5e6ad2] px-6'
            >
              {uploading
                ? 'Uploading...'
                : MULTI_FILE
                  ? 'Choose files'
                  : 'Choose file'}
            </RippleButton>
            <input
              ref={inputRef}
              type='file'
              multiple={MULTI_FILE}
              className='hidden'
              onChange={handleFileChange}
            />
            {error && <p className='text-sm text-destructive'>{error}</p>}
          </div>
        )}

        <div className='space-y-2'>
          {isLoading && (
            <p className='text-sm text-muted-foreground'>Loading jobs...</p>
          )}
          {!isLoading && jobs && jobs.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              {(import.meta.env.VITE_UPLOAD_EMPTY_STATE as string) ?? 'No files uploaded yet.'}
            </p>
          )}
          {jobs?.slice(0, 5).map((job) => (
            <div
              key={job.id}
              className='flex items-center justify-between rounded-md border px-3 py-2'
            >
              <div className='space-y-0.5'>
                <p className='text-sm font-medium'>{jobDisplayName(job)}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatTime(job.created_at)}
                  {job.status === 'failed' && job.error_message
                    ? ` — ${job.error_message}`
                    : ''}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant={statusBadgeVariant(job.status)}>
                  {statusLabel(job.status)}
                </Badge>
                {job.status === 'completed' && job.output_file_path && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      downloadJobResult(
                        job.output_file_path!,
                        `${jobDisplayName(job)}-result.csv`
                      )
                    }
                  >
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </>
  )
}
