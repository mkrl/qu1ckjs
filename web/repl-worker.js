import createQuickJS from "./1js.js";

let quickJS;

async function initialize() {
  quickJS = await createQuickJS({
    locateFile: (path) => new URL(path, import.meta.url).href,
    print: (text) => postMessage({ type: "stdout", text }),
    printErr: (text) => postMessage({ type: "stderr", text }),
  });
  const status = quickJS.ccall("qjs_browser_init", "number", [], []);
  if (status !== 0)
    throw new Error("Qu1ckJS failed to initialize");
}

async function reset() {
  if (quickJS)
    quickJS.ccall("qjs_browser_destroy", null, [], []);
  await initialize();
}

self.addEventListener("message", async ({ data }) => {
  try {
    if (data.type === "eval") {
      const value = quickJS.ccall(
        "qjs_browser_eval",
        "string",
        ["string"],
        [data.source],
      );
      const failed = Boolean(quickJS.ccall(
        "qjs_browser_last_eval_failed",
        "number",
        [],
        [],
      ));
      postMessage({ type: "result", value, failed });
    } else if (data.type === "reset") {
      await reset();
      postMessage({ type: "reset" });
    }
  } catch (error) {
    postMessage({ type: "fatal", message: error.message });
  }
});

initialize()
  .then(() => postMessage({ type: "ready" }))
  .catch((error) => postMessage({ type: "fatal", message: error.message }));