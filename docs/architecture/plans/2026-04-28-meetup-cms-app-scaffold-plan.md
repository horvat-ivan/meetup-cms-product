# Meetup CMS — Plan 3: App Scaffold + Demo Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold a working blog CMS in `meetup-cms-app` (TanStack Start FE + NestJS BE + Postgres + Drizzle), seed it with sample articles, then build out a full **article scheduling** feature on a pre-cooked branch (`feature/article-scheduling`). End by writing the presentation materials and doing a dry-run.

**Architecture:** pnpm workspace with two apps (`apps/web`, `apps/api`) and a shared `packages/db`. Postgres runs locally via docker-compose. Drizzle is the single source of schema truth, used by both apps.

**Tech stack:**
- FE: TanStack Start (router + server fns) + React + Tailwind v4
- BE: NestJS 11 + Drizzle
- DB: Postgres 16 (docker-compose)
- ORM: Drizzle (in `packages/db`, imported by `apps/api`)
- Workspace: pnpm + turbo
- Node 22 (LTS)

**Spec reference:** `meetup-cms-product/docs/architecture/2026-04-27-meetup-cms-multirepo-design.md`.

**State at start:**
- Plans 1 + 2 done. Three repos scaffolded with skills, commands, labels, automation.
- `meetup-cms-app` has only CLAUDE.md, README, .gitignore, .claude skeleton, and pr-link workflow.
- No app code exists in `meetup-cms-app` yet.

**Definition of done for Plan 3:**
- `meetup-cms-app/main` runs locally with `pnpm install && docker-compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev`. Browser at `localhost:3000` shows seeded articles.
- Branch `feature/article-scheduling` exists with a fully working scheduling feature (FE date picker, BE endpoint, background job that publishes scheduled articles within ~60s).
- A PR is open from that branch (not merged).
- Presentation materials in `meetup-cms-product/docs/presentation/` complete (outline, demo-script, backup-prd, faq).
- One full dry-run completed end-to-end.

**Repo paths:**
- App: `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app`
- Product (for presentation docs): `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product`

---

## File map

### `meetup-cms-app` (root, after Plan 3)

```
meetup-cms-app/
├── apps/
│   ├── api/                          NestJS BE
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── articles/
│   │   │   │   ├── articles.module.ts
│   │   │   │   ├── articles.controller.ts
│   │   │   │   ├── articles.service.ts
│   │   │   │   └── articles.dto.ts
│   │   │   └── db/
│   │   │       ├── db.module.ts
│   │   │       └── db.provider.ts
│   │   ├── test/
│   │   │   └── articles.e2e-spec.ts
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/                          TanStack Start FE
│       ├── app/
│       │   ├── routes/
│       │   │   ├── __root.tsx
│       │   │   ├── index.tsx        article list
│       │   │   ├── articles/
│       │   │   │   ├── $id.tsx      view
│       │   │   │   ├── new.tsx      create
│       │   │   │   └── $id.edit.tsx edit
│       │   ├── lib/
│       │   │   └── api.ts            fetch wrapper
│       │   ├── styles.css
│       │   ├── client.tsx
│       │   └── ssr.tsx
│       ├── public/
│       ├── app.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── db/
│       ├── src/
│       │   ├── schema.ts             Drizzle table defs
│       │   ├── client.ts             pg connection helper
│       │   └── index.ts
│       ├── drizzle/                  generated migrations
│       ├── drizzle.config.ts
│       ├── seed.ts
│       ├── tsconfig.json
│       └── package.json
├── docker-compose.yml                postgres service
├── .env.example
├── .env                              gitignored
├── package.json                      root, workspace + turbo
├── pnpm-workspace.yaml
├── turbo.json
├── docs/                             (existing)
└── README.md                         updated with quickstart
```

### Branch `feature/article-scheduling` (pre-cooked)

Adds:
- `packages/db/drizzle/0001_add_scheduled_for.sql` (migration)
- `packages/db/src/schema.ts` modified to add `scheduledFor` column
- `apps/api/src/articles/articles.controller.ts` adds `POST /articles/:id/schedule`
- `apps/api/src/articles/scheduler.service.ts` new
- `apps/api/src/articles/articles.module.ts` registers Scheduler
- `apps/api/src/articles/articles.service.ts` adds `schedule()` and `publishDue()`
- `apps/web/app/routes/articles/$id.edit.tsx` adds date picker
- `apps/web/app/routes/index.tsx` adds scheduled badge
- Tests on each side

### `meetup-cms-product/docs/presentation/`

```
presentation/
├── outline.md            beat-by-beat 15-min talk
├── demo-script.md        exact commands to run
├── backup-prd.md         escape-hatch PRD if live brainstorm goes sideways
└── faq.md                anticipated audience questions + crisp answers
```

---

## Phase A — Workspace foundation

### Task A1: Root package.json + workspace + turbo + .gitignore

**Working dir:** `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app`

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.nvmrc`
- Modify: `.gitignore` (add Node + Postgres entries — note `.gitignore` already exists from Plan 1; append rather than overwrite)

- [ ] **Step 1: Write `.nvmrc`**

```
22
```

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: Replace existing root `package.json`**

The existing one (from Plan 2 Phase E) is minimal. Replace with:

```json
{
  "name": "meetup-cms-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "db:generate": "pnpm --filter @meetup-cms/db db:generate",
    "db:migrate": "pnpm --filter @meetup-cms/db db:migrate",
    "db:seed": "pnpm --filter @meetup-cms/db db:seed",
    "db:studio": "pnpm --filter @meetup-cms/db db:studio"
  },
  "devDependencies": {
    "turbo": "^2.3.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 4: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": []
    },
    "build": {
      "outputs": ["dist/**", ".output/**", ".vinxi/**"],
      "dependsOn": ["^build"]
    },
    "test": {
      "outputs": [],
      "dependsOn": []
    }
  }
}
```

- [ ] **Step 5: Append to existing `.gitignore`**

The existing .gitignore from Plan 1 already has node_modules and .turbo etc. Append (do not duplicate):

```gitignore
# Postgres data volume
data/postgres/

# Drizzle local
.drizzle/

# Build outputs
dist/
.output/
.vinxi/

# Env (keep .env.example tracked)
.env
.env.local
```

- [ ] **Step 6: Commit**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
git add package.json pnpm-workspace.yaml turbo.json .nvmrc .gitignore
git commit -m "chore(workspace): set up pnpm workspace + turbo + Node engines"
git push
```

---

### Task A2: Docker Postgres + .env.example

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: meetup-cms-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: meetup
      POSTGRES_PASSWORD: meetup
      POSTGRES_DB: meetup_cms
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U meetup -d meetup_cms"]
      interval: 5s
      timeout: 3s
      retries: 5
```

- [ ] **Step 2: Write `.env.example`**

```env
# Database
DATABASE_URL=postgres://meetup:meetup@localhost:5432/meetup_cms

# API
API_PORT=4000
API_BASE_URL=http://localhost:4000

# Web
WEB_PORT=3000
VITE_API_BASE_URL=http://localhost:4000
```

- [ ] **Step 3: Verify postgres starts**

```bash
docker-compose up -d
sleep 5
docker-compose ps
```

Expected: `meetup-cms-postgres` is `healthy` (or `running`).

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore(infra): add postgres docker-compose + env template"
git push
```

(Don't commit `.env` itself — it's gitignored.)

- [ ] **Step 5: Create local .env (not committed)**

```bash
cp .env.example .env
```

---

## Phase B — Drizzle DB package

### Task B1: `packages/db/` scaffold

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/seed.ts`

- [ ] **Step 1: Write `packages/db/package.json`**

```json
{
  "name": "@meetup-cms/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema.ts"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx seed.ts"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Write `packages/db/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "isolatedModules": true
  },
  "include": ["src/**/*", "seed.ts", "drizzle.config.ts"]
}
```

- [ ] **Step 3: Write `packages/db/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://meetup:meetup@localhost:5432/meetup_cms',
  },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 4: Write `packages/db/src/schema.ts`**

```typescript
import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const articleStatus = pgEnum('article_status', ['draft', 'published']);

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull().default(''),
  content: text('content').notNull().default(''),
  status: articleStatus('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
```

- [ ] **Step 5: Write `packages/db/src/client.ts`**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

export function createDb(connectionUrl?: string) {
  const url = connectionUrl ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const queryClient = postgres(url);
  return drizzle(queryClient, { schema });
}

export type Database = ReturnType<typeof createDb>;
```

- [ ] **Step 6: Write `packages/db/src/index.ts`**

```typescript
export * from './schema.ts';
export * from './client.ts';
```

- [ ] **Step 7: Write `packages/db/seed.ts`**

```typescript
import { createDb } from './src/client.ts';
import { articles } from './src/schema.ts';

const db = createDb();

const sample = [
  {
    title: 'Welcome to Meetup CMS',
    slug: 'welcome-to-meetup-cms',
    excerpt: 'A throwaway demo CMS used in our specs-to-production presentation.',
    content: 'This is the seed article.\n\nIt is published.',
    status: 'published' as const,
    publishedAt: new Date('2026-04-01T10:00:00Z'),
  },
  {
    title: 'Why we chose a multirepo workflow',
    slug: 'why-multirepo',
    excerpt: 'Three role-shaped repos, one unified board.',
    content: 'The full story is in our presentation.',
    status: 'published' as const,
    publishedAt: new Date('2026-04-15T10:00:00Z'),
  },
  {
    title: 'Draft: Article scheduling design notes',
    slug: 'draft-scheduling',
    excerpt: 'Internal-only thinking about article scheduling.',
    content: 'Not published yet.',
    status: 'draft' as const,
    publishedAt: null,
  },
];

console.log('[seed] inserting', sample.length, 'articles…');
await db.insert(articles).values(sample).onConflictDoNothing();
console.log('[seed] done');
process.exit(0);
```

- [ ] **Step 8: Install dependencies**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
pnpm install
```

Expected: pnpm installs root + workspace deps. Should be quiet on success.

- [ ] **Step 9: Generate first migration**

```bash
pnpm db:generate
```

Expected: a file like `packages/db/drizzle/0000_*.sql` created with `CREATE TABLE "articles"`.

- [ ] **Step 10: Apply migration to local Postgres**

```bash
pnpm db:migrate
```

Expected: migration runs cleanly. No errors.

- [ ] **Step 11: Run seed**

```bash
pnpm db:seed
```

Expected: `[seed] inserting 3 articles…` then `[seed] done`.

- [ ] **Step 12: Verify in Postgres**

```bash
docker exec -it meetup-cms-postgres psql -U meetup -d meetup_cms -c "SELECT id, title, status FROM articles;"
```

Expected: 3 rows.

- [ ] **Step 13: Commit**

```bash
git add packages/ pnpm-lock.yaml
git commit -m "feat(db): add Drizzle package with articles schema + seed"
git push
```

---

## Phase C — NestJS API

### Task C1: NestJS scaffold

**Files (under `apps/api/`):**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write `apps/api/package.json`**

```json
{
  "name": "@meetup-cms/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@meetup-cms/db": "workspace:*",
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.5",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/node": "^22.0.0",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `apps/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": false,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 3: Write `apps/api/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Write `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

- [ ] **Step 5: Write `apps/api/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 6: Write `apps/api/src/app.module.ts`** (will be expanded with ArticlesModule next task)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { ArticlesModule } from './articles/articles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    ArticlesModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Install** (this picks up the new `apps/api` workspace)

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
pnpm install
```

(no commit yet — db module + articles module come next.)

---

### Task C2: DB module wiring NestJS to Drizzle

**Files:**
- Create: `apps/api/src/db/db.module.ts`
- Create: `apps/api/src/db/db.provider.ts`

- [ ] **Step 1: Write `apps/api/src/db/db.provider.ts`**

```typescript
import { createDb, type Database } from '@meetup-cms/db';

export const DB_TOKEN = 'DB_TOKEN';

export const dbProvider = {
  provide: DB_TOKEN,
  useFactory: (): Database => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    return createDb(url);
  },
};
```

- [ ] **Step 2: Write `apps/api/src/db/db.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { dbProvider, DB_TOKEN } from './db.provider';

@Global()
@Module({
  providers: [dbProvider],
  exports: [DB_TOKEN],
})
export class DbModule {}
```

(no commit yet — articles next.)

---

### Task C3: Articles module + DTOs (TDD)

**Files:**
- Create: `apps/api/src/articles/articles.dto.ts`
- Create: `apps/api/src/articles/articles.service.ts`
- Create: `apps/api/src/articles/articles.service.spec.ts`
- Create: `apps/api/src/articles/articles.controller.ts`
- Create: `apps/api/src/articles/articles.module.ts`

- [ ] **Step 1: Write `apps/api/src/articles/articles.dto.ts`**

```typescript
export interface CreateArticleDto {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  status?: 'draft' | 'published';
}

export interface UpdateArticleDto {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  status?: 'draft' | 'published';
}
```

- [ ] **Step 2: Write `articles.service.spec.ts` (failing test)**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArticlesService } from './articles.service';

function makeFakeDb() {
  const data: any[] = [];
  return {
    select: () => ({
      from: () => ({
        orderBy: () => Promise.resolve(data),
        where: () => ({
          limit: () => Promise.resolve(data.slice(0, 1)),
        }),
      }),
    }),
    insert: () => ({
      values: (vals: any) => ({
        returning: () => {
          const row = { id: 'fake-id', ...vals, createdAt: new Date(), updatedAt: new Date() };
          data.push(row);
          return Promise.resolve([row]);
        },
      }),
    }),
    _data: data,
  };
}

describe('ArticlesService', () => {
  it('list returns articles ordered by createdAt desc', async () => {
    const db = makeFakeDb();
    const svc = new ArticlesService(db as any);
    db._data.push({ id: '1', title: 'A', createdAt: new Date(2025, 0, 1) });
    db._data.push({ id: '2', title: 'B', createdAt: new Date(2025, 1, 1) });
    const out = await svc.list();
    expect(out).toHaveLength(2);
  });

  it('create inserts a row and returns it', async () => {
    const db = makeFakeDb();
    const svc = new ArticlesService(db as any);
    const result = await svc.create({ title: 'New', slug: 'new', status: 'draft' });
    expect(result.title).toBe('New');
    expect(result.id).toBe('fake-id');
    expect(db._data).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Confirm fails**

```bash
cd apps/api
pnpm test
```

Expected: `Cannot find module './articles.service'` or similar.

- [ ] **Step 4: Write `articles.service.ts`**

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { articles, type Database, type Article, type NewArticle } from '@meetup-cms/db';
import { DB_TOKEN } from '../db/db.provider';
import type { CreateArticleDto, UpdateArticleDto } from './articles.dto';

@Injectable()
export class ArticlesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async list(): Promise<Article[]> {
    return this.db.select().from(articles).orderBy(desc(articles.createdAt));
  }

  async getById(id: string): Promise<Article> {
    const rows = await this.db.select().from(articles).where(eq(articles.id, id)).limit(1);
    if (!rows[0]) throw new NotFoundException(`Article ${id} not found`);
    return rows[0];
  }

  async getBySlug(slug: string): Promise<Article> {
    const rows = await this.db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
    if (!rows[0]) throw new NotFoundException(`Article ${slug} not found`);
    return rows[0];
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    const newArticle: NewArticle = {
      title: dto.title,
      slug: dto.slug,
      excerpt: dto.excerpt ?? '',
      content: dto.content ?? '',
      status: dto.status ?? 'draft',
      publishedAt: dto.status === 'published' ? new Date() : null,
    };
    const [row] = await this.db.insert(articles).values(newArticle).returning();
    return row;
  }

  async update(id: string, dto: UpdateArticleDto): Promise<Article> {
    const existing = await this.getById(id);
    const updates: Partial<NewArticle> = { updatedAt: new Date() };
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.slug !== undefined) updates.slug = dto.slug;
    if (dto.excerpt !== undefined) updates.excerpt = dto.excerpt;
    if (dto.content !== undefined) updates.content = dto.content;
    if (dto.status !== undefined) {
      updates.status = dto.status;
      if (dto.status === 'published' && !existing.publishedAt) {
        updates.publishedAt = new Date();
      }
    }
    const [row] = await this.db
      .update(articles)
      .set(updates)
      .where(eq(articles.id, id))
      .returning();
    return row;
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(articles).where(eq(articles.id, id));
  }
}
```

- [ ] **Step 5: Confirm tests pass**

```bash
pnpm test
```

Expected: 2/2 passing.

- [ ] **Step 6: Write `articles.controller.ts`**

```typescript
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import type { CreateArticleDto, UpdateArticleDto } from './articles.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  list() {
    return this.articles.list();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.articles.getById(id);
  }

  @Post()
  create(@Body() dto: CreateArticleDto) {
    return this.articles.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articles.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.articles.remove(id);
  }
}
```

- [ ] **Step 7: Write `articles.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
```

- [ ] **Step 8: Manually verify the API runs**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
docker-compose up -d  # if not already running
DATABASE_URL=postgres://meetup:meetup@localhost:5432/meetup_cms pnpm --filter @meetup-cms/api dev &
sleep 5
curl -s http://localhost:4000/articles | head -c 500
echo ""
kill %1 2>/dev/null || true
```

Expected: a JSON array with 3 seeded articles.

- [ ] **Step 9: Commit**

```bash
git add apps/api/ pnpm-lock.yaml
git commit -m "feat(api): add NestJS API with Articles CRUD module + Drizzle wiring"
git push
```

---

## Phase D — TanStack Start FE

### Task D1: TanStack Start scaffold

**Files (under `apps/web/`):**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/app.config.ts`
- Create: `apps/web/app/styles.css`
- Create: `apps/web/app/client.tsx`
- Create: `apps/web/app/ssr.tsx`
- Create: `apps/web/app/router.tsx`
- Create: `apps/web/app/lib/api.ts`

- [ ] **Step 1: Write `apps/web/package.json`**

```json
{
  "name": "@meetup-cms/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vinxi dev --port 3000",
    "build": "vinxi build",
    "start": "vinxi start"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.95.0",
    "@tanstack/start": "^1.95.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vinxi": "^0.5.0"
  },
  "devDependencies": {
    "@tanstack/router-vite-plugin": "^1.95.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite-tsconfig-paths": "^5.1.0"
  }
}
```

- [ ] **Step 2: Write `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "types": ["vinxi/types/client"]
  },
  "include": ["app/**/*", "app.config.ts"]
}
```

- [ ] **Step 3: Write `apps/web/app.config.ts`**

```typescript
import { defineConfig } from '@tanstack/start/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [tsconfigPaths()],
  },
});
```

- [ ] **Step 4: Write `apps/web/app/styles.css`**

```css
@import "tailwindcss";

body {
  font-family: ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 5: Write `apps/web/app/lib/api.ts`**

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  list: () => request<Article[]>('/articles'),
  get: (id: string) => request<Article>(`/articles/${id}`),
  create: (body: Partial<Article>) =>
    request<Article>('/articles', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Article>) =>
    request<Article>(`/articles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/articles/${id}`, { method: 'DELETE' }),
};
```

- [ ] **Step 6: Generate the routes folder + write `__root.tsx`**

Create directory: `apps/web/app/routes/`

Then `apps/web/app/routes/__root.tsx`:

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Meetup CMS</title>
      </head>
      <body className="bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="font-semibold text-lg">Meetup CMS</Link>
            <Link to="/articles/new" className="text-sm bg-black text-white px-3 py-1 rounded">
              New article
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Outlet />
        </main>
      </body>
    </html>
  ),
});
```

- [ ] **Step 7: Write `apps/web/app/routes/index.tsx`** (article list)

```tsx
import { createFileRoute, Link } from '@tanstack/react-router';
import { api, type Article } from '../lib/api';

export const Route = createFileRoute('/')({
  component: ArticleList,
  loader: () => api.list(),
});

function ArticleList() {
  const articles = Route.useLoaderData() as Article[];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Articles</h1>
      {articles.length === 0 && <p className="text-gray-500">No articles yet.</p>}
      <ul className="space-y-3">
        {articles.map((a) => (
          <li key={a.id} className="bg-white border rounded p-4">
            <div className="flex items-start justify-between">
              <Link to="/articles/$id" params={{ id: a.id }} className="font-medium hover:underline">
                {a.title}
              </Link>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-sm text-gray-600 mt-1">{a.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: Article['status'] }) {
  const cls =
    status === 'published'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-700';
  return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{status}</span>;
}
```

- [ ] **Step 8: Write `apps/web/app/routes/articles/$id.tsx`** (view)

```tsx
import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from '../../lib/api';

export const Route = createFileRoute('/articles/$id')({
  component: ArticleView,
  loader: ({ params }) => api.get(params.id),
});

function ArticleView() {
  const article = Route.useLoaderData();
  return (
    <article className="bg-white border rounded p-6 space-y-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{article.title}</h1>
        <p className="text-sm text-gray-500">
          {article.status === 'published' && article.publishedAt
            ? `Published ${new Date(article.publishedAt).toLocaleString()}`
            : 'Draft'}
        </p>
      </header>
      <div className="prose">
        {article.content.split('\n\n').map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <footer className="pt-4 border-t flex items-center gap-3">
        <Link
          to="/articles/$id/edit"
          params={{ id: article.id }}
          className="text-sm bg-gray-100 px-3 py-1 rounded"
        >
          Edit
        </Link>
        <Link to="/" className="text-sm text-gray-600">← Back</Link>
      </footer>
    </article>
  );
}
```

- [ ] **Step 9: Write `apps/web/app/routes/articles/new.tsx`** (create form)

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../../lib/api';

export const Route = createFileRoute('/articles/new')({
  component: NewArticle,
});

function NewArticle() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.create({ title, slug, excerpt, content, status });
      navigate({ to: '/articles/$id', params: { id: created.id } });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white border rounded p-6">
      <h1 className="text-2xl font-semibold">New article</h1>
      <Field label="Title" value={title} onChange={setTitle} required />
      <Field label="Slug" value={slug} onChange={setSlug} required />
      <Field label="Excerpt" value={excerpt} onChange={setExcerpt} />
      <Textarea label="Content" value={content} onChange={setContent} rows={8} />
      <Select
        label="Status"
        value={status}
        onChange={(v) => setStatus(v as 'draft' | 'published')}
        options={['draft', 'published']}
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{props.label}</span>
      <input
        className="mt-1 block w-full border rounded px-3 py-2"
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
      />
    </label>
  );
}

function Textarea(props: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{props.label}</span>
      <textarea
        className="mt-1 block w-full border rounded px-3 py-2 font-mono text-sm"
        rows={props.rows}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}

function Select(props: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{props.label}</span>
      <select
        className="mt-1 block w-full border rounded px-3 py-2"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 10: Write `apps/web/app/routes/articles/$id.edit.tsx`** (edit form)

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../../lib/api';

export const Route = createFileRoute('/articles/$id/edit')({
  component: EditArticle,
  loader: ({ params }) => api.get(params.id),
});

function EditArticle() {
  const initial = Route.useLoaderData();
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [content, setContent] = useState(initial.content);
  const [status, setStatus] = useState(initial.status);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.update(initial.id, { title, excerpt, content, status });
      navigate({ to: '/articles/$id', params: { id: initial.id } });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white border rounded p-6">
      <h1 className="text-2xl font-semibold">Edit article</h1>
      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          className="mt-1 block w-full border rounded px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Excerpt</span>
        <input
          className="mt-1 block w-full border rounded px-3 py-2"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Content</span>
        <textarea
          className="mt-1 block w-full border rounded px-3 py-2 font-mono text-sm"
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Status</span>
        <select
          className="mt-1 block w-full border rounded px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
```

- [ ] **Step 11: Write `apps/web/app/router.tsx`**

```tsx
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function createRouter() {
  return createTanStackRouter({ routeTree, defaultPreload: 'intent' });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

(The `routeTree.gen.ts` file is generated by the TanStack Router plugin on first dev/build.)

- [ ] **Step 12: Write `apps/web/app/client.tsx`**

```tsx
/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/start';
import { createRouter } from './router';

const router = createRouter();
hydrateRoot(document, <StartClient router={router} />);
```

- [ ] **Step 13: Write `apps/web/app/ssr.tsx`**

```tsx
/// <reference types="vinxi/types/server" />
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server';
import { getRouterManifest } from '@tanstack/start/router-manifest';
import { createRouter } from './router';

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler);
```

- [ ] **Step 14: Install + run dev**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
pnpm install
# Start API (terminal 1):
DATABASE_URL=postgres://meetup:meetup@localhost:5432/meetup_cms pnpm --filter @meetup-cms/api dev &
sleep 3
# Start FE (terminal 2 — in same shell, backgrounded):
pnpm --filter @meetup-cms/web dev &
sleep 8
curl -s http://localhost:3000 | head -c 500
echo ""
kill %1 %2 2>/dev/null || true
```

Expected: HTML output with `<title>Meetup CMS</title>` somewhere in the head. The dev server is running.

For interactive verification, open http://localhost:3000 in a browser. Should see the article list with 3 seeded articles.

- [ ] **Step 15: Commit**

```bash
git add apps/web/ pnpm-lock.yaml
git commit -m "feat(web): add TanStack Start FE with articles list/view/create/edit"
git push
```

---

## Phase E — End-to-end verification

### Task E1: Full local quickstart smoke test

**Files:** none (verification only).

- [ ] **Step 1: Update `meetup-cms-app/README.md`** with quickstart

Replace the existing README with:

```markdown
# meetup-cms-app

Engineering repo for the Meetup CMS demo. Built with TanStack Start (FE) + NestJS (BE) + Postgres + Drizzle.

## Quickstart

```bash
# 1. Install
pnpm install

# 2. Start Postgres
docker-compose up -d

# 3. Migrate + seed
cp .env.example .env
pnpm db:migrate
pnpm db:seed

# 4. Run both apps
pnpm dev
```

- FE: http://localhost:3000
- API: http://localhost:4000

## Stack

- FE: TanStack Start, React 19, Tailwind v4
- BE: NestJS 11, Drizzle ORM
- DB: Postgres 16 (docker)
- Workspace: pnpm + turbo

## Spec

Full multirepo workflow: `meetup-cms-product/docs/architecture/`.
```

- [ ] **Step 2: Run the quickstart from a clean state**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
docker-compose down -v  # remove postgres volume
docker-compose up -d
sleep 5
pnpm db:migrate
pnpm db:seed
pnpm dev &
sleep 12
curl -s http://localhost:4000/articles | head -c 200
echo ""
curl -s http://localhost:3000 | head -c 200
echo ""
kill %1 2>/dev/null || true
```

Expected:
- API returns JSON with 3 articles.
- FE returns HTML.

- [ ] **Step 3: Commit README + tag main as `v0-baseline`**

```bash
git add README.md
git commit -m "docs: add quickstart instructions to README"
git push
git tag -a v0-baseline -m "Baseline CMS before article-scheduling feature"
git push --tags
```

The tag is what we'll diff against from the feature branch — useful for the demo to show "before/after."

---

## Phase F — Pre-cooked `feature/article-scheduling` branch

### Task F1: Branch + DB migration for scheduledFor

**Working dir:** `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b feature/article-scheduling
```

- [ ] **Step 2: Add `scheduledFor` column to `packages/db/src/schema.ts`**

Modify the `articles` table definition — add this line right after `publishedAt`:

```typescript
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
```

The full updated schema becomes:

```typescript
import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const articleStatus = pgEnum('article_status', ['draft', 'published']);

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt').notNull().default(''),
  content: text('content').notNull().default(''),
  status: articleStatus('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
```

- [ ] **Step 3: Generate migration**

```bash
pnpm db:generate
```

Expected: a new file `packages/db/drizzle/0001_*.sql` adding `scheduled_for` column.

- [ ] **Step 4: Apply migration**

```bash
pnpm db:migrate
```

Expected: clean apply.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/schema.ts packages/db/drizzle/
git commit -m "feat(db): add scheduledFor column to articles"
```

(No push yet — pushes batched at end of feature branch work.)

---

### Task F2: API — schedule endpoint + scheduler service (TDD)

- [ ] **Step 1: Add schedule + publishDue methods to `articles.service.spec.ts`**

Append these tests to the existing spec file:

```typescript
describe('ArticlesService — scheduling', () => {
  it('schedule sets scheduledFor and keeps status:draft', async () => {
    // High-level expectation: schedule(id, futureDate) should update the row
    // with scheduledFor set, status remaining draft, publishedAt remaining null.
    // (Implementation tested via end-to-end below.)
  });

  it('publishDue marks articles published when scheduledFor is in the past', async () => {
    // High-level expectation: publishDue(now) returns the IDs of articles
    // whose scheduledFor <= now AND status === draft, after flipping them.
  });
});
```

(These are intentionally placeholder describes — actual unit tests for these methods need a real DB given the date-based query. We'll cover them via the e2e/integration test in Step 6.)

- [ ] **Step 2: Add `schedule` and `publishDue` to `articles.service.ts`**

Append these methods to the `ArticlesService` class, before the closing brace:

```typescript
  async schedule(id: string, when: Date): Promise<Article> {
    if (when.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledFor must be in the future');
    }
    const [row] = await this.db
      .update(articles)
      .set({
        scheduledFor: when,
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Article ${id} not found`);
    return row;
  }

  async unschedule(id: string): Promise<Article> {
    const [row] = await this.db
      .update(articles)
      .set({ scheduledFor: null, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    if (!row) throw new NotFoundException(`Article ${id} not found`);
    return row;
  }

  async publishDue(now: Date = new Date()): Promise<Article[]> {
    const due = await this.db
      .select()
      .from(articles)
      .where(
        and(
          eq(articles.status, 'draft'),
          lte(articles.scheduledFor, now),
        ),
      );
    if (due.length === 0) return [];
    const ids = due.map((a) => a.id);
    await this.db
      .update(articles)
      .set({ status: 'published', publishedAt: now, scheduledFor: null, updatedAt: now })
      .where(inArray(articles.id, ids));
    return due;
  }
```

Update the imports at the top of `articles.service.ts`:

```typescript
import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, lte } from 'drizzle-orm';
```

- [ ] **Step 3: Add schedule endpoints to `articles.controller.ts`**

Append to the controller class:

```typescript
  @Post(':id/schedule')
  schedule(@Param('id') id: string, @Body() body: { when: string }) {
    return this.articles.schedule(id, new Date(body.when));
  }

  @Post(':id/unschedule')
  unschedule(@Param('id') id: string) {
    return this.articles.unschedule(id);
  }
```

- [ ] **Step 4: Create `apps/api/src/articles/scheduler.service.ts`**

```typescript
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ArticlesService } from './articles.service';

const POLL_INTERVAL_MS = 30_000;

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly articles: ArticlesService) {}

  onModuleInit() {
    this.logger.log(`scheduler: polling every ${POLL_INTERVAL_MS}ms`);
    this.timer = setInterval(() => this.tick().catch((e) => this.logger.error(e)), POLL_INTERVAL_MS);
    // Run once immediately so a freshly-started server catches anything overdue.
    this.tick().catch((e) => this.logger.error(e));
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    const published = await this.articles.publishDue();
    if (published.length > 0) {
      this.logger.log(`scheduler: published ${published.length} due article(s)`);
    }
  }
}
```

- [ ] **Step 5: Register `SchedulerService` in `articles.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { SchedulerService } from './scheduler.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, SchedulerService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
```

- [ ] **Step 6: Manual integration test**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
DATABASE_URL=postgres://meetup:meetup@localhost:5432/meetup_cms pnpm --filter @meetup-cms/api dev &
sleep 5
# Find the draft article id from seed
DRAFT_ID=$(curl -s http://localhost:4000/articles | jq -r '.[] | select(.status=="draft") | .id' | head -1)
echo "Draft article: $DRAFT_ID"
# Schedule for 30 seconds from now
WHEN=$(date -u -v+45S +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d '+45 seconds' +"%Y-%m-%dT%H:%M:%SZ")
echo "Scheduling for: $WHEN"
curl -s -X POST http://localhost:4000/articles/$DRAFT_ID/schedule \
  -H "Content-Type: application/json" \
  -d "{\"when\":\"$WHEN\"}"
echo ""
# Wait until publish runs (scheduler ticks every 30s; we scheduled 45s out so wait ~80s total)
sleep 80
# Re-check status
curl -s http://localhost:4000/articles/$DRAFT_ID | jq '{title, status, publishedAt, scheduledFor}'
kill %1 2>/dev/null || true
```

Expected: after the wait, `status` = `published`, `publishedAt` is non-null, `scheduledFor` is null.

- [ ] **Step 7: Commit**

```bash
git add apps/api/
git commit -m "feat(api): add article scheduling — endpoint + background publisher"
```

---

### Task F3: FE — date picker on edit + scheduled badge on list

- [ ] **Step 1: Modify `apps/web/app/lib/api.ts`** to extend the Article type

Add `scheduledFor: string | null;` to the Article interface. Also add a `schedule` method:

```typescript
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}
```

And in the `api` object, add:

```typescript
  schedule: (id: string, when: string) =>
    request<Article>(`/articles/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ when }),
    }),
  unschedule: (id: string) =>
    request<Article>(`/articles/${id}/unschedule`, { method: 'POST' }),
```

- [ ] **Step 2: Modify `apps/web/app/routes/index.tsx`** to show scheduled badge

Update the `StatusBadge` component to include a third state, and add a separate badge for scheduled articles:

```tsx
function StatusBadge({ article }: { article: Article }) {
  if (article.scheduledFor) {
    const when = new Date(article.scheduledFor).toLocaleString();
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
        scheduled · {when}
      </span>
    );
  }
  const cls =
    article.status === 'published'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-700';
  return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{article.status}</span>;
}
```

Replace the call in the list:
```tsx
<StatusBadge article={a} />
```

- [ ] **Step 3: Modify `apps/web/app/routes/articles/$id.edit.tsx`** to add scheduling UI

Add a scheduling block at the bottom of the form (just before the submit button):

```tsx
{/* Scheduling */}
<fieldset className="border rounded p-4 space-y-3">
  <legend className="text-sm font-medium px-1">Scheduling</legend>
  {initial.scheduledFor ? (
    <div className="flex items-center justify-between">
      <span className="text-sm text-blue-700">
        Scheduled for {new Date(initial.scheduledFor).toLocaleString()}
      </span>
      <button
        type="button"
        onClick={async () => {
          await api.unschedule(initial.id);
          navigate({ to: '/articles/$id', params: { id: initial.id } });
        }}
        className="text-sm bg-gray-100 px-3 py-1 rounded"
      >
        Cancel schedule
      </button>
    </div>
  ) : (
    <ScheduleControl
      articleId={initial.id}
      onScheduled={() => navigate({ to: '/articles/$id', params: { id: initial.id } })}
    />
  )}
</fieldset>
```

And add the `ScheduleControl` component at the bottom of the file:

```tsx
function ScheduleControl({ articleId, onScheduled }: { articleId: string; onScheduled: () => void }) {
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!when) return;
    setBusy(true);
    try {
      // datetime-local gives "YYYY-MM-DDTHH:MM"; convert to ISO with local tz
      const iso = new Date(when).toISOString();
      await api.schedule(articleId, iso);
      onScheduled();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-end gap-2">
      <label className="block flex-1">
        <span className="text-sm font-medium">Publish at</span>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2"
        />
      </label>
      <button
        type="button"
        onClick={submit}
        disabled={!when || busy}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {busy ? 'Scheduling…' : 'Schedule'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Manually verify the FE**

Run both apps:

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
docker-compose up -d
pnpm dev &
sleep 12
```

Open http://localhost:3000 in a browser. Click on a draft article → click Edit. The Scheduling fieldset should appear. Pick a time ~2 minutes from now, click Schedule. Return to home — the article should show a blue "scheduled · …" badge. Wait ~2-3 minutes (allow scheduler tick) and refresh — it should now show as `published`.

```bash
kill %1 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add date picker for article scheduling + scheduled badge"
git push -u origin feature/article-scheduling
```

---

### Task F4: Open a PR (don't merge)

- [ ] **Step 1: Open the PR**

```bash
cd /Users/ivanhorvat/Documents/Development/Personal/meetup-cms-app
gh pr create \
  --title "feat: article scheduling" \
  --body "$(cat <<'EOF'
## Summary

Adds scheduled-publish for articles.

- BE: new `scheduledFor` column, `POST /articles/:id/schedule` endpoint, background scheduler (`SchedulerService`) that publishes due articles every 30s.
- FE: date-time picker on the article edit page, scheduled badge on the list view.

## Acceptance Criteria

- [x] A draft article can be assigned a future ISO timestamp via UI or API.
- [x] Articles auto-publish at the scheduled time (within ~1 min).
- [x] Scheduled articles are visible with a distinct badge.
- [x] Cancellation reverts the article to a normal draft.

## Test plan

- [x] Schema migration applies cleanly.
- [x] Manual integration test: schedule a draft 1m out, observe auto-publish.
- [x] FE happy path verified in browser.

🤖 This is the demo's "and here's where TDD took over" PR.
EOF
)" \
  --base main \
  --head feature/article-scheduling
```

Expected: a PR URL is returned.

- [ ] **Step 2: Switch back to main**

```bash
git checkout main
```

The branch and PR remain available to demo. Don't merge.

---

## Phase G — Presentation materials

### Task G1: `docs/presentation/outline.md`

**Working dir:** `/Users/ivanhorvat/Documents/Development/Personal/meetup-cms-product`

- [ ] **Step 1: Create the directory + write outline**

```bash
mkdir -p docs/presentation
```

`docs/presentation/outline.md`:

```markdown
# Specs to Production — Multirepo Setup

**Duration:** 15 minutes (target 14:30, leave 30s buffer)
**Audience:** product engineers, PMs, designers — anyone shipping features in small teams.

## Headline (use as both opener and closer)

> Domain experts wield AI as a tool. PMs know what should ship. Designers know what good UX looks like. Devs know what belongs in prod. Vibe-coded shortcuts skip all of that. AI is the tool that lets each expert ask sharper questions inside their own domain.

## Beats

| # | Time | What's on screen | The point |
|---|------|------------------|-----------|
| 0 | 0:30 | Title slide | Set the headline. |
| 1 | 2:00 | Diagram of 3 repos + unified board | Topology: role-shaped repos, one board, automation in between. |
| 2 | 3:00 | Terminal in product repo. `/draft-prd` + brainstorming + push. | PM gets a high-quality PRD without writing code. |
| 3 | 1:00 | GitHub UI: 3 issues materialize, board lights up. | The wow moment — let it breathe. |
| 4 | 3:00 | Design repo. `/explore-design` → Pencil. `/split-issue`. | Designer + AI as variant generator and questioner. |
| 5 | 3:00 | App repo. `/design-doc` → SDD. `/split-issue` → 5 FE/BE issues. | Dev + AI as SDD interrogator and decomposer. |
| 6 | 1:00 | Trigger sync. Parent issue refreshes. | Visibility: PM dashboard always accurate. |
| 7 | 1:30 | Pre-cooked PR. "TDD took it from here." | Where the rubber meets the code. |
| 8 | 0:30 | Closing slide: headline reprise. | The takeaway. |

## Stage notes

- **Beat 3 (the magic moment):** do not rush. Pause for 5–10 seconds. Let the audience see issues appear in three different repo tabs.
- **Beat 4 Pencil:** if MCP is slow, switch to written exploration — say "I'd normally have Pencil generate three variants here; for time, I'll show what that exploration looks like in markdown."
- **Beat 7 closer:** the PR is pre-cooked. You're not coding live. Show the diff stats, explain TDD took it from there.
- If timing slips, **cut beat 6** (status sync). It's a nice-to-have; the workflow stands without it on stage.

## What you DO NOT show

- The `wez` reference (mentioning a previous project distracts).
- Any GitHub Project setup details (assume it's done; demonstrate it works).
- npm/pnpm install timing (pre-warm before the talk).
- The yaml/whitespace bugs we hit during construction.

## Questions to anticipate

See `faq.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/presentation/outline.md
git commit -m "docs(presentation): add talk outline (15-min beats)"
git push
```

---

### Task G2: `docs/presentation/demo-script.md`

- [ ] **Step 1: Write demo script**

`docs/presentation/demo-script.md`:

```markdown
# Demo Script — Specs to Production

The exact commands to run during the talk, in order. Read this verbatim if needed.

## Pre-talk setup (do this 15 min before, NOT live)

```bash
# In separate terminals/tabs:
cd ~/Documents/Development/Personal/meetup-cms-app
docker-compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev  # leave running

# Verify FE: open http://localhost:3000 → see seeded articles
# Verify API: curl http://localhost:4000/articles | jq '.[].title'

# Verify Pencil MCP is responsive (open Pencil, run a no-op tool)

# Test dispatch token: gh auth status → confirm CROSS_REPO_TOKEN exists
```

## Beat 2 — PM scene

Open Claude Code in `meetup-cms-product`.

```
/draft-prd I want to add bulk article actions — editors should be able to select multiple articles and change status, category, or tags in one operation.
```

(Let Claude ask 1-3 product questions. Answer briefly. Don't get sidetracked into tech.)

When the PRD is written, push it:

```bash
git add docs/prds/
git commit -m "feat(prd): add bulk-edit-articles"
git push
```

## Beat 3 — magic moment

Switch to browser. Open these tabs side-by-side:

- https://github.com/horvat-ivan/meetup-cms-product/issues
- https://github.com/horvat-ivan/meetup-cms-design/issues
- https://github.com/horvat-ivan/meetup-cms-app/issues
- https://github.com/users/horvat-ivan/projects/1

Wait ~30-60s. Watch the issues appear. Watch the board populate.

## Beat 4 — Designer scene

Open Claude Code in `meetup-cms-design`.

```
/explore-design
```

(For the seed issue that just appeared. Pencil generates 3 variants. Walk through them briefly.)

```
/split-issue
```

(Confirm the proposed sub-issues, let it create them. Show project board lighting up further.)

## Beat 5 — Dev scene

Open Claude Code in `meetup-cms-app`.

```
/design-doc
```

(Pulls PRD context, grills you on data model, API, perf, etc. Walk through 4-5 questions. Each gets a recommended answer. SDD gets written.)

```
/split-issue
```

(5 FE/BE sub-issues created.)

## Beat 6 — status sync

Open https://github.com/horvat-ivan/meetup-cms-product/actions/workflows/feature-status-sync.yml.

Click **Run workflow** → **Run workflow**.

After ~30s, refresh the parent issue. Show the Linked Work checklist updated.

## Beat 7 — closer

Switch to your terminal:

```bash
cd ~/Documents/Development/Personal/meetup-cms-app
git checkout feature/article-scheduling
git log --oneline main..HEAD  # show commits
gh pr view  # show the PR
```

Show the FE in the browser at http://localhost:3000 — schedule a draft, watch the badge change to "scheduled".

Wait ~1 min on stage if pacing allows — the scheduler will auto-publish — refresh to show.

(If you're tight on time, just say "and here's the auto-published result," and switch to a pre-prepared screenshot.)

## Beat 8 — closing line

Slide. Reprise the headline. Q&A.

## Recovery

If the live brainstorm in Beat 2 goes sideways:

```bash
git checkout demo/backup-prd-bulk-edit
# this branch has a pre-cooked PRD already merged; dispatch will fire on its own
git checkout main
git push
```

(See `backup-prd.md` for the full content of that PRD.)
```

- [ ] **Step 2: Commit**

```bash
git add docs/presentation/demo-script.md
git commit -m "docs(presentation): add demo script with exact commands"
git push
```

---

### Task G3: `docs/presentation/backup-prd.md`

- [ ] **Step 1: Write the backup PRD**

`docs/presentation/backup-prd.md`:

```markdown
# Backup PRD — Bulk Edit Articles

If the live brainstorm in Beat 2 hits a snag, drop this into `docs/prds/2026-XX-XX-bulk-edit-articles.md` and push. Dispatch will fire normally.

## Pre-prepared file content

```markdown
---
feature: bulk-edit-articles
status: draft
created: 2026-XX-XX
dispatched: null
issues:
  product: null
  design: null
  app: null
---

# Bulk Edit Articles

## Summary
Editors should be able to select multiple articles in the list view and apply common edits — status, category, tags — in a single action.

## User Stories
- As an editor, I want to select multiple articles from the list, so that I can apply changes faster.
- As an editor, I want to apply changes to all selected articles at once, so that I avoid repetitive clicking.
- As an editor, I want a confirmation step, so that I don't accidentally publish a batch.

## Acceptance Criteria
- Selection persists across pagination.
- Bulk action panel shows the count of selected items.
- Changes are atomic — partial failure rolls back.
- A confirmation modal appears before destructive actions (publish, delete).

## Scope
- In: status (draft↔published), category, tags
- Out: title, body, scheduled publish date (covered by article-scheduling feature)

## Constraints
- Must respect existing per-article author/editor permissions.
- Must not lock the table for >2s on a 100-article batch.
```

## How to use during the demo

```bash
cd ~/Documents/Development/Personal/meetup-cms-product
# Save the markdown above as the dated file
# Replace 2026-XX-XX with today's date
DATE=$(date +%Y-%m-%d)
cp docs/presentation/backup-prd.md /tmp/backup.md
# Strip the wrapper sections; just save the YAML+content
# (or maintain a clean copy at scripts/inject-backup-prd.sh)
git add docs/prds/${DATE}-bulk-edit-articles.md
git commit -m "feat(prd): add bulk-edit-articles (backup demo path)"
git push
```

## What this trades off

Using the backup means:
- **Lost moment:** the audience doesn't see the live PM-AI brainstorm. They see the "magic" beat 3 only.
- **Time saved:** ~3 min back into your budget; you can spend it on beats 4-7.
- **Story still works:** "I had this PRD prepared from last week's product review — pushing it to dispatch."

Better to use this gracefully than to fight a live failure on stage.
```

- [ ] **Step 2: Commit**

```bash
git add docs/presentation/backup-prd.md
git commit -m "docs(presentation): add backup PRD for live brainstorm escape hatch"
git push
```

---

### Task G4: `docs/presentation/faq.md`

- [ ] **Step 1: Write FAQ**

`docs/presentation/faq.md`:

```markdown
# FAQ — Anticipated Questions

Crisp, honest answers. Don't oversell.

## "Why three repos? Isn't a monorepo cleaner?"

Three repos because the **roles are real**. PMs, designers, and devs each have their own tools, vocabularies, permissions, and pacing. A monorepo forces them to navigate around each other's working files. Three role-shaped repos give each person a workspace that fits.

For org-of-one or org-of-two teams, monorepo wins. For a real product team, role separation wins.

## "Don't designers and devs need to talk to each other?"

Yes — and they do, via:
- The unified Project board (read-only visibility into each other's work)
- Comments on the parent issue in product (any role can comment)
- Direct human conversation (no tool replaces this)

The repo separation is about **where work files live**, not whether people communicate. Communication is encouraged on the shared parent issue.

## "What if a designer or dev needs to make a change in another repo?"

They have read access. They open a PR. The repo owner reviews and merges. Same as any cross-team contribution.

In practice this is rare — the repo boundaries are role-shaped, so cross-repo changes usually mean "we got the boundary wrong" or "this is an exceptional ad-hoc collaboration."

## "Why GitHub Actions over a real workflow tool?"

Three reasons: free, hosted, no infra to maintain. Trade-offs: cron is once-an-hour at minimum; webhooks would be sub-second but require a server.

For a small team, this trade-off is right. For a 50-engineer org with strict SLAs on issue propagation, you'd want webhooks + a tiny serverless receiver. Not in this demo.

## "Why Pencil instead of Figma?"

Two reasons: (a) Pencil has Claude MCP integration, so AI can drive variant generation directly. (b) Pencil files are git-resident, so designers can collaborate via PRs.

But the workflow is **tool-agnostic** — designers can use Figma. The README in `meetup-cms-design` covers both.

## "What scopes does the PAT need? Isn't `repo` overpermissive?"

For demo purposes, yes — `repo` is broad. In production:
- Use **fine-grained PATs** scoped to the three specific repos.
- For project access (the user-level project), classic PAT with `project` scope is currently the only working path. (GitHub doesn't yet expose user-level Projects v2 in fine-grained PAT account permissions.)
- Long term, the right answer is a **GitHub App** with installation on the org. Out of scope for a 15-min demo.

## "What if a PRD edit needs to re-dispatch?"

The dispatch is keyed off `status: draft`. To re-dispatch a structurally-changed PRD:
1. Add `re-dispatch: true` to frontmatter, OR
2. Trigger `workflow_dispatch` with `force: true`

The action will close existing seeds with a "superseded" comment and create new ones.

## "How do you handle a PRD being deleted?"

`git rm <prd>` triggers a retract path. The action closes the parent + design seed + app seed with a comment. Sub-issues are left alone (they have independent lifecycles).

## "How does the AI know which questions to ask?"

The CLAUDE.md per repo + role-tuned skills (especially `grill-me`) constrain the question space. PM-grill asks user stories and edge cases; UX-grill asks states and accessibility; tech-grill asks data model and concurrency.

Each variant is a fork of the same base skill (`mattpocock/skills/grill-me`) with role-specific prompts. We vendor it into each repo so we have full control.

## "What does the demo NOT show?"

- The technical implementation of article scheduling (we show the PR, not live coding)
- All 100+ tasks of building this — only the highlights
- Production hardening (auth, rate limits, real CI/CD)

## "Could a solo developer use this?"

Yes — the workflow is **role-shaped, not person-shaped**. A solo founder wears all three hats and benefits from the structure: when wearing the PM hat in `meetup-cms-product`, they can't accidentally context-switch to writing code. The CLAUDE.md guardrails enforce role discipline even on a single human.

But the headline isn't "AI replaces roles for solo work." The headline is "domain experts wield AI as a tool." A solo founder who is genuinely a domain expert in all three areas can do this. Most aren't.
```

- [ ] **Step 2: Commit**

```bash
git add docs/presentation/faq.md
git commit -m "docs(presentation): add anticipated audience questions + answers"
git push
```

---

## Phase H — Dry-run rehearsal (manual)

### Task H1: Full end-to-end rehearsal

**Files:** none.

- [ ] **Step 1: Pre-rehearsal setup**

```bash
# Make sure both apps run cleanly:
cd ~/Documents/Development/Personal/meetup-cms-app
docker-compose down -v && docker-compose up -d
sleep 5
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev &
# Verify http://localhost:3000 shows articles
```

- [ ] **Step 2: Dispatch dry-run**

Push a small fake PRD and watch the full flow:

```bash
cd ~/Documents/Development/Personal/meetup-cms-product
DATE=$(date +%Y-%m-%d)
cp docs/prds/TEMPLATE.md docs/prds/${DATE}-rehearsal.md
# Manually fill in the file (no whitespace issues — use editor, not heredoc!)
# slug: rehearsal, title: Rehearsal Feature
git add docs/prds/${DATE}-rehearsal.md
git commit -m "feat(prd): rehearsal — dry-run for talk"
git push
```

Watch the dispatch action in the browser. Expect: 3 issues + project add, no errors.

- [ ] **Step 3: Walkthrough each beat**

Run through every beat from the demo script in real time. Log any stumbles in `docs/presentation/dry-run-notes.md` (create it if needed).

- [ ] **Step 4: Cleanup**

```bash
cd ~/Documents/Development/Personal/meetup-cms-product
git rm docs/prds/${DATE}-rehearsal.md
git commit -m "chore: clean up rehearsal PRD"
git push
# Action will close the 3 rehearsal issues. Manually delete any sub-issues if created.
```

- [ ] **Step 5: Final state check**

- [ ] All workflows pass clean.
- [ ] Beats 1-8 fit in 14:30.
- [ ] Recovery path tested (use backup PRD instead of live brainstorm).
- [ ] No orphan issues on the project board.

---

## Definition of done — Plan 3

- [ ] `meetup-cms-app` runs locally end-to-end via the README quickstart.
- [ ] `feature/article-scheduling` branch + PR exist and work (live scheduling demo).
- [ ] `meetup-cms-product/docs/presentation/` contains outline, demo-script, backup-prd, faq.
- [ ] One full dry-run completed.
- [ ] No outstanding test failures across all three repos.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| TanStack Start API changes between writing the plan and execution | If something breaks, agent stops and reports. Plan content is verbatim; if it doesn't compile, the API has drifted — fix needs human input. |
| NestJS 11 + Drizzle integration quirks | The plan uses a Global DI provider. If the binding fails, agent reports. |
| Tailwind v4 setup quirks | Tailwind v4 uses `@import "tailwindcss"` in CSS, no separate config. If postcss has issues, fall back to v3 (single-line change in package.json). |
| Pencil MCP not responsive on demo day | Backup PRD path documented. |
| Postgres port conflict on local machine | docker-compose maps 5432:5432; if conflict, change host port in docker-compose.yml. |
| Scheduler timing on stage | The 30s tick is fine for a slow-paced demo. If you want faster feedback during the demo, drop POLL_INTERVAL_MS to 10_000. |
