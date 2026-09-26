# LRU Cache

A Least Recently Used (LRU) cache implemented in JavaScript, backed by a single `Map`.

## 1. Data structure used, and why

The entire cache is a single [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) (`this.map`), storing `key -> value` pairs.

A textbook LRU cache is usually built from **two** structures: a hash map (for O(1) lookup) plus a doubly-linked list (for O(1) reordering of recency). In JavaScript, a single `Map` gives us both properties at once, because:

- It's hash-table backed, so `get`/`set`/`has`/`delete` are all O(1) average time.
- It **preserves insertion order** during iteration — and critically, if you `delete` a key and then `set` it again, it moves to the _end_ of that iteration order.

That second property is what lets `Map` stand in for the linked list: "end of iteration order" becomes our definition of "most recently used," and "start of iteration order" becomes "least recently used." No separate list, no manual pointer management.

## 2. How LRU ordering is maintained

The map's iteration order is treated as a recency timeline, oldest to newest:

```
[ least recently used ... most recently used ]
   ^ front of the map                 end ^
```

Two rules keep that timeline accurate:

- **On `get(key)`:** if the key exists, its entry is deleted and immediately re-inserted with the same value. This pushes it to the end (most recently used) without changing anything else's order.
- **On `put(key, value)`:** the same delete-then-insert happens (this matters whether `key` is new or already present — an update to an existing key still counts as "using" it). After inserting, if the map's size exceeds `capacity`, the entry at the _front_ of the map (`map.keys().next().value`) is the least recently used one, and it's deleted.

Because every access (read or write) re-inserts the key at the end, whatever is left at the front is, by construction, whatever hasn't been touched in the longest time.

## 3. Time complexity

Both `get()` and `put()` run in **O(1) average time**.

- `Map.prototype.has`, `.get`, `.set`, and `.delete` are all O(1) average time (hash table operations), not O(n).
- `get(key)` does at most one `has` + one `get` + one `delete` + one `set` — a constant number of O(1) operations.
- `put(key, value)` does at most one `has` + one `delete` + one `set`, plus, on eviction, one call to `.keys().next().value` (reading the first key from the iterator) and one `delete`. Reading the first entry of a `Map`'s iterator is O(1) — it doesn't scan the whole map, it just returns the head of the internal insertion-ordered list.

So every operation is a fixed, small number of O(1) map operations — none of them loop over the cache's contents.

_(Caveat: this is the same "average case" guarantee that applies to any hash table — JS engines don't guarantee worst-case O(1) for hash map operations, but this is the standard assumption used when discussing `Map`/`Object` complexity.)_

## 4. Space complexity

**O(capacity)** — the cache holds at most `capacity` key/value pairs at any time (`put` evicts immediately whenever size exceeds capacity), so memory grows linearly with capacity and is independent of how many total operations have been performed.

## 5. Running the code and tests

Requirements: [Node.js](https://nodejs.org/) (no external dependencies).

```bash
# Run the test suite
node cache.test.js
```

The test file (`cache.test.js`) exercises:

- A full get/put/eviction walkthrough
- `get()` on a missing key
- Updating an existing key's value (and confirming recency is refreshed)
- A capacity-1 cache
- `get()` protecting a key from eviction
- Invalid capacity values (`0`, negative, non-integer) being rejected

It prints `PASS`/`FAIL` per assertion and a final `N passed, N failed` summary, exiting with a non-zero code if anything fails.

To use the cache in your own code:

```javascript
const Cache = require("./cache.js");

const cache = new Cache(2);
cache.put("A", 10);
cache.put("B", 20);
cache.get("A"); // 10, and marks "A" as most recently used
cache.put("C", 30); // capacity exceeded -> evicts "B" (least recently used)
cache.get("B"); // -1 (evicted)
```
