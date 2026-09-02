import { Terminal } from "https://unpkg.com/@xterm/xterm@6.0.0/lib/xterm.mjs";
import { FitAddon } from "https://unpkg.com/@xterm/addon-fit@0.11.0/lib/addon-fit.mjs";

const terminalHost = document.querySelector("#terminal");
const clearButton = document.querySelector("#clear");
const resetButton = document.querySelector("#reset");
const themeToggle = document.querySelector("#theme-toggle");
const runtimeState = document.querySelector(".runtime-state");
const runtimeLabel = document.querySelector("#runtime-label");
const mobileCursorControls = document.querySelector(".mobile-cursor-controls");

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function terminalTheme() {
  return {
    background: cssVar("--term-bg"),
    foreground: cssVar("--term-fg"),
    cursor: cssVar("--term-cursor"),
    cursorAccent: cssVar("--term-bg"),
    selectionBackground: cssVar("--term-selection"),
    black: cssVar("--term-black"),
    red: cssVar("--red"),
    green: cssVar("--green"),
    yellow: cssVar("--term-yellow"),
    blue: cssVar("--term-blue"),
    magenta: cssVar("--term-magenta"),
    cyan: cssVar("--term-cyan"),
    white: cssVar("--term-white"),
  };
}

const worker = new Worker("./repl-worker.js", { type: "module" });
const fitAddon = new FitAddon();
const terminal = new Terminal({
  allowProposedApi: false,
  convertEol: true,
  cursorBlink: true,
  cursorStyle: "bar",
  fontFamily: '"Berkeley Mono", "Iosevka", "SFMono-Regular", ui-monospace, monospace',
  fontSize: 14,
  lineHeight: 1.45,
  screenReaderMode: true,
  scrollback: 5000,
  theme: terminalTheme(),
});
const history = [];
const startupExamples = [
  'const a = ["first", "second", "third"]',
  "a[1]",
  "a[0]",
  "a.length",
];
let historyIndex = 0;
let historyDraft = "";
let startupExampleIndex = 0;
let input = "";
let renderedRows = 1;
let renderedCursorRow = 0;
let cursorIndex = 0;
let pending = false;
let suppressEnter = false;

terminal.loadAddon(fitAddon);
terminal.open(terminalHost);
fitAddon.fit();

function terminalText(text) {
  return String(text).replaceAll("\n", "\r\n");
}

function writeLine(text, color = "") {
  terminal.write(`${color}${terminalText(text)}\x1b[0m\r\n`);
}

function inputPosition(characters, endIndex) {
  const columns = Math.max(1, terminal.cols);
  let row = 0;
  let column = 2;

  for (const character of characters.slice(0, endIndex)) {
    if (character === "\n") {
      row++;
      column = 4;
    } else {
      column++;
      if (column >= columns) {
        row++;
        column = 0;
      }
    }
  }

  return { row, column };
}

function renderInput() {
  const characters = Array.from(input);
  const lines = input.split("\n");
  const cursor = inputPosition(characters, cursorIndex);
  const end = inputPosition(characters, characters.length);
  let update = "\x1b[?25l";

  if (renderedRows > 0) {
    const rowsBelowCursor = renderedRows - renderedCursorRow - 1;
    if (rowsBelowCursor > 0)
      update += `\x1b[${rowsBelowCursor}B`;
    update += "\r\x1b[2K";
    for (let row = 1; row < renderedRows; row++)
      update += "\x1b[1A\r\x1b[2K";
  }

  update += `\x1b[31m>\x1b[0m ${lines[0]}`;
  for (const line of lines.slice(1))
    update += `\r\n\x1b[90m...\x1b[0m ${line}`;

  const rowsAboveEnd = end.row - cursor.row;
  if (rowsAboveEnd > 0)
    update += `\x1b[${rowsAboveEnd}A`;
  update += "\r";
  if (cursor.column > 0)
    update += `\x1b[${cursor.column}C`;
  update += "\x1b[?25h";

  renderedRows = end.row + 1;
  renderedCursorRow = cursor.row;
  terminal.write(update);
}

function showPrompt() {
  input = "";
  renderedRows = 1;
  renderedCursorRow = 0;
  cursorIndex = 0;
  renderInput();
  terminal.focus();
}

function setReady(ready, label = ready ? "Runtime ready" : "Runtime busy", prompt = true) {
  pending = !ready;
  runtimeState.dataset.state = ready ? "ready" : "loading";
  runtimeLabel.textContent = label;
  resetButton.disabled = !ready;
  if (ready && prompt)
    showPrompt();
}

function submitInput() {
  const code = input;
  terminal.write("\r\n");
  renderedRows = 0;
  renderedCursorRow = 0;
  if (!code.trim()) {
    showPrompt();
    return;
  }

  history.push(code);
  historyIndex = history.length;
  historyDraft = "";
  setReady(false, "Runtime busy", false);
  worker.postMessage({ type: "eval", source: code });
}

function runNextStartupExample() {
  if (startupExampleIndex >= startupExamples.length)
    return;
  input = startupExamples[startupExampleIndex++];
  cursorIndex = Array.from(input).length;
  renderInput();
  submitInput();
}

function moveHistory(delta) {
  if (historyIndex === history.length)
    historyDraft = input;
  historyIndex = Math.max(0, Math.min(history.length, historyIndex + delta));
  input = historyIndex === history.length ? historyDraft : history[historyIndex];
  cursorIndex = Array.from(input).length;
  renderInput();
}

worker.addEventListener("message", ({ data }) => {
  if (data.type === "ready") {
    writeLine("Remember: things start at 1. Have fun.", "\x1b[1;34m");
    terminal.write("\r\n");
    setReady(true);
    runNextStartupExample();
  } else if (data.type === "stdout" || data.type === "stderr") {
    writeLine(data.text, data.type === "stderr" ? "\x1b[31m" : "");
  } else if (data.type === "result") {
    writeLine(data.value, data.failed ? "\x1b[31m" : "\x1b[32m");
    setReady(true);
    runNextStartupExample();
  } else if (data.type === "reset") {
    writeLine("Runtime reset", "\x1b[90m");
    setReady(true);
  } else if (data.type === "fatal") {
    writeLine(data.message, "\x1b[31m");
    setReady(false, "Runtime unavailable", false);
    runtimeState.dataset.state = "error";
  }
});

function handleTerminalInput(data) {
  if (pending)
    return;

  if (data === "\r") {
    if (suppressEnter)
      suppressEnter = false;
    else
      submitInput();
  } else if (data === "\x7f") {
    if (cursorIndex > 0) {
      const characters = Array.from(input);
      characters.splice(cursorIndex - 1, 1);
      cursorIndex--;
      input = characters.join("");
      renderInput();
    }
  } else if (data === "\x1b[3~") {
    const characters = Array.from(input);
    if (cursorIndex < characters.length) {
      characters.splice(cursorIndex, 1);
      input = characters.join("");
      renderInput();
    }
  } else if (data === "\x1b[D" || data === "\x1bOD") {
    if (cursorIndex > 0) {
      cursorIndex--;
      renderInput();
    }
  } else if (data === "\x1b[C" || data === "\x1bOC") {
    if (cursorIndex < Array.from(input).length) {
      cursorIndex++;
      renderInput();
    }
  } else if (data === "\x1b[H" || data === "\x1bOH") {
    cursorIndex = 0;
    renderInput();
  } else if (data === "\x1b[F" || data === "\x1bOF") {
    cursorIndex = Array.from(input).length;
    renderInput();
  } else if (data === "\x1b[A" || data === "\x1bOA") {
    moveHistory(-1);
  } else if (data === "\x1b[B" || data === "\x1bOB") {
    moveHistory(1);
  } else if (data === "\x03") {
    input = "";
    cursorIndex = 0;
    terminal.write("^C\r\n");
    showPrompt();
  } else if (data === "\x0c") {
    terminal.clear();
    renderInput();
  } else if (!data.startsWith("\x1b")) {
    const characters = Array.from(input);
    const inserted = Array.from(data);
    characters.splice(cursorIndex, 0, ...inserted);
    cursorIndex += inserted.length;
    input = characters.join("");
    renderInput();
  }
}

terminal.onData(handleTerminalInput);

const terminalKeyInputs = {
  left: "\x1b[D",
  up: "\x1b[A",
  down: "\x1b[B",
  right: "\x1b[C",
};

for (const button of mobileCursorControls.querySelectorAll("button")) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handleTerminalInput(terminalKeyInputs[button.dataset.terminalKey]);
    terminal.focus();
  });
  button.addEventListener("click", (event) => {
    if (event.detail === 0) {
      handleTerminalInput(terminalKeyInputs[button.dataset.terminalKey]);
      terminal.focus();
    }
  });
}

terminal.attachCustomKeyEventHandler((event) => {
  if (event.type === "keydown" && event.key === "Enter" && event.shiftKey) {
    if (!pending) {
      suppressEnter = true;
      const characters = Array.from(input);
      characters.splice(cursorIndex, 0, "\n");
      cursorIndex++;
      input = characters.join("");
      renderInput();
    }
    return false;
  }
  if (event.type === "keyup" && event.key === "Enter")
    suppressEnter = false;
  return true;
});

new ResizeObserver(() => fitAddon.fit()).observe(terminalHost);

clearButton.addEventListener("click", () => {
  terminal.clear();
  if (!pending)
    renderInput();
});
resetButton.addEventListener("click", () => {
  terminal.write("\r\n");
  renderedRows = 0;
  setReady(false, "Resetting runtime", false);
  worker.postMessage({ type: "reset" });
});

function applyTheme(theme, save) {
  document.documentElement.dataset.theme = theme;
  if (save) {
    localStorage.setItem("qjs-theme", theme);
    document.documentElement.dataset.themeSaved = "yes";
  }
  terminal.options.theme = terminalTheme();
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", cssVar("--paper"));
}

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next, true);
});

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (document.documentElement.dataset.themeSaved !== "yes")
    applyTheme(event.matches ? "dark" : "light", false);
});