/**
 * Copy shared by the two places a project title can be changed — the catalog's
 * rename modal and Project Details' inline editor — so the wording of a 409
 * cannot drift between them.
 */
export const TITLE_CONFLICT_MESSAGE =
  'You already have an active project with this title. Please choose another.';
