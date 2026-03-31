import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { useTheme } from 'next-themes';

interface ExpressionEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const ExpressionEditor: React.FC<ExpressionEditorProps> = ({
    value,
    onChange,
    placeholder,
    className
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Custom autocomplete logic
    const expressionCompletions = useMemo(() => {
        return autocompletion({
            override: [
                (context: CompletionContext) => {
                    const word = context.matchBefore(/\$?[a-zA-Z]*/);
                    if (!word) return null;
                    if (word.from === word.to && !context.explicit) return null;

                    const options = [
                        { label: '$input', type: 'variable', detail: 'Workflow input data' },
                        { label: '$nodes', type: 'variable', detail: 'Access data from other nodes by ID' },
                        { label: '$node', type: 'function', detail: 'Helper to access node data: $node("id")' },
                        { label: 'all()', type: 'method', detail: 'Return all input data' },
                        { label: 'first()', type: 'method', detail: 'Return first item' },
                        { label: 'last()', type: 'method', detail: 'Return last item' },
                    ];

                    return {
                        from: word.from,
                        options: options.map(opt => ({
                            ...opt,
                            apply: opt.label.endsWith('()') ? opt.label : opt.label
                        }))
                    };
                }
            ]
        });
    }, []);

    return (
        <div className={`flex w-full rounded-md border border-input bg-background shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
            <CodeMirror
                value={value}
                width="100%"
                theme={isDark ? oneDark : 'light'}
                placeholder={placeholder}
                extensions={[
                    javascript(),
                    expressionCompletions,
                    EditorView.lineWrapping,
                    EditorView.theme({
                        "&": {
                            fontSize: "12px",
                            backgroundColor: "transparent",
                            color: "var(--foreground)",
                            border: "none",
                            minHeight: "28px",
                        },
                        "&.cm-focused": {
                            outline: "none",
                        },
                        ".cm-content": {
                            fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
                            padding: "4px 8px"
                        },
                        ".cm-gutters": { display: "none" }, // Hide line numbers
                        ".cm-activeLine": { backgroundColor: "transparent" },
                        ".cm-activeLineGutter": { backgroundColor: "transparent" },
                        ".cm-placeholder": {
                            fontSize: "11px",
                            opacity: "0.5",
                        },
                        ".cm-tooltip-autocomplete": {
                            zIndex: "1000 !important",
                        },
                    }),
                    EditorView.domEventHandlers({
                        drop(event, view) {
                            const payload = event.dataTransfer?.getData("application/variable");
                            if (payload) {
                                event.preventDefault();
                                // Insert at cursor position
                                const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
                                if (pos !== null) {
                                    view.dispatch({
                                        changes: { from: pos, insert: payload },
                                        selection: { anchor: pos + payload.length }
                                    });
                                } else {
                                    // Fallback to appending if position can't be determined
                                    const length = view.state.doc.length;
                                    view.dispatch({
                                        changes: { from: length, insert: payload },
                                        selection: { anchor: length + payload.length }
                                    });
                                }
                                return true;
                            }
                            return false;
                        },
                        dragover(event) {
                            if (event.dataTransfer?.types.includes("application/variable")) {
                                event.preventDefault();
                                return true;
                            }
                            return false;
                        }
                    })
                ]}
                onChange={onChange}
                basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                    highlightActiveLine: false,
                }}
            />
        </div>
    );
};
