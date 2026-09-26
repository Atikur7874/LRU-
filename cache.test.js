const Cache = require("./cache.js");

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, label) {
  const ok = actual === expected;
  if (ok) {
    passed++;
    console.log(`  PASS  ${label} -> ${actual}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label} -> got ${actual}, expected ${expected}`);
  }
}

function assertThrows(fn, label) {
  try {
    fn();
    failed++;
    console.log(`  FAIL  ${label} -> did not throw`);
  } catch (e) {
    passed++;
    console.log(`  PASS  ${label} -> threw "${e.message}"`);
  }
}

// 1. The example from before
console.log("Test 1: original example sequence");
{
  const cache = new Cache(2);
  cache.put("A", 10);
  cache.put("B", 20);
  assertEqual(cache.get("A"), 10, 'get("A")');
  cache.put("C", 30);
  assertEqual(cache.get("B"), -1, 'get("B") after eviction');
  assertEqual(cache.get("C"), 30, 'get("C")');
  assertEqual(cache.get("A"), 10, 'get("A") still present');
}

// 2. get() on a missing key
console.log("\nTest 2: get() on missing key");
{
  const cache = new Cache(3);
  assertEqual(cache.get("nope"), -1, 'get("nope") on empty cache');
  cache.put("X", 1);
  assertEqual(cache.get("Y"), -1, 'get("Y") when only "X" exists');
}

// 3. Updating an existing key's value (and confirming it refreshes recency)
console.log("\nTest 3: update existing key refreshes recency");
{
  const cache = new Cache(2);
  cache.put("A", 1);
  cache.put("B", 2);
  // A is LRU right now. Update A's value instead of touching it via get().
  cache.put("A", 100);
  assertEqual(cache.get("A"), 100, 'get("A") after update reflects new value');
  // Now B should be LRU (A was refreshed by the put above).
  cache.put("C", 3); // should evict B, not A
  assertEqual(cache.get("B"), -1, 'get("B") evicted after update refreshed A');
  assertEqual(cache.get("A"), 100, 'get("A") survived eviction');
  assertEqual(cache.get("C"), 3, 'get("C") present');
}

// 4. A cache with capacity 1
console.log("\nTest 4: capacity 1");
{
  const cache = new Cache(1);
  cache.put("A", 1);
  assertEqual(cache.get("A"), 1, 'get("A") right after put');
  cache.put("B", 2); // should evict A immediately
  assertEqual(cache.get("A"), -1, 'get("A") evicted by "B"');
  assertEqual(cache.get("B"), 2, 'get("B") present');
}

// 5. Confirming that calling get() protects a key from eviction
console.log("\nTest 5: get() protects a key from eviction");
{
  const cache = new Cache(2);
  cache.put("A", 1);
  cache.put("B", 2);
  // Touch A via get() so B becomes LRU instead of A.
  cache.get("A");
  cache.put("C", 3); // should evict B (LRU), not A
  assertEqual(cache.get("A"), 1, 'get("A") protected by earlier get()');
  assertEqual(cache.get("B"), -1, 'get("B") evicted (was LRU)');
  assertEqual(cache.get("C"), 3, 'get("C") present');
}

// 6. Invalid capacity rejected
console.log("\nTest 6: invalid capacity rejected");
{
  assertThrows(() => new Cache(0), "capacity 0");
  assertThrows(() => new Cache(-5), "capacity -5");
  assertThrows(() => new Cache(2.5), "capacity 2.5 (non-integer)");
  assertThrows(() => new Cache("2"), 'capacity "2" (string, non-integer)');
  assertThrows(() => new Cache(null), "capacity null");
  assertThrows(() => new Cache(NaN), "capacity NaN");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
