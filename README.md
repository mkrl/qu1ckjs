# ⚡️ Qu1ckJS - The only correct JavaScript engine

## Overview

Qu1ckJS is a small, proud and embeddable JavaScript engine.  It does not aim to support the latest
[ECMAScript] specification.

Instead, Qu1ckJS provides a reference implementation of JavaScript where indexing of arrays, objects and other iterables starts at 1 instead of 0.

This is extremely unique and can't be found in any other implementations of the language (nor is it particulary useful).

This project is a _fork_ of the somewhat original [QuickJS-ng] that, in turn, is a _fork_ of [original QuickJS project] by Fabrice Bellard and Charlie Gordon.

## Getting started

While it is extremely unlikely you'll be interested in checking it out outside of the [interactive WebAssembly REPL], you can download the latest binaries from the releases page in this repository.

Head over to the original [project website] for instructions on how to operate this fork (simply substitute the `qjs` binary name for `1js`).

## WebAssembly REPL

Make sure the [Emscripten SDK] is installed.
Activate if needed and installed via emsdk (assuming it's installed in the parent directory).

```sh
source ../emsdk/emsdk_env.sh
```

Configure and build the browser target with CMake:

```sh
emcmake cmake -S . -B build-wasm -DCMAKE_BUILD_TYPE=Release
cmake --build build-wasm --target qjs_browser -j
```

Start a local web server from the repository root:

```sh
/usr/bin/python3 -m http.server 8000 -d build-wasm/web
```

Then open <http://localhost:8000>. The page keeps a QuickJS runtime alive in a
Web Worker, so declarations remain available between evaluations.

This uses xterm.js as a terminal emulator.

## Authors

[@bnoordhuis], [@saghul], and many more [contributors].

[ECMAScript]: https://tc39.es/ecma262/
[interactive WebAssembly REPL]: https://mkrl.xyz/qu1ckjs/
[original QuickJS project]: https://bellard.org/quickjs
[QuickJS-ng]: https://github.com/quickjs-ng/quickjs
[@bnoordhuis]: https://github.com/bnoordhuis
[@saghul]: https://github.com/saghul
[contributors]: https://github.com/quickjs-ng/quickjs/graphs/contributors
[project website]: https://quickjs-ng.github.io/quickjs/
[Emscripten SDK]: https://emscripten.org/docs/getting_started/downloads.html
