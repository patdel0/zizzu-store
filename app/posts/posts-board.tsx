'use client';

import { useActionState, useEffect, useState } from 'react';

/**
 * Client Component template — reads and writes through `/api/posts`.
 *
 * A Server Component can query the database directly and is the better default
 * for read-only rendering. Go through a Route Handler, as this does, when the
 * data has to change in response to user interaction on an already-rendered
 * page.
 */

/** A post as it arrives over JSON: `Date` columns are serialized to strings. */
export type SerializedPost = {
  id: string;
  title: string;
  content: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

type CreateState = { error: string | null };

export function PostsBoard() {
  const [posts, setPosts] = useState<SerializedPost[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Aborting on unmount keeps a slow response from setting state on a
    // component that is no longer mounted.
    const controller = new AbortController();

    async function loadPosts() {
      try {
        const response = await fetch('/api/posts', {
          signal: controller.signal,
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? 'Failed to load posts');
        }

        setPosts(body.data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(error instanceof Error ? error.message : 'Failed to load posts');
      }
    }

    loadPosts();

    return () => controller.abort();
  }, []);

  const [createState, createPost, isCreating] = useActionState<
    CreateState,
    FormData
  >(
    async (_previous, formData) => {
      const content = String(formData.get('content') ?? '').trim();

      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.get('title'),
            content: content === '' ? null : content,
            authorId: formData.get('authorId'),
          }),
        });
        const body = await response.json();

        if (!response.ok) {
          return { error: body.error ?? 'Failed to create post' };
        }

        // The handler answers with the created row, so the list can be updated
        // without a second round trip.
        setPosts((current) => [body.data, ...(current ?? [])]);

        return { error: null };
      } catch {
        return { error: 'Failed to create post' };
      }
    },
    { error: null },
  );

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          New post
        </h2>

        {/* React resets an uncontrolled form once its action resolves. */}
        <form action={createPost} className="flex flex-col gap-3">
          <Field label="Title" name="title" required />
          <Field label="Content" name="content" />
          <Field
            label="Author ID"
            name="authorId"
            required
            placeholder="UUID of an existing user"
          />

          <button
            type="submit"
            disabled={isCreating}
            className="h-10 self-start rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
          >
            {isCreating ? 'Creating…' : 'Create post'}
          </button>

          {createState.error ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {createState.error}
            </p>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Posts
        </h2>

        {loadError ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {loadError}
          </p>
        ) : posts === null ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No posts yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <h3 className="font-medium text-black dark:text-zinc-50">
                  {post.title}
                </h3>
                {post.content ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {post.content}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-10 rounded-md border border-black/[.08] px-3 text-black dark:border-white/[.145] dark:text-zinc-50"
      />
    </label>
  );
}
