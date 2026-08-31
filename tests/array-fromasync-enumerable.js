import { assert, assertArrayEquals } from "./assert.js";

/* Array.fromAsync must create its elements with CreateDataPropertyOrThrow,
   i.e. enumerable own data properties, so they show up in Object.keys and
   spreads. */

/* array-like source */
{
    const arr = await Array.fromAsync([10, 20, 30]);
    assertArrayEquals(Object.keys(arr), ["1", "2", "3"]);
    const d = Object.getOwnPropertyDescriptor(arr, 1);
    assert(d.enumerable, true);
    assert(d.writable, true);
    assert(d.configurable, true);
}

/* async-iterable source */
{
    const iter = { async *[Symbol.asyncIterator]() { yield "a"; yield "b"; } };
    const arr = await Array.fromAsync(iter);
    assertArrayEquals(Object.keys(arr), ["1", "2"]);
    assert(Object.getOwnPropertyDescriptor(arr, 1).enumerable, true);
}
