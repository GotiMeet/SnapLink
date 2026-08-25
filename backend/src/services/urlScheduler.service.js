/**
 * @fileoverview URL scheduling background worker service.
 *
 * BUSINESS PURPOSE:
 * Manages automated lifecycle transitions for shortened URLs:
 * 1. Activates scheduled links whose `scheduledLiveAt` time has arrived.
 * 2. Soft-deletes expired links whose `scheduledDeleteAt` time has arrived.
 *
 * Runs as a lightweight cron job once per minute using node-cron.
 *
 * @module services/urlScheduler.service
 */
import cron from 'node-cron';

import ShortUrl from '../models/shortUrl.model.js';
import { URL_STATUS } from '../constants/status.js';

let cronTask = null;

/**
 * Activates links that reached their scheduledLiveAt timestamp.
 * Idempotent: matches only INACTIVE links.
 * @function processScheduledActivations
 * @param {Date} [now=new Date()]
 * @returns {Promise<number>} Number of activated URLs.
 */
export const processScheduledActivations = async (now = new Date()) => {
  const result = await ShortUrl.updateMany(
    {
      scheduledLiveAt: { $ne: null, $lte: now },
      status: URL_STATUS.INACTIVE,
    },
    {
      $set: { status: URL_STATUS.ACTIVE },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`[Scheduler] Activated ${result.modifiedCount} scheduled URL(s)`);
  }

  return result.modifiedCount;
};

/**
 * Soft-deletes links that reached their scheduledDeleteAt timestamp.
 * Idempotent: matches only ACTIVE or INACTIVE links (ignores already deleted links).
 * @function processScheduledDeletions
 * @param {Date} [now=new Date()]
 * @returns {Promise<number>} Number of soft-deleted URLs.
 */
export const processScheduledDeletions = async (now = new Date()) => {
  const result = await ShortUrl.updateMany(
    {
      scheduledDeleteAt: { $ne: null, $lte: now },
      status: { $in: [URL_STATUS.ACTIVE, URL_STATUS.INACTIVE] },
    },
    {
      $set: {
        status: URL_STATUS.DELETED_LINK,
        deletedAt: now,
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`[Scheduler] Soft-deleted ${result.modifiedCount} expired URL(s)`);
  }

  return result.modifiedCount;
};

/**
 * Executes a single scheduling tick covering both activation and deletion.
 * @function runSchedulingCycle
 * @param {Date} [now=new Date()]
 */
export const runSchedulingCycle = async (now = new Date()) => {
  try {
    await processScheduledActivations(now);
    await processScheduledDeletions(now);
  } catch (error) {
    console.error('[Scheduler] Error processing scheduled URL jobs:', error);
  }
};

/**
 * Starts the background URL scheduler cron job (runs every minute: '* * * * *').
 * @function startScheduler
 */
export const startScheduler = () => {
  if (cronTask) {
    return cronTask;
  }

  cronTask = cron.schedule('* * * * *', () => {
    runSchedulingCycle();
  });

  console.log('[Scheduler] URL scheduling started');
  return cronTask;
};

/**
 * Stops the background scheduler on graceful application shutdown.
 * @function stopScheduler
 */
export const stopScheduler = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
};
