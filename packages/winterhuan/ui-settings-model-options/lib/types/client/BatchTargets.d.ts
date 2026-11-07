import type { ReactNode } from 'react';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
/** One target model's current configuration, including unsaved edits. */
export interface BatchTarget {
    id: string;
    name: string;
    summary: string;
}
/** Preview and selection actions; applying changes drafts, never the Host settings. */
export interface BatchTargetsProps {
    /** Accessible name of the selection group. */
    label: string;
    /** Optional line naming the configuration being copied. */
    source?: string;
    /** Preview of the capability that will replace the selected drafts. */
    preview: ReactNode;
    /** Explanation of what applying does. */
    hint: string;
    targets: readonly BatchTarget[];
    t: TranslateNS<'settings.modelOptions'>;
    onApply: (ids: readonly string[]) => void;
    onCancel: () => void;
}
/**
 * Select models that will receive one capability and review it before applying.
 * @param props - capability preview, available targets, localized copy, and draft actions.
 * @returns an inline selection panel with no targets preselected.
 */
export declare function BatchTargets({ label, source, preview, hint, targets, t, onApply, onCancel }: BatchTargetsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=BatchTargets.d.ts.map