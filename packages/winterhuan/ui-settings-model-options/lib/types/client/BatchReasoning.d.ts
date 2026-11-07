/** Searchable recipients and an explicit preview of the thinking capability to apply. */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { ReasoningDraft } from './options.ts';
import type { BatchTarget } from './BatchTargets.tsx';
/**
 * Summarize a configured capability without inferring an endpoint's support.
 * @param reasoning - the stored or staged model configuration.
 * @param t - model options dictionary.
 * @returns inheritance, non-thinking, or the explicitly selected level names.
 */
export declare function reasoningSummary(reasoning: ReasoningDraft, t: TranslateNS<'settings.modelOptions'>): string;
/** Preview and selection actions; applying changes drafts, never the Host settings. */
export interface BatchReasoningProps {
    reasoning: ReasoningDraft;
    targets: readonly BatchTarget[];
    t: TranslateNS<'settings.modelOptions'>;
    onApply: (ids: readonly string[]) => void;
    onCancel: () => void;
}
/**
 * Select models that will receive one thinking capability.
 * @param props - capability preview, available targets, localized copy, and draft actions.
 * @returns an inline selection panel with no targets preselected.
 */
export declare function BatchReasoning({ reasoning, targets, t, onApply, onCancel }: BatchReasoningProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=BatchReasoning.d.ts.map