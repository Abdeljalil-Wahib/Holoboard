
export const TOOLS = {
    SELECT: 'select',
    PEN: `pen`,
    ERASER: `eraser`,
} as const;

export type Tool = typeof TOOLS[keyof typeof TOOLS];