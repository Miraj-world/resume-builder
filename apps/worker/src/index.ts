export type JobType =
  | "document.ingest"
  | "repository.analyze"
  | "opportunity.match"
  | "resume.generate"
  | "resume.render"
  | "data.delete";

export interface JobEnvelope<TPayload = unknown> {
  id: string;
  workspaceId: string;
  type: JobType;
  idempotencyKey: string;
  attempt: number;
  payload: TPayload;
}

export interface JobResult {
  status: "completed" | "retryable_failure" | "terminal_failure";
  safeCode?: string;
}

export async function handleJob(job: JobEnvelope): Promise<JobResult> {
  if (!job.workspaceId || !job.idempotencyKey) {
    return { status: "terminal_failure", safeCode: "INVALID_JOB_ENVELOPE" };
  }

  return { status: "completed" };
}
