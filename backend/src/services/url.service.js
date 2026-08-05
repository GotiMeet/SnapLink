/**
 * @fileoverview Short URL management service.
 *
 * BUSINESS PURPOSE:
 * Owns the short URL lifecycle — creation with a custom or generated alias,
 * retrieval, updates, soft delete, and restore. Also resolves alias availability
 * and guarantees short codes stay globally unique.
 *
 * @module services/url.service
 */
import mongoose from 'mongoose';

import ShortUrl from '../models/shortUrl.model.js';
import { URL_STATUS } from '../constants/status.js';
import { VISIBILITY } from '../constants/visibility.js';
import {
  RESERVED_SHORT_CODES,
  SHORT_CODE_MAX_ATTEMPTS,
} from '../constants/shortCode.js';
import ApiError from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { generateShortCode } from '../utils/shortCode.js';
import {
  assertProjectOwned,
  claimActiveProject,
  getProjectSummary,
} from './project.service.js';
import { getLifetimeTotals } from './analytics.service.js';

const URL_NOT_FOUND_MESSAGE = 'Short URL not found';
const ALIAS_TAKEN_MESSAGE = 'This alias is already taken';
const PASSWORD_NOT_ALLOWED_MESSAGE = 'A password can only be set on a private link';
const PASSWORD_REQUIRED_MESSAGE = 'A private link requires a password';
const PASSWORD_BLANK_MESSAGE = 'A link password cannot be empty or only whitespace';
const PROJECT_DELETED_MESSAGE =
  'This link cannot be restored yet because its project is deleted';
const PROJECT_UNAVAILABLE_MESSAGE =
  'This link cannot go live because its project is deleted';
const TITLE_TAKEN_MESSAGE = 'A link with this title already exists in this project';
const RESTORE_TITLE_TAKEN_MESSAGE =
  'Another link in this project already uses this title, rename it before restoring this one';

/**
 * Maps a unique-index violation onto the conflict it actually represents.
 * Two indexes can raise it, so the violated key tells the alias apart from the
 * per-project title.
 * @function toWriteConflict
 */
const toWriteConflict = (error, titleMessage = TITLE_TAKEN_MESSAGE) => {
  if (error?.code !== 11000) {
    return error;
  }

  return error.keyPattern?.title
    ? new ApiError(409, titleMessage)
    : new ApiError(409, ALIAS_TAKEN_MESSAGE);
};

/**
 * Reports whether a supplied link password carries actual content.
 * @function hasPasswordValue
 */
const hasPasswordValue = (value) =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Builds the refusal returned when a link cannot go live inside its project.
 * The project travels with it so the client can offer restoring that project,
 * moving the link elsewhere, or creating a new one.
 * @function projectUnavailableError
 */
const projectUnavailableError = (message, project) =>
  new ApiError(409, message, [
    {
      field: 'project',
      message:
        'Restore the project, move the link to another project, or create a new one.',
      project,
    },
  ]);

/**
 * Attaches the lifetime visit total that analytics now owns, so a link still
 * reports a click count without the schema storing one.
 * The figure covers QR scans as well, which is what the stored counter always
 * did, and a link with no recorded visit yet reports zero.
 * @function withLifetimeTotals
 */
const withLifetimeTotals = async (shortUrls) => {
  const totals = await getLifetimeTotals(shortUrls.map((shortUrl) => shortUrl._id));

  return shortUrls.map((shortUrl) => ({
    ...shortUrl.toObject(),
    clickCount: totals.get(String(shortUrl._id))?.totalVisits || 0,
  }));
};

/**
 * Single-document form of withLifetimeTotals.
 * @function withLifetimeTotal
 */
const withLifetimeTotal = async (shortUrl) => {
  const [shortUrlWithTotal] = await withLifetimeTotals([shortUrl]);

  return shortUrlWithTotal;
};

/**
 * Loads a short URL that belongs to the given owner and sits in the expected
 * state, or throws. Targeting the status keeps links hidden by a deleted project
 * out of reach until that project is restored.
 * The password is only selected when a caller needs to reason about it.
 * @function findOwnedUrl
 */
const findOwnedUrl = async ({
  urlId,
  ownerId,
  status = URL_STATUS.ACTIVE,
  withPassword = false,
}) => {
  const query = ShortUrl.findOne({
    _id: urlId,
    owner: ownerId,
    status,
  });

  if (withPassword) {
    query.select('+password');
  }

  const shortUrl = await query;

  if (!shortUrl) {
    throw new ApiError(404, URL_NOT_FOUND_MESSAGE);
  }

  return shortUrl;
};

/**
 * Reports whether a short code can still be claimed.
 * @function isShortCodeAvailable
 */
export const isShortCodeAvailable = async (shortCode) => {
  if (RESERVED_SHORT_CODES.includes(shortCode.toLowerCase())) {
    return false;
  }

  const existing = await ShortUrl.exists({ shortCode });

  return !existing;
};

/**
 * Produces a random short code that is not already in use.
 * Retries a bounded number of times so a rare collision cannot loop forever.
 * @function generateUniqueShortCode
 */
const generateUniqueShortCode = async () => {
  for (let attempt = 0; attempt < SHORT_CODE_MAX_ATTEMPTS; attempt += 1) {
    const candidate = generateShortCode();
    const existing = await ShortUrl.exists({ shortCode: candidate });

    if (!existing) {
      return candidate;
    }
  }

  throw new ApiError(503, 'Could not generate a unique short code, please try again');
};

/**
 * Creates a short URL inside a project the requester owns.
 * @function createUrl
 */
export const createUrl = async ({
  ownerId,
  projectId,
  title,
  originalUrl,
  visibility = VISIBILITY.PUBLIC,
  customAlias,
  password,
  scheduledLiveAt,
  scheduledDeleteAt,
}) => {
  await assertProjectOwned({ projectId, ownerId });

  const isPrivate = visibility === VISIBILITY.PRIVATE;

  // The password rules are enforced here too so the invariants hold for every
  // caller, not only for requests that passed through the request validators.
  if (isPrivate && !hasPasswordValue(password)) {
    throw new ApiError(
      400,
      password === undefined ? PASSWORD_REQUIRED_MESSAGE : PASSWORD_BLANK_MESSAGE
    );
  }

  if (!isPrivate && password !== undefined) {
    throw new ApiError(400, PASSWORD_NOT_ALLOWED_MESSAGE);
  }

  let shortCode;

  if (customAlias) {
    const available = await isShortCodeAvailable(customAlias);

    if (!available) {
      throw new ApiError(409, ALIAS_TAKEN_MESSAGE);
    }

    shortCode = customAlias;
  } else {
    shortCode = await generateUniqueShortCode();
  }

  // Hashing runs before the transaction opens so the transaction stays short.
  const hashedPassword = isPrivate ? await hashPassword(password) : undefined;

  const session = await mongoose.startSession();

  try {
    let createdUrl;

    await session.withTransaction(async () => {
      // Re-checked here because the project may have been deleted since the
      // first check; claiming it makes a concurrent delete conflict rather than
      // interleave, so a live link can never land in a deleted project.
      const project = await claimActiveProject({ projectId, ownerId, session });

      if (!project) {
        throw projectUnavailableError(
          PROJECT_UNAVAILABLE_MESSAGE,
          await getProjectSummary(projectId)
        );
      }

      const [shortUrl] = await ShortUrl.create(
        [
          {
            project: projectId,
            owner: ownerId,
            title,
            originalUrl,
            shortCode,
            isCustomAlias: Boolean(customAlias),
            visibility,
            password: hashedPassword,
            scheduledLiveAt: scheduledLiveAt || null,
            scheduledDeleteAt: scheduledDeleteAt || null,
          },
        ],
        { session }
      );

      createdUrl = shortUrl;
    });

    // A link that has just been created cannot have been visited yet.
    return { ...createdUrl.toObject(), clickCount: 0 };
  } catch (error) {
    // The unique indexes are the final guard when two requests claim the same
    // alias, or the same title inside one project, at once.
    throw toWriteConflict(error);
  } finally {
    await session.endSession();
  }
};

/**
 * Lists the owner's live short URLs, optionally scoped to one project, or the
 * recycle bin of links they deleted themselves, most recently updated first.
 * Selecting by status keeps links hidden by a deleted project out of both views;
 * they reappear with their project.
 * @function getUrls
 */
export const getUrls = async ({ ownerId, projectId, deleted = false }) => {
  const filter = {
    owner: ownerId,
    status: deleted ? URL_STATUS.DELETED_LINK : URL_STATUS.ACTIVE,
  };

  if (projectId) {
    filter.project = projectId;
  }

  const shortUrls = await ShortUrl.find(filter).sort({ updatedAt: -1 });

  // One aggregation covers the whole page rather than one query per link.
  return withLifetimeTotals(shortUrls);
};

/**
 * Returns a single active short URL owned by the requester.
 * @function getUrlById
 */
export const getUrlById = async ({ urlId, ownerId }) =>
  withLifetimeTotal(await findOwnedUrl({ urlId, ownerId }));

/**
 * Returns the short code of an active link the requester owns.
 * Separate from getUrlById so a caller that only needs the code does not pay for
 * the lifetime total that endpoint aggregates.
 * @function getOwnedShortCode
 */
export const getOwnedShortCode = async ({ urlId, ownerId }) => {
  const { shortCode } = await findOwnedUrl({ urlId, ownerId });

  return shortCode;
};

/**
 * Updates an active short URL's editable fields.
 * @function updateUrl
 */
export const updateUrl = async ({
  urlId,
  ownerId,
  title,
  originalUrl,
  visibility,
  password,
  scheduledLiveAt,
  scheduledDeleteAt,
}) => {
  const shortUrl = await findOwnedUrl({ urlId, ownerId, withPassword: true });

  if (title !== undefined) {
    shortUrl.title = title;
  }

  if (originalUrl !== undefined) {
    shortUrl.originalUrl = originalUrl;
  }

  if (scheduledLiveAt !== undefined) {
    shortUrl.scheduledLiveAt = scheduledLiveAt || null;
  }

  if (scheduledDeleteAt !== undefined) {
    shortUrl.scheduledDeleteAt = scheduledDeleteAt || null;
  }

  if (visibility !== undefined) {
    shortUrl.visibility = visibility;

    // A link turned public must not keep a stale password hash behind it.
    if (visibility === VISIBILITY.PUBLIC) {
      shortUrl.set('password', undefined);
    }
  }

  if (password !== undefined) {
    if (shortUrl.visibility !== VISIBILITY.PRIVATE) {
      throw new ApiError(400, PASSWORD_NOT_ALLOWED_MESSAGE);
    }

    if (!hasPasswordValue(password)) {
      throw new ApiError(400, PASSWORD_BLANK_MESSAGE);
    }

    shortUrl.set('password', await hashPassword(password));
  }

  // Turning a link private without a password would silently drop the gate.
  if (shortUrl.visibility === VISIBILITY.PRIVATE && !shortUrl.password) {
    throw new ApiError(400, PASSWORD_REQUIRED_MESSAGE);
  }

  try {
    await shortUrl.save();
  } catch (error) {
    throw toWriteConflict(error);
  }

  return withLifetimeTotal(shortUrl);
};

/**
 * Soft-deletes a short URL so it stops resolving but remains restorable.
 * @function softDeleteUrl
 */
export const softDeleteUrl = async ({ urlId, ownerId }) => {
  const shortUrl = await findOwnedUrl({ urlId, ownerId });

  shortUrl.deletedAt = new Date();
  shortUrl.status = URL_STATUS.DELETED_LINK;
  await shortUrl.save();

  return withLifetimeTotal(shortUrl);
};

/**
 * Restores a link the owner had deleted.
 * A link whose project is itself deleted is refused rather than restored, so an
 * active link can never sit inside a deleted project. The project travels with
 * the refusal so the client can offer restoring it, moving the link to another
 * project, or creating a new one; the link stays DELETED_LINK until then.
 * @function restoreUrl
 */
export const restoreUrl = async ({ urlId, ownerId }) => {
  const shortUrl = await findOwnedUrl({
    urlId,
    ownerId,
    status: URL_STATUS.DELETED_LINK,
  });

  const session = await mongoose.startSession();

  try {
    let project;

    await session.withTransaction(async () => {
      // Claimed before any mutation, so a refused restore leaves the link
      // untouched and a project deleted concurrently conflicts instead of
      // letting the link come back inside it.
      project = await claimActiveProject({
        projectId: shortUrl.project,
        ownerId,
        session,
      });

      if (!project) {
        throw projectUnavailableError(
          PROJECT_DELETED_MESSAGE,
          await getProjectSummary(shortUrl.project)
        );
      }

      // An idempotent update keeps the restore correct if the transaction retries.
      // The title was free while this link sat deleted; another may hold it now.
      try {
        await ShortUrl.updateOne(
          { _id: shortUrl._id, owner: ownerId, status: URL_STATUS.DELETED_LINK },
          { $set: { status: URL_STATUS.ACTIVE, deletedAt: null } },
          { session }
        );
      } catch (error) {
        throw toWriteConflict(error, RESTORE_TITLE_TAKEN_MESSAGE);
      }
    });

    shortUrl.status = URL_STATUS.ACTIVE;
    shortUrl.deletedAt = null;

    return { shortUrl: await withLifetimeTotal(shortUrl), project };
  } finally {
    await session.endSession();
  }
};
