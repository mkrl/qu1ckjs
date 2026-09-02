import { assert, assertArrayEquals, assertThrows } from "./assert.js";

function testArrays() {
    const array = [10, 20, 30];

    assert(array.length, 3);
    assert(array[0], undefined);
    assert(array[1], 10);
    assert(array[3], 30);
    assertArrayEquals(Object.keys(array), ["1", "2", "3"]);
    assertArrayEquals([...array], [10, 20, 30]);
    assertArrayEquals([...array.keys()], [1, 2, 3]);
    assert(JSON.stringify([...array.entries()]), "[[1,10],[2,20],[3,30]]");

    array[0] = "metadata";
    assert(array[0], "metadata");
    assert(array.length, 3);
    assertArrayEquals([...array], [10, 20, 30]);

    const callbackIndices = [];
    assertArrayEquals(array.map((value, index) => {
        callbackIndices.push(index);
        return value + index;
    }), [11, 22, 33]);
    assertArrayEquals(callbackIndices, [1, 2, 3]);
    assert(array.indexOf(20), 2);
    assert(array.lastIndexOf(20), 2);
    assert(array.at(1), 10);
    assert(array.at(-1), 30);
    assertArrayEquals(array.slice(2, 4), [20, 30]);

    const sparse = [];
    sparse[3] = 42;
    assert(sparse.length, 3);
    assert(sparse[3], 42);
    sparse[0] = "metadata";
    sparse.length = 1;
    assert(sparse[0], "metadata");
    assert(sparse[3], undefined);
}

function testArguments() {
    function collect(first, second) {
        assert(arguments[0], undefined);
        assert(arguments[1], first);
        assert(arguments[2], second);
        return [...arguments];
    }

    assertArrayEquals(collect("a", "b"), ["a", "b"]);
}

function testStringsAndRegExp() {
    assert("abc"[0], undefined);
    assert("abc"[1], "a");
    assert("abc"[3], "c");
    assert("abc".at(1), "a");
    assert("abc".indexOf("b"), 2);
    assert("abc".slice(2, 4), "bc");
    assertArrayEquals(Object.keys(Object("abc")), ["1", "2", "3"]);

    const match = /b(.)/d.exec("abcd");
    assert(match[0], undefined);
    assert(match[1], "bc");
    assert(match[2], "c");
    assert(match.index, 2);
    assert(JSON.stringify(match.indices), "[[2,4],[3,4]]");
}

function testTypedArraysAndAtomics() {
    const typed = Uint8Array.of(7, 8);

    assert(typed.length, 2);
    assert(typed[0], undefined);
    assert(typed[1], 7);
    assert(typed[2], 8);
    assertArrayEquals([...typed.keys()], [1, 2]);
    assert(typed.indexOf(8), 2);
    assert(typed.at(1), 7);
    assertThrows(RangeError, () => typed.set([9], 0));

    if (typeof Atomics !== "undefined") {
        const shared = new SharedArrayBuffer(4);
        const atomic = new Int32Array(shared);
        Atomics.store(atomic, 1, 42);
        assert(Atomics.load(atomic, 1), 42);
        assertThrows(RangeError, () => Atomics.load(atomic, 0));
    }
}

function testJson() {
    const value = JSON.parse("[1,2]");

    assert(value[0], undefined);
    assert(value[1], 1);
    assert(value[2], 2);
    assert(JSON.stringify(value), "[1,2]");
}

testArrays();
testArguments();
testStringsAndRegExp();
testTypedArraysAndAtomics();
testJson();