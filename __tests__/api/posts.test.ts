import { GET, POST } from '@/app/api/posts/route';
import { createPost, createUser } from '@/test/helpers';
import { getRequest, postRawRequest, postRequest } from '@/test/request';

/**
 * Tests for the `/api/posts` Route Handlers.
 *
 * These run against a real Postgres database — `npm test` creates it, and every
 * test starts with empty tables. A Route Handler is an ordinary function, so a
 * test builds a request, calls the handler, and checks the response.
 *
 * Copy the shape of these when adding an endpoint:
 *
 *   1. arrange — put the rows you need in the database
 *   2. act     — call the handler with a request
 *   3. assert  — check the status code and the JSON body
 */

describe('GET /api/posts', () => {
  it('returns an empty list when there are no posts', async () => {
    const response = await GET(getRequest('/api/posts'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
  });

  it('returns the newest post first', async () => {
    await createPost({ title: 'Older' });
    await createPost({ title: 'Newer' });

    const response = await GET(getRequest('/api/posts'));
    const { data } = await response.json();

    expect(data.map((post: { title: string }) => post.title)).toEqual([
      'Newer',
      'Older',
    ]);
  });

  it('returns at most `limit` posts', async () => {
    await createPost();
    await createPost();
    await createPost();

    const response = await GET(getRequest('/api/posts?limit=2'));
    const { data } = await response.json();

    expect(data).toHaveLength(2);
  });

  it('rejects a limit outside the allowed range', async () => {
    const response = await GET(getRequest('/api/posts?limit=0'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: '`limit` must be an integer between 1 and 100',
    });
  });
});

describe('POST /api/posts', () => {
  it('creates a post and returns it', async () => {
    const author = await createUser();

    const response = await POST(
      postRequest('/api/posts', {
        title: 'Hello',
        content: 'World',
        authorId: author.id,
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      data: { title: 'Hello', content: 'World', authorId: author.id },
    });
  });

  it('saves the post, so a later request can read it back', async () => {
    const author = await createUser();

    await POST(postRequest('/api/posts', { title: 'Hello', authorId: author.id }));

    const { data } = await (await GET(getRequest('/api/posts'))).json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Hello');
  });

  it('trims whitespace from the title', async () => {
    const author = await createUser();

    const response = await POST(
      postRequest('/api/posts', { title: '  Hello  ', authorId: author.id }),
    );

    expect(await response.json()).toMatchObject({ data: { title: 'Hello' } });
  });

  it('rejects a body that is not valid JSON', async () => {
    const response = await POST(postRawRequest('/api/posts', 'not json'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Request body must be valid JSON',
    });
  });

  it('rejects a missing title', async () => {
    const author = await createUser();

    const response = await POST(
      postRequest('/api/posts', { authorId: author.id }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: '`title` is required' });
  });

  it('rejects an author id that is not a UUID', async () => {
    const response = await POST(
      postRequest('/api/posts', { title: 'Hello', authorId: 'nope' }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: '`authorId` must be a UUID',
    });
  });

  it('rejects an author who does not exist', async () => {
    const response = await POST(
      postRequest('/api/posts', {
        title: 'Hello',
        authorId: '0199c0de-1a2b-7c3d-8e4f-5a6b7c8d9e0f',
      }),
    );

    expect(response.status).toBe(422);
  });
});
