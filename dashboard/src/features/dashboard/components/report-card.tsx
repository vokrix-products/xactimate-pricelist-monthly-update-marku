import { useState } from 'react'
import { CheckCircle, XCircle, Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { supabase, PRODUCT_ID } from '@/lib/supabase'
import { downloadJobResult, useJobs, type Job } from '../../jobs/data/jobs'

// PRODUCT_CUSTOMIZE: label shown for a completed report run.
// e.g. 'Royalty Report', 'Grant Report', 'VAT Reconciliation'
const REPORT_LABEL = 'Report'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

async function setApproval(jobId: string, status: ApprovalStatus) {
  await supabase
    .from('jobs')
    .update({ result_summary: { approval: status } })
    .eq('id', jobId)
    .eq('product_id', PRODUCT_ID)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ReportCard() {
  const { data: jobs, isLoading, refetch } = useJobs()
  const [working, setWorking] = useState<string | null>(null)

  if (isLoading) {
    return <div className='text-sm text-muted-foreground'>Loading...</div>
  }

  const completedJobs = (jobs ?? []).filter((j: Job) => j.status === 'completed')
  const latestJob = completedJobs[0] ?? null
  const pendingJob = (jobs ?? []).find((j: Job) => j.status === 'pending' || j.status === 'processing')

  async function handleApprove(jobId: string) {
    setWorking(jobId)
    await setApproval(jobId, 'approved')
    await refetch()
    setWorking(null)
  }

  async function handleReject(jobId: string) {
    setWorking(jobId)
    await setApproval(jobId, 'rejected')
    await refetch()
    setWorking(null)
  }

  const approval = latestJob?.result_summary?.approval as ApprovalStatus | undefined

  return (
    <div className='space-y-4'>
      {/* Processing indicator */}
      {pendingJob && (
        <Card>
          <CardContent className='pt-4'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span className='size-2 rounded-full bg-warning animate-pulse' />
              Processing new upload... This may take a few minutes.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest report */}
      {latestJob ? (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-base'>
                  Latest {REPORT_LABEL}
                </CardTitle>
                <CardDescription>{formatTime(latestJob.completed_at ?? latestJob.created_at)}</CardDescription>
              </div>
              <Badge
                variant={
                  approval === 'approved'
                    ? 'success'
                    : approval === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {approval === 'approved'
                  ? 'Approved'
                  : approval === 'rejected'
                    ? 'Rejected'
                    : 'Pending review'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Summary fields from result_summary jsonb */}
            {latestJob.result_summary &&
              Object.entries(latestJob.result_summary)
                .filter(([k]) => k !== 'approval')
                .map(([key, value]) => (
                  <div key={key} className='flex justify-between text-sm'>
                    <span className='text-muted-foreground capitalize'>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className='font-medium'>{String(value)}</span>
                  </div>
                ))}

            <Separator />

            <div className='flex items-center gap-2 flex-wrap'>
              {latestJob.output_file_path && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    downloadJobResult(
                      latestJob.output_file_path!,
                      `${REPORT_LABEL.toLowerCase().replace(/\s+/g, '-')}-${latestJob.id}.csv`
                    )
                  }
                >
                  <Download className='size-3.5 mr-1' />
                  Download
                </Button>
              )}
              {(!approval || approval === 'pending') && (
                <>
                  <Button
                    size='sm'
                    disabled={working === latestJob.id}
                    onClick={() => handleApprove(latestJob.id)}
                  >
                    <CheckCircle className='size-3.5 mr-1' />
                    Approve
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    disabled={working === latestJob.id}
                    onClick={() => handleReject(latestJob.id)}
                  >
                    <XCircle className='size-3.5 mr-1' />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        !pendingJob && (
          <div className='text-sm text-muted-foreground'>
            No reports yet. Upload a file above to generate your first {REPORT_LABEL.toLowerCase()}.
          </div>
        )
      )}

      {/* Previous reports */}
      {completedJobs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Previous Reports</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {completedJobs.slice(1, 6).map((job: Job) => {
              const a = job.result_summary?.approval as ApprovalStatus | undefined
              return (
                <div
                  key={job.id}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-muted-foreground'>
                    {formatTime(job.completed_at ?? job.created_at)}
                  </span>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={
                        a === 'approved'
                          ? 'success'
                          : a === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {a ?? 'pending'}
                    </Badge>
                    {job.output_file_path && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 px-2'
                        onClick={() =>
                          downloadJobResult(
                            job.output_file_path!,
                            `report-${job.id}.csv`
                          )
                        }
                      >
                        <Download className='size-3' />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
