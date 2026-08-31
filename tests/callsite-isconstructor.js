import { assert } from "./assert.js";

/* CallSite.prototype.isConstructor reports whether the frame was invoked as a
   constructor (via `new`). */

let frames;
Error.prepareStackTrace = (_, f) => { frames = f; return f; };

function Thing() { void new Error(""); }
new Thing();

function plain() { void new Error(""); }
plain();

Error.prepareStackTrace = undefined;

// after plain(): frame 1 is plain (not a constructor)
assert(frames[1].getFunctionName(), "plain");
assert(!frames[1].isConstructor());

// re-run for the constructor case
Error.prepareStackTrace = (_, f) => { frames = f; return f; };
new Thing();
Error.prepareStackTrace = undefined;

// frame 1 is Thing, invoked via `new`
assert(frames[1].getFunctionName(), "Thing");
assert(frames[1].isConstructor());
// its caller (module top level) is not a constructor
assert(!frames[2].isConstructor());
