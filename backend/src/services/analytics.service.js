/**
 * @fileoverview Analytics aggregation service.
 *
 * BUSINESS PURPOSE:
 * Keeps one aggregated document per link per day and answers every reporting
 * endpoint from it. Visits are folded into counters as they arrive, so no
 * per-click history is stored and a report reads at most one document per day
 * in the requested window. These documents are the only record of how often a
 * link was used, including the lifetime totals other services ask for.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Ownership is checked against the ShortUrl model here rather than through the
 * URL service, because that service reads its lifetime totals from this one and
 * the dependency has to run in a single direction.
 *
 * @module services/analytics.service
 */
import Analytics from '../models/analytics.model.js';
import ShortUrl from '../models/shortUrl.model.js';
import {
  VISIT_SOURCE,
  REFERRER_DIRECT,
  LANGUAGE_UNKNOWN,
  DEFAULT_REPORT_DAYS,
  MAX_REPORT_DAYS,
} from '../constants/analytics.js';
import ApiError from '../utils/ApiError.js';
import { classifyUserAgent } from '../utils/userAgent.js';
import { encodeCountKey, decodeCountKey } from '../utils/countKey.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const URL_NOT_FOUND_MESSAGE = 'Short URL not found';

/**
 * Confirms the requester owns the link, whatever state it is in, so reporting
 * keeps working for a link sitting in the recycle bin.
 * @function assertUrlOwned
 */
const assertUrlOwned = async ({ urlId, ownerId }) => {
  const shortUrl = await ShortUrl.findOne({ _id: urlId, owner: ownerId });

  if (!shortUrl) {
    throw new ApiError(404, URL_NOT_FOUND_MESSAGE);
  }

  return shortUrl;
};

/**
 * Truncates a moment to the UTC midnight that starts its day.
 * @function startOfUtcDay
 */
const startOfUtcDay = (value = new Date()) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);

  return date;
};

/**
 * Reduces a referrer to its hostname, which keeps the key space small and stops
 * a full URL, including any private path it carries, from being stored.
 * @function normalizeReferrer
 */
const normalizeReferrer = (referrer) => {
  if (!referrer) {
    return REFERRER_DIRECT;
  }

  try {
    const { hostname } = new URL(referrer);

    return hostname ? hostname.toLowerCase() : REFERRER_DIRECT;
  } catch {
    return REFERRER_DIRECT;
  }
};

/**
 * Takes the preferred tag out of an Accept-Language header.
 * @function normalizeLanguage
 */
const normalizeLanguage = (language) => {
  if (typeof language !== 'string') {
    return LANGUAGE_UNKNOWN;
  }

  const [preferred = ''] = language.split(',');
  const tag = preferred.split(';')[0].trim().toLowerCase();

  return tag || LANGUAGE_UNKNOWN;
};

/**
 * Resolves the reporting window, defaulting to the most recent days and
 * refusing a span wide enough to scan unbounded history.
 * @function resolveRange
 */
const resolveRange = ({ from, to } = {}) => {
  const end = to ? startOfUtcDay(to) : startOfUtcDay();
  const start = from
    ? startOfUtcDay(from)
    : new Date(end.getTime() - (DEFAULT_REPORT_DAYS - 1) * DAY_IN_MS);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid analytics date range');
  }

  if (start.getTime() > end.getTime()) {
    throw new ApiError(400, 'The range start cannot be after its end');
  }

  const days = Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS) + 1;

  if (days > MAX_REPORT_DAYS) {
    throw new ApiError(400, `The range cannot exceed ${MAX_REPORT_DAYS} days`);
  }

  return { from: start, to: end };
};

/**
 * Confirms the requester owns the link and loads its days in the window.
 * @function loadDailyDocuments
 */
const loadDailyDocuments = async ({ urlId, ownerId, from, to }) => {
  await assertUrlOwned({ urlId, ownerId });

  return Analytics.find({
    url: urlId,
    owner: ownerId,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 });
};

/**
 * Sums one counter map across the loaded days, most frequent first.
 * @function toCountList
 */
const toCountList = (documents, field) => {
  const totals = new Map();

  documents.forEach((document) => {
    const counts = document[field];

    if (!counts) {
      return;
    }

    counts.forEach((count, key) => {
      const name = decodeCountKey(key);
      totals.set(name, (totals.get(name) || 0) + count);
    });
  });

  return [...totals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));
};

/**
 * Totals the window into the headline figures.
 * @function buildOverview
 */
const buildOverview = (documents) => {
  const clicks = documents.reduce((total, document) => total + document.clicks, 0);
  const qrScans = documents.reduce((total, document) => total + document.qrScans, 0);

  return {
    clicks,
    qrScans,
    totalVisits: clicks + qrScans,
    daysWithVisits: documents.length,
    firstVisitOn: documents.length ? documents[0].date : null,
    lastVisitOn: documents.length ? documents[documents.length - 1].date : null,
  };
};

/**
 * Lists the window day by day, oldest first. Days without a visit have no
 * document and are absent rather than reported as zero.
 * @function buildTimeline
 */
const buildTimeline = (documents) =>
  documents.map((document) => ({
    date: document.date,
    clicks: document.clicks,
    qrScans: document.qrScans,
    totalVisits: document.clicks + document.qrScans,
  }));

/**
 * Folds one successful visit into the link's document for the current UTC day.
 * A single upsert keeps every counter correct under concurrent traffic without
 * reading the document back.
 * @function recordVisit
 */
export const recordVisit = async ({ shortUrl, source, userAgent, referrer, language }) => {
  const { browser, operatingSystem, deviceType } = classifyUserAgent(userAgent);

  // Anything other than the QR marker counts as an ordinary click.
  const visitCounter = source === VISIT_SOURCE.QR ? 'qrScans' : 'clicks';

  const filter = { url: shortUrl._id, date: startOfUtcDay() };
  const update = {
    $inc: {
      [visitCounter]: 1,
      [`browserCounts.${encodeCountKey(browser)}`]: 1,
      [`osCounts.${encodeCountKey(operatingSystem)}`]: 1,
      [`deviceCounts.${encodeCountKey(deviceType)}`]: 1,
      [`referrerCounts.${encodeCountKey(normalizeReferrer(referrer))}`]: 1,
      [`languageCounts.${encodeCountKey(normalizeLanguage(language))}`]: 1,
    },
    $setOnInsert: { project: shortUrl.project, owner: shortUrl.owner },
  };

  try {
    await Analytics.updateOne(filter, update, { upsert: true });
  } catch (error) {
    // Two visits can race to open the same day; the loser of the unique index
    // simply folds into the document the winner just inserted.
    if (error?.code === 11000) {
      await Analytics.updateOne(filter, update, { upsert: true });

      return;
    }

    throw error;
  }
};

/**
 * Sums the lifetime visits of the given links, keyed by link id.
 * Clicks and QR scans are reported separately and together, because a link's
 * headline figure has always covered both.
 * @function getLifetimeTotals
 */
export const getLifetimeTotals = async (urlIds) => {
  const ids = (Array.isArray(urlIds) ? urlIds : [urlIds]).filter(Boolean);

  if (!ids.length) {
    return new Map();
  }

  const rows = await Analytics.aggregate([
    { $match: { url: { $in: ids } } },
    {
      $group: {
        _id: '$url',
        clicks: { $sum: '$clicks' },
        qrScans: { $sum: '$qrScans' },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        clicks: row.clicks,
        qrScans: row.qrScans,
        totalVisits: row.clicks + row.qrScans,
      },
    ])
  );
};

/**
 * Returns every report for a link in one payload.
 * @function getAnalytics
 */
export const getAnalytics = async ({ urlId, ownerId, from, to }) => {
  const range = resolveRange({ from, to });
  const documents = await loadDailyDocuments({ urlId, ownerId, ...range });

  return {
    range,
    overview: buildOverview(documents),
    timeline: buildTimeline(documents),
    browsers: toCountList(documents, 'browserCounts'),
    operatingSystems: toCountList(documents, 'osCounts'),
    devices: toCountList(documents, 'deviceCounts'),
    referrers: toCountList(documents, 'referrerCounts'),
    languages: toCountList(documents, 'languageCounts'),
  };
};

/**
 * Returns the headline totals for a link.
 * @function getOverview
 */
export const getOverview = async ({ urlId, ownerId, from, to }) => {
  const range = resolveRange({ from, to });
  const documents = await loadDailyDocuments({ urlId, ownerId, ...range });

  return { range, overview: buildOverview(documents) };
};

/**
 * Returns the day-by-day series for a link.
 * @function getTimeline
 */
export const getTimeline = async ({ urlId, ownerId, from, to }) => {
  const range = resolveRange({ from, to });
  const documents = await loadDailyDocuments({ urlId, ownerId, ...range });

  return { range, timeline: buildTimeline(documents) };
};

/**
 * Returns the browser breakdown for a link.
 * @function getBrowsers
 */
export const getBrowsers = async ({ urlId, ownerId, from, to }) => {
  const range = resolveRange({ from, to });
  const documents = await loadDailyDocuments({ urlId, ownerId, ...range });

  return { range, browsers: toCountList(documents, 'browserCounts') };
};

/**
 * Returns the operating-system breakdown for a link.
 * @function getOperatingSystems
 */
export const getOperatingSystems = async ({ urlId, ownerId, from, to }) => {
  const range = resolveRange({ from, to });
  const documents = await loadDailyDocuments({ urlId, ownerId, ...range });

  return { range, operatingSystems: toCountList(documents, 'osCounts') };
};

/**
 * Returns the device breakdown for a link.
 * @function getDevices
 */
export const getDevices = async ({ urlId, ownerId, from, to }) => {
  const range = resolveRange({ from, to });
  const documents = await loadDailyDocuments({ urlId, ownerId, ...range });

  return { range, devices: toCountList(documents, 'deviceCounts') };
};

/**
 * Returns the referrer breakdown for a link.
 * @function getReferrers
 */
export const getReferrers = async ({ urlId, ownerId, from, to }) => {
  const range = resolveRange({ from, to });
  const documents = await loadDailyDocuments({ urlId, ownerId, ...range });

  return { range, referrers: toCountList(documents, 'referrerCounts') };
};
