/**
 * AdForge AI - Background Job Queue & Worker Service
 * Orchestrates long-running multimodal AI generation jobs with state tracking,
 * progress updates, idempotency, and error handling.
 */
import crypto from 'crypto';
import { db, GenerationJob } from '../database';

type JobHandler = (job: GenerationJob) => Promise<Record<string, unknown>>;

class JobQueueService {
  private handlers = new Map<string, JobHandler>();
  private activeJobs = new Set<string>();

  registerHandler(type: GenerationJob['type'], handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  async createJob(
    projectId: string,
    type: GenerationJob['type'],
    initialMessage: string
  ): Promise<GenerationJob> {
    const job: GenerationJob = {
      id: crypto.randomUUID(),
      project_id: projectId,
      type,
      status: 'queued',
      progress_message: initialMessage,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.saveJob(job);

    // Launch worker execution asynchronously (fire & process without blocking HTTP caller)
    setImmediate(() => {
      this.executeJob(job.id);
    });

    return job;
  }

  private async executeJob(jobId: string): Promise<void> {
    if (this.activeJobs.has(jobId)) return;
    this.activeJobs.add(jobId);

    const job = await db.getJob(jobId);
    if (!job) {
      this.activeJobs.delete(jobId);
      return;
    }

    try {
      job.status = 'processing';
      job.updated_at = new Date().toISOString();
      await db.saveJob(job);

      const handler = this.handlers.get(job.type);
      if (!handler) {
        throw new Error(`No worker registered for job type: ${job.type}`);
      }

      console.log(`[JobQueue] Starting job ${job.id} (${job.type}) for project ${job.project_id}`);
      const resultData = await handler(job);

      job.status = 'completed';
      job.progress_message = 'Completed successfully';
      job.result_data = resultData;
      job.updated_at = new Date().toISOString();
      await db.saveJob(job);
      console.log(`[JobQueue] Completed job ${job.id} (${job.type})`);
    } catch (err: any) {
      console.error(`[JobQueue] Job ${job.id} failed:`, err);
      job.status = 'failed';
      job.error_message = err.message || 'An unexpected AI generation failure occurred';
      job.progress_message = `Failed: ${job.error_message}`;
      job.updated_at = new Date().toISOString();
      await db.saveJob(job);
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  async updateJobProgress(jobId: string, message: string): Promise<void> {
    const job = await db.getJob(jobId);
    if (job && job.status === 'processing') {
      job.progress_message = message;
      job.updated_at = new Date().toISOString();
      await db.saveJob(job);
    }
  }
}

export const jobQueue = new JobQueueService();
