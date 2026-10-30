import { openDB } from 'idb';

// All progress lives here. Content never does, so content updates never wipe progress.
// Every store the Phase 1 app needs is created up front so later steps don't need a version bump.
const DB_NAME = 'cc-progress';
const DB_VERSION = 1;

export const STORES = [
  'settings',     // key -> value
  'meta',         // key -> value (first launch, last export, install guide seen, ...)
  'cards',        // card id -> FSRS state
  'reviewLog',    // auto id -> one flashcard review
  'goals',        // goal id -> goal progress
  'attempts',     // auto id -> one quiz answer (graded, practice, pretest, retention)
  'sessions',     // session id -> resumable in-flight session
  'defineList',   // term -> queued define request
  'glossaryTaps', // auto id -> one glossary tap
  'overrides'     // auto id -> "I was right" override
];

const AUTO = new Set(['reviewLog', 'attempts', 'glossaryTaps', 'overrides']);

let dbPromise;
export function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        for (const name of STORES) {
          if (!d.objectStoreNames.contains(name)) {
            d.createObjectStore(name, AUTO.has(name) ? { autoIncrement: true } : undefined);
          }
        }
      }
    });
  }
  return dbPromise;
}

export async function get(store, key) {
  return (await db()).get(store, key);
}
export async function put(store, value, key) {
  return (await db()).put(store, value, key);
}
export async function add(store, value) {
  return (await db()).add(store, value);
}
export async function del(store, key) {
  return (await db()).delete(store, key);
}
export async function all(store) {
  return (await db()).getAll(store);
}

// Asks the browser not to evict our data. Called on every launch; the browser only prompts/decides once.
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) return 'unsupported';
  if (await navigator.storage.persisted()) return 'persisted';
  return (await navigator.storage.persist()) ? 'persisted' : 'not-persisted';
}
