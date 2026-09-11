/**
 * Shapes of the backend's standard response envelope.
 * Every endpoint except `GET /urls/:urlId/qr` (binary PNG) uses these.
 */

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

/**
 * One entry in an error response's `errors` array.
 *
 * `field` is the offending input for validation failures (HTTP 422).
 * `project` is present only on the 409 returned when restoring a link whose
 * parent project is deleted, and carries that project so the client can name it.
 */
export interface FieldError {
  field: string;
  message: string;
  project?: { _id: string; title: string; deletedAt: string | null };
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: FieldError[];
}
