import { NextRequest } from 'next/server';

/**
 * Request builders for Route Handler tests.
 *
 * A Route Handler is just a function that takes a request and returns a
 * response, so a test can call it directly — no server, no `fetch`.
 */

const BASE_URL = 'http://localhost:3000';

/** `getRequest('/api/posts?limit=5')` */
export function getRequest(path: string) {
  return new NextRequest(new URL(path, BASE_URL));
}

/** `postRequest('/api/posts', { title: 'Hello' })` */
export function postRequest(path: string, body: unknown) {
  return postRawRequest(path, JSON.stringify(body));
}

/** Same, but sends the body untouched — for testing malformed input. */
export function postRawRequest(path: string, body: string) {
  return new NextRequest(new URL(path, BASE_URL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
