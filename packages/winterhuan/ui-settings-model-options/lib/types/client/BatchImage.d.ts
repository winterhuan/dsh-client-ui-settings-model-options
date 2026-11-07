/** Searchable recipients and an explicit preview of the image capability to apply. */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { ImageDraft } from './options.ts';
import type { BatchTarget } from './BatchTargets.tsx';
/**
 * Summarize an image capability declaration without inferring an endpoint's support.
 * @param image - the stored or staged model configuration.
 * @param t - model options dictionary.
 * @returns inherited, text-only, or text-and-image.
 */
export declare function imageSummary(image: ImageDraft, t: TranslateNS<'settings.modelOptions'>): string;
/** Preview and selection actions; applying changes drafts, never the Host settings. */
export interface BatchImageProps {
    image: ImageDraft;
    targets: readonly BatchTarget[];
    t: TranslateNS<'settings.modelOptions'>;
    onApply: (ids: readonly string[]) => void;
    onCancel: () => void;
}
/**
 * Select models that will receive one image capability.
 * @param props - capability preview, available targets, localized copy, and draft actions.
 * @returns an inline selection panel with no targets preselected.
 */
export declare function BatchImage({ image, targets, t, onApply, onCancel }: BatchImageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=BatchImage.d.ts.map