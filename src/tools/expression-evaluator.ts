/**
 * Utility to evaluate dynamic expressions in node parameters.
 * Supports syntax like {{ $input.all() }} or {{ $input.first().id }}.
 */

export const evaluateExpression = (expression: string, context: { input: any; nodes?: Record<string, any> }): any => {
    if (!expression || typeof expression !== "string") return expression;

    // Regular expression to find all {{ ... }} blocks
    const regex = /{{\s*(.*?)\s*}}/g;

    // If the whole string is exactly one expression block, we might return a non-string value
    const matches = expression.match(regex);
    if (matches && matches.length === 1 && matches[0] === expression) {
        const inner = expression.replace(regex, "$1");
        return executeJs(inner, context);
    }

    // Otherwise, interpolate expressions into the string
    return expression.replace(regex, (_, inner) => {
        const val = executeJs(inner, context);
        return val === undefined || val === null ? "" : String(val);
    });
};

const executeJs = (code: string, context: { input: any; nodes?: Record<string, any> }): any => {
    try {
        const $input = {
            all: () => context.input,
            first: () => (Array.isArray(context.input) ? context.input[0] : context.input),
            last: () => (Array.isArray(context.input) ? context.input[context.input.length - 1] : context.input),
        };

        const $nodes = context.nodes || {};

        const $node = (id: string) => {
            const node = $nodes[id];
            if (!node) {
                console.warn(`Node with ID "${id}" not found.`);
                return {};
            }
            return node;
        };

        const fn = new Function("$input", "$nodes", "$node", `
            try {
                return ${code};
            } catch (e) {
                throw e;
            }
        `);

        return fn($input, $nodes, $node);
    } catch (error) {
        console.error("Expression evaluation error:", error, "Code:", code);
        return `[Error: ${error instanceof Error ? error.message : String(error)}]`;
    }
};
