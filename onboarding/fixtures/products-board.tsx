'use client';

import { useActionState, useEffect, useState } from 'react';

/**
 * Client Component for `/products` — reads and writes through `/api/products`.
 *
 * Modelled on `app/posts/posts-board.tsx`. Three things in here are wrong.
 * None of them stops the file compiling.
 */

/** A product as it arrives over JSON: `Date` columns are serialized to strings. */
export type SerializedProduct = {
  id: string;
  name: string;
  priceCents: number;
  sellerId: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateState = { error: string | null };

export function ProductsBoard() {
  const [products, setProducts] = useState<SerializedProduct[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch('/api/products', {
          signal: controller.signal,
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? 'Failed to load products');
        }

        setProducts(body.data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error ? error.message : 'Failed to load products',
        );
      }
    }

    loadProducts();

    return () => controller.abort();
  });

  const [createState, createProduct, isCreating] = useActionState<
    CreateState,
    FormData
  >(
    async (_previous, formData) => {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.get('name'),
            priceCents: Number(formData.get('priceCents')),
          }),
        });
        const body = await response.json();

        if (!response.ok) {
          return { error: body.error ?? 'Failed to create product' };
        }

        setProducts((current) => [body.data, ...(current ?? [])]);

        return { error: null };
      } catch {
        return { error: 'Failed to create product' };
      }
    },
    { error: null },
  );

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          New product
        </h2>

        <form action={createProduct} className="flex flex-col gap-3">
          <Field label="Name" name="name" required />
          <Field
            label="Price"
            name="priceCents"
            required
            placeholder="In cents, so 899 is 8.99"
          />

          <button
            type="submit"
            disabled={isCreating}
            className="h-10 self-start rounded-full bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
          >
            {isCreating ? 'Creating…' : 'Create product'}
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
          Products
        </h2>

        {loadError ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {loadError}
          </p>
        ) : products === null ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No products yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map((product) => (
              <li className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
                <h3 className="font-medium text-black dark:text-zinc-50">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  £{product.priceCents}
                </p>
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
