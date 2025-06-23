// utils/Mutex.ts
// Provides a utility for managing asynchronous operations in a sequential manner using a mutex-like mechanism.

/**
 * Indicates whether an operation is currently running.
 * If `true`, subsequent operations will be queued until the current operation finishes.
 */
let isRunning = false;

/**
 * Queue to store functions that need to be executed sequentially.
 * Each function in the queue is executed once the previous operation completes.
 */
const queue: (() => void)[] = [];

/**
 * Enqueues an asynchronous function to be executed sequentially.
 * Ensures that only one operation runs at a time, and subsequent operations are executed in order.
 *
 * @param fn - The asynchronous function to be executed.
 * @returns A promise that resolves with the result of the function or rejects if an error occurs.
 */
export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    /**
     * Executes the provided function and handles its completion.
     * If the function succeeds, resolves the promise with the result.
     * If the function fails, rejects the promise with the error.
     * Once the function completes, the next function in the queue is executed (if any).
     */
    const run = async () => {
      try {
        // Mark the mutex as running
        isRunning = true;

        // Execute the provided function
        const result = await fn();

        // Resolve the promise with the result
        resolve(result);
      } catch (err) {
        // Reject the promise with the error
        reject(err);
      } finally {
        // Mark the mutex as not running
        isRunning = false;

        // Execute the next function in the queue (if any)
        if (queue.length > 0) {
          const next = queue.shift();
          next?.();
        }
      }
    };

    // If an operation is already running, add the function to the queue
    if (isRunning) {
      queue.push(run);
    } else {
      // Otherwise, execute the function immediately
      run();
    }
  });
}
