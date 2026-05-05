export const ALERTS_QUEUE = 'budget-alerts';

export const ALERT_JOB_OPTIONS = {
  removeOnComplete: true,
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
} as const;
