/*
 * QuickJS browser bridge
 *
 * Provides a small persistent evaluation API for Emscripten hosts.
 */
#include <stdlib.h>
#include <string.h>

#include "quickjs.h"
#include "quickjs-libc.h"

static JSRuntime *browser_rt;
static JSContext *browser_ctx;
static JSValue browser_formatter = JS_UNDEFINED;
static char *browser_result;
static int browser_eval_failed;

static const char formatter_source[] =
    "(value => {"
    "if (typeof value === 'string') return JSON.stringify(value);"
    "if (typeof value === 'bigint') return String(value) + 'n';"
    "if (value === undefined) return 'undefined';"
    "try { const json = JSON.stringify(value);"
    "if (json !== undefined) return json; } catch {}"
    "return String(value);"
    "})";

static const char *browser_set_result(const char *value)
{
    free(browser_result);
    browser_result = strdup(value ? value : "");
    return browser_result ? browser_result : "Out of memory";
}

static const char *browser_value_to_string(JSValueConst value)
{
    const char *text = JS_ToCString(browser_ctx, value);
    const char *result = browser_set_result(text ? text : "Unable to format value");

    JS_FreeCString(browser_ctx, text);
    return result;
}

static const char *browser_exception_to_string(void)
{
    JSValue exception = JS_GetException(browser_ctx);
    JSValue stack = JS_GetPropertyStr(browser_ctx, exception, "stack");
    const char *result;

    if (!JS_IsException(stack) && !JS_IsUndefined(stack))
        result = browser_value_to_string(stack);
    else
        result = browser_value_to_string(exception);

    JS_FreeValue(browser_ctx, stack);
    JS_FreeValue(browser_ctx, exception);
    return result;
}

int qjs_browser_init(void)
{
    if (browser_rt)
        return 0;

    browser_rt = JS_NewRuntime();
    if (!browser_rt)
        return -1;

    js_std_init_handlers(browser_rt);
    browser_ctx = JS_NewContext(browser_rt);
    if (!browser_ctx)
        goto fail;

    js_std_add_helpers(browser_ctx, 0, NULL);
    browser_formatter = JS_Eval(browser_ctx, formatter_source,
                                strlen(formatter_source), "<formatter>",
                                JS_EVAL_TYPE_GLOBAL);
    if (JS_IsException(browser_formatter))
        goto fail;

    return 0;

fail:
    if (browser_ctx) {
        JS_FreeContext(browser_ctx);
        browser_ctx = NULL;
    }
    js_std_free_handlers(browser_rt);
    JS_FreeRuntime(browser_rt);
    browser_rt = NULL;
    return -1;
}

const char *qjs_browser_eval(const char *source)
{
    JSValue value;
    JSValue formatted;

    browser_eval_failed = 0;
    if (!browser_rt && qjs_browser_init()) {
        browser_eval_failed = 1;
        return browser_set_result("Unable to initialize QuickJS");
    }
    if (!source)
        source = "";

    value = JS_Eval(browser_ctx, source, strlen(source), "<repl>",
                    JS_EVAL_TYPE_GLOBAL | JS_EVAL_FLAG_ASYNC);
    if (JS_IsException(value)) {
        browser_eval_failed = 1;
        return browser_exception_to_string();
    }

    value = js_std_await(browser_ctx, value);
    if (JS_IsException(value)) {
        browser_eval_failed = 1;
        return browser_exception_to_string();
    }

    formatted = JS_GetPropertyStr(browser_ctx, value, "value");
    JS_FreeValue(browser_ctx, value);
    value = formatted;
    if (JS_IsException(value)) {
        browser_eval_failed = 1;
        return browser_exception_to_string();
    }

    formatted = JS_Call(browser_ctx, browser_formatter, JS_UNDEFINED, 1,
                        (JSValueConst *)&value);
    JS_FreeValue(browser_ctx, value);
    if (JS_IsException(formatted)) {
        browser_eval_failed = 1;
        return browser_exception_to_string();
    }

    browser_value_to_string(formatted);
    JS_FreeValue(browser_ctx, formatted);
    js_std_loop(browser_ctx);
    return browser_result;
}

int qjs_browser_last_eval_failed(void)
{
    return browser_eval_failed;
}

void qjs_browser_destroy(void)
{
    free(browser_result);
    browser_result = NULL;
    browser_eval_failed = 0;

    if (!browser_rt)
        return;

    JS_FreeValue(browser_ctx, browser_formatter);
    browser_formatter = JS_UNDEFINED;
    js_std_free_handlers(browser_rt);
    JS_FreeContext(browser_ctx);
    JS_FreeRuntime(browser_rt);
    browser_ctx = NULL;
    browser_rt = NULL;
}