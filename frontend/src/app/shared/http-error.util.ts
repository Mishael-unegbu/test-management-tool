/**
 * Extracts a human-readable message from either backend error shape:
 *  - validation failures: { errors: string[] }   (400, from a validator)
 *  - service-level failures: { error: string }   (404 / 409 / 500)
 *
 * Every component that calls the API needs this — it was previously
 * duplicated inline in create-project.component.ts and
 * edit-project.component.ts (and would have been copy-pasted a third time
 * for the User Stories components). Extracted here so there's exactly one
 * implementation to keep in sync with the backend's error contract.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: { errors?: string[]; error?: string } })?.error;
  if (body?.errors?.length) return body.errors.join(' ');
  if (body?.error) return body.error;
  return fallback;
}
