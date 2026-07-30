/** Extracts a human-readable message from either backend error shape:
 *  - validation failures: { errors: string[] }        (400, from the validator)
 *  - service-level failures: { error: string }         (404 / 409 / 500)
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: { errors?: string[]; error?: string } })?.error;
  if (body?.errors?.length) return body.errors.join(' ');
  if (body?.error) return body.error;
  return fallback;
}
