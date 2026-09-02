# ⚡️ Qu1ckJS - A mighty JavaScript engine

## Overview

QuickJS is a small and embeddable JavaScript engine. It aims to support the latest
[ECMAScript] specification.

This project is a _fork_ of the [original QuickJS project] by Fabrice Bellard and Charlie Gordon, after it went dormant, with the intent of reigniting its development.

## Getting started

Head over to the [project website] for instructions on how to get started and more
documentation.

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
[original Qu1ckJS project]: https://bellard.org/quickjs
[@bnoordhuis]: https://github.com/bnoordhuis
[@saghul]: https://github.com/saghul
[contributors]: https://github.com/quickjs-ng/quickjs/graphs/contributors
[project website]: https://quickjs-ng.github.io/quickjs/
[Emscripten SDK]: https://emscripten.org/docs/getting_started/downloads.html
