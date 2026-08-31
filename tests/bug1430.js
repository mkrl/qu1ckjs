import { assert } from "./assert.js";

const arr = [{ x: 0 }, { x: 1 }];

delete arr[2];

assert(arr.length, 2);
assert(2 in arr, false);
assert(arr[2], undefined);

arr.push({ y: 2 });

assert(arr.length, 3);
assert(2 in arr, false);
assert(3 in arr, true);
assert(arr[2], undefined);
assert(arr[3].y, 2);
