# Welcome to Prisma Next!

Prisma Next lets you query your database in simple, easy-to-read TypeScript. Define what your data looks like, and Prisma Next gives you a fully typed client — with autocomplete for every table, column, and relation.

This project is set up for PostgreSQL. Prisma Next also supports other databases.

## Requirements

- **PostgreSQL 15 or newer.** Older servers are not supported. Run `SELECT version()` against your server to verify.
- The CLI never connects to your database without explicit consent. Pass `--probe-db` to `prisma-cli init` if you want `init` to verify the server version itself.

## Your data contract

Your data contract is the heart of your application. It lives at [`lib/prisma/contract.ts`](lib/prisma/contract.ts) and describes your models:

```typescript
import { defineContract } from '@prisma/orm-postgres/contract-builder';

export const contract = defineContract(
  {},
  ({ field, model }) => ({
    models: {
      User: model('User', {
        fields: {
          id: field.id.uuidv7String(),
          email: field.text().unique(),
          username: field.text().optional(),
          name: field.text().optional(),
        },
      }),
    },
  }),
);
```

Every model you define in your contract can be queried from your app. Your editor will autocomplete the query methods and show you what type each model field is:

```typescript
import { db } from './lib/prisma/db';

const user = await db.orm.public.User
  .where({ email: 'alice@example.com' })
  .first();

// Your editor will show the type of user as
// { id: number; email: string; username: string | null; name: string | null; createdAt: Date; posts: Post[] } | null
```

Your contract has two companion files in the same directory:

- **`contract.json`** — this tells your application what models exist, just like `package-lock.json` tells your package manager what dependencies your project has
- **`contract.d.ts`** — this powers autocomplete and type checking in your editor

Commit both files to git. When you change your contract, run `npx prisma-cli contract emit` to update them.

If you use a framework like Next.js or Vite, the Prisma Next plugin will do this for you automatically.

## Configuration

[`prisma.config.ts`](prisma.config.ts) tells the CLI where your contract lives and how to connect to your database. It loads environment variables from `.env` automatically:

```typescript
import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './lib/prisma/contract.ts',
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});
```

Notice the `DATABASE_URL` above? It's defined in your [`.env`](./.env) file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

You can customize how your environment variables are loaded by changing or removing the `import 'dotenv/config'` line.

## Quick reference

### Commands

```bash
npx prisma-cli contract emit       # Update contract.json and contract.d.ts
npx prisma-cli db init             # Create tables in the database
npx prisma-cli migration status    # Show migration status
```

### Files

| File | Purpose |
|---|---|
| [`lib/prisma/contract.ts`](lib/prisma/contract.ts) | Your data contract — define your models here |
| [`prisma.config.ts`](prisma.config.ts) | CLI configuration |
| [`lib/prisma/db.ts`](lib/prisma/db.ts) | Database client — `import { db } from './lib/prisma/db'` |
| `lib/prisma/contract.json` | Compiled contract (generated) |
| `lib/prisma/contract.d.ts` | Contract types (generated) |

### Workflow

1. Edit [`lib/prisma/contract.ts`](lib/prisma/contract.ts) to add or change models.
2. Run `npx prisma-cli contract emit` to regenerate the contract.
3. Query your models — your IDE will autocomplete everything.
