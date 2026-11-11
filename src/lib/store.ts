import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { LicenceRecord, Sitting } from "./types";
import recordedLicences from "../../fixtures/licences.json";
import recordedSittings from "../../fixtures/sittings.json";

// Three places data can live, picked at start-up:
//   Upstash Redis when its environment variables are set (production),
//   a JSON file under .data when running locally,
//   memory as a last resort on a read-only filesystem.
// Recorded sittings ship with the repository so the site is never empty.

interface Backend {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  push(listKey: string, value: string): Promise<void>;
  list(listKey: string): Promise<string[]>;
  remove(listKey: string, value: string): Promise<void>;
  incr(key: string, ttlSeconds: number): Promise<number>;
}

function redisBackend(url: string, token: string): Backend {
  const redis = new Redis({ url, token });
  return {
    get: async <T>(key: string) => (await redis.get<T>(key)) ?? null,
    set: async (key, value) => {
      await redis.set(key, value);
    },
    push: async (listKey, value) => {
      await redis.lrem(listKey, 0, value);
      await redis.lpush(listKey, value);
    },
    list: (listKey) => redis.lrange(listKey, 0, 199),
    remove: async (listKey, value) => {
      await redis.lrem(listKey, 0, value);
    },
    incr: async (key, ttlSeconds) => {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, ttlSeconds);
      return n;
    },
  };
}

function localBackend(): Backend {
  const file = path.join(process.cwd(), ".data", "store.json");
  let memory: Record<string, unknown> | null = null;
  let writable = true;
  let chain: Promise<unknown> = Promise.resolve();

  // The file is read on every call. Pages and API routes can run in separate
  // module instances, and a cached copy in one would go stale when the other writes.
  const load = async () => {
    if (!writable && memory) return memory;
    try {
      memory = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      memory = memory ?? {};
    }
    return memory!;
  };
  const save = async () => {
    if (!writable) return;
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(memory));
    } catch {
      writable = false;
    }
  };
  // One write at a time, so parallel requests cannot clobber the file.
  const locked = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  };

  return {
    get: async <T>(key: string) => ((await load())[key] as T) ?? null,
    set: (key, value) =>
      locked(async () => {
        (await load())[key] = value;
        await save();
      }),
    push: (listKey, value) =>
      locked(async () => {
        const data = await load();
        const list = ((data[listKey] as string[]) ?? []).filter((v) => v !== value);
        data[listKey] = [value, ...list];
        await save();
      }),
    list: async (listKey) => ((await load())[listKey] as string[]) ?? [],
    remove: (listKey, value) =>
      locked(async () => {
        const data = await load();
        data[listKey] = ((data[listKey] as string[]) ?? []).filter((v) => v !== value);
        await save();
      }),
    incr: (key) =>
      locked(async () => {
        const data = await load();
        const day = new Date().toISOString().slice(0, 10);
        const full = `${key}:${day}`;
        data[full] = ((data[full] as number) ?? 0) + 1;
        await save();
        return data[full] as number;
      }),
  };
}

let backend: Backend | null = null;
function db(): Backend {
  if (backend) return backend;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  backend = url && token ? redisBackend(url, token) : localBackend();
  return backend;
}

const RECORDED_LICENCES = recordedLicences as unknown as LicenceRecord[];
const RECORDED_SITTINGS = recordedSittings as unknown as Sitting[];

export async function getSitting(id: string): Promise<Sitting | null> {
  return (await db().get<Sitting>(`sitting:${id}`)) ?? RECORDED_SITTINGS.find((s) => s.id === id) ?? null;
}

export async function saveSitting(sitting: Sitting): Promise<void> {
  await db().set(`sitting:${sitting.id}`, sitting);
}

export async function getLicence(id: string): Promise<LicenceRecord | null> {
  return (await db().get<LicenceRecord>(`licence:${id}`)) ?? RECORDED_LICENCES.find((l) => l.licence.body.id === id) ?? null;
}

export async function saveLicence(record: LicenceRecord): Promise<void> {
  await db().set(`licence:${record.licence.body.id}`, record);
  await db().push("licences", record.licence.body.id);
}

export async function listLicences(): Promise<LicenceRecord[]> {
  const ids = await db().list("licences");
  const live = (await Promise.all(ids.map((id) => db().get<LicenceRecord>(`licence:${id}`)))).filter(
    (l): l is LicenceRecord => l !== null,
  );
  const liveIds = new Set(live.map((l) => l.licence.body.id));
  const recorded = RECORDED_LICENCES.filter((l) => !liveIds.has(l.licence.body.id));
  return [...live, ...recorded].sort((a, b) => b.licence.body.issuedAt.localeCompare(a.licence.body.issuedAt));
}

// The Reppo queue. Reppo allows one pending evaluation per account.
export const queueReppo = (licenceId: string) => db().push("reppo:queue", licenceId);
export const reppoQueue = () => db().list("reppo:queue");
export const dequeueReppo = (licenceId: string) => db().remove("reppo:queue", licenceId);
export const getReppoPending = () => db().get<{ licenceId: string; evalId: string; submittedAt: string }>("reppo:pending");
export const setReppoPending = (value: { licenceId: string; evalId: string; submittedAt: string } | null) =>
  db().set("reppo:pending", value);

// Counts live sittings per visitor per day, to protect the shared credits.
export const countSitting = (visitor: string) => db().incr(`quota:${visitor}`, 86_400);
export const countVerification = () => db().incr("verifications", 86_400 * 365);
