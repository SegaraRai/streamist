import { parseExpression } from 'cron-parser';
import { callAsync } from './callAsync';
import { longTimeout } from './longTimeout';

const DEFAULT_TIMEZONE = 'UTC';

export type TaskCallback = () => void | Promise<void>;

export interface Options {
  timezone?: string;
}

interface Task {
  callback: TaskCallback;
  shuttingDown: boolean;
  next: number;
  clearTimer: (() => void) | undefined;
  jobPromise: Promise<void> | undefined;
  setTimer: () => void;
}

export type TaskId = symbol;

export class TaskScheduler {
  private static createTaskId(): TaskId {
    return Symbol();
  }

  private taskMap = new Map<TaskId, Task>();

  constructor(readonly options?: Options) {}

  schedule(cron: string, callback: TaskCallback, options?: Options): TaskId {
    const timezone =
      options?.timezone || this.options?.timezone || DEFAULT_TIMEZONE;

    const task: Task = {
      callback,
      shuttingDown: false,
      next: parseExpression(cron, {
        tz: timezone,
      })
        .next()
        .getTime(),
      clearTimer: undefined,
      jobPromise: undefined,
      setTimer: (): void => {
        if (task.clearTimer || task.jobPromise) {
          console.error('Timer already set');
          return;
        }

        if (task.shuttingDown) {
          return;
        }

        const cronExpression = parseExpression(cron, {
          tz: timezone,
        });
        const next = cronExpression.next();
        const clearTimer = longTimeout((): void => {
          task.clearTimer = undefined;
          task.jobPromise = callAsync(callback)
            .catch((error): void => {
              console.error('TaskScheduler: ', error);
            })
            .finally((): void => {
              task.jobPromise = undefined;
              task.setTimer();
            });
        }, next.getTime() - Date.now());
        task.clearTimer = (): void => {
          task.clearTimer = undefined;
          clearTimer();
        };
      },
    };

    task.setTimer();

    const taskId = TaskScheduler.createTaskId();
    this.taskMap.set(taskId, task);

    return taskId;
  }

  async unschedule(jobId: TaskId): Promise<boolean> {
    const task = this.taskMap.get(jobId);
    if (!task) {
      return false;
    }
    task.shuttingDown = true;
    task.clearTimer?.();
    if (task.jobPromise) {
      try {
        await task.jobPromise;
      } catch (_error) {
        // do nothing
      }
    }
    this.taskMap.delete(jobId);
    return true;
  }

  async unscheduleAll(): Promise<void> {
    await Promise.all(
      Array.from(this.taskMap.keys()).map((id) => this.unschedule(id))
    );
  }
}
