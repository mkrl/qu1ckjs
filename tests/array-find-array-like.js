import { assert } from "./assert.js";

const object = { 1: 42, 2: 84, length: 2 };

assert(Array.prototype.find.call(object, value => value === 42), 42);
assert(Array.prototype.findIndex.call(object, value => value === 42), 1);
assert(Array.prototype.findLast.call(object, value => value < 100), 84);
assert(Array.prototype.findLastIndex.call(object, value => value < 100), 2);

let seen;
Array.prototype.find.call({ length: 1 }, (value, index) => {
    seen = [value, index];
});
assert(seen[1], undefined);
assert(seen[2], 1);
