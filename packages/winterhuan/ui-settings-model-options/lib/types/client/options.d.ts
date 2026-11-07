/** Model capabilities and retry drafts translated into revision-fenced, field-only settings edits. */
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client';
import type { ModelCatalogModel, SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client';
import type { PiAiModelProfile } from '@deepseek-ai/dsh-llm-pi-ai';
/** A level supported by the pinned pi-ai adapter. */
export type ThinkingLevel = keyof Exclude<PiAiModelProfile['reasoningEfforts'], false | undefined>;
/** Canonical order of the adapter's selectable thinking levels. */
export declare const THINKING_LEVELS: ThinkingLevel[];
/**
 * What the batch control stages when thinking is enabled: the common
 * OpenAI-compatible levels with their own names as request values, and Off
 * sending nothing — the same initial shape the official model list offers.
 */
export declare const STANDARD_REASONING: ReasoningDraft;
/** A model's capability declaration; an empty off value means omit the request parameter. */
export interface ReasoningDraft {
    mode: 'inherit' | 'disabled' | 'custom';
    efforts: Partial<Record<ThinkingLevel, string>>;
}
/** A model's image input declaration; inheritance removes the field so the adapter default applies. */
export interface ImageDraft {
    mode: 'inherit' | 'text' | 'textAndImage';
}
/** Adapter-owned settings key carrying a model's input modalities. */
export type ImageField = 'input' | 'inputModalities';
/** Restore the inherited retry limit or set a finite number of additional attempts. */
export type RetryDraft = {
    mode: 'inherit';
} | {
    mode: 'normal';
    count: string;
};
/** Edits retain the exact snapshot from which the first field was changed. */
export interface OptionsDraft {
    snapshot: ConfigFormSnapshot<unknown>;
    reasoning: ReadonlyMap<string, ReasoningDraft>;
    image: ReadonlyMap<string, ImageDraft>;
    retry?: RetryDraft;
    retryInvalidRequests?: boolean;
    retryAuthErrors?: boolean;
    retryQuotaErrors?: boolean;
    retryUnclassifiedErrors?: boolean;
}
/** One configured or catalog model, with its adapter-owned settings address. */
export interface ModelOption {
    id: string;
    name: string;
    path: string[];
    reasoning: unknown;
    /** Stored input-modality declaration, or undefined when the adapter supplies it. */
    image: unknown;
    /** Adapter-owned settings key that carries the input modalities. */
    imageField: ImageField;
}
/** Bound settings service reader, also usable by pure draft operations. */
export type ReadPath = (value: unknown, path: readonly string[]) => unknown;
/**
 * Read the provider's configured retry classes, or the pinned runtime defaults.
 * @param value - resolved settings namespace.
 * @param providerPath - provider's address within the namespace.
 * @param read - settings-owned reader.
 * @returns normal-mode retry classes; always mode ignores this list.
 */
export declare function retryableCodes(value: unknown, providerPath: readonly string[], read: ReadPath): readonly string[];
/**
 * Join stored models with catalog labels without materializing a replacement catalog.
 * @param profile - resolved provider settings.
 * @param catalog - current models reported by the Host.
 * @param read - settings-owned path reader.
 * @param imageField - adapter-owned key that carries each model's input modalities.
 * @returns declared models, or catalog models and retained overrides when no list is configured.
 */
export declare function modelOptions(profile: unknown, catalog: readonly ModelCatalogModel[], read: ReadPath, imageField?: ImageField): ModelOption[];
/**
 * Decode persisted capability metadata into editable values.
 * @param value - a model's reasoningEfforts setting.
 * @returns inherited, disabled, or explicitly declared levels.
 */
export declare function reasoningDraft(value: unknown): ReasoningDraft;
/**
 * Decode a persisted input-modality declaration into an editable capability.
 * @param value - a model's adapter-owned input list.
 * @returns inherited when absent or empty, otherwise text-only or multimodal.
 */
export declare function imageDraft(value: unknown): ImageDraft;
/**
 * Validate the draft before the Host performs protocol-specific validation.
 * @param draft - pending edits.
 * @returns the locale key of the first invalid field, or undefined.
 */
export declare function draftError(draft: OptionsDraft): 'invalidRetries' | 'missingLevel' | 'missingWire' | undefined;
/**
 * Check one capability declaration before editing or copying it.
 * @param reasoning - the source model's staged or stored capability.
 * @returns a field validation key, or undefined when the declaration can be saved.
 */
export declare function reasoningError(reasoning: ReasoningDraft): 'missingLevel' | 'missingWire' | undefined;
/**
 * Build atomic edits against the draft's original model addresses.
 * @param draft - validated edits and their starting snapshot.
 * @param providerPath - provider's address within its settings namespace.
 * @param models - model addresses read from that snapshot.
 * @param read - settings-owned reader for inherited retry settings.
 * @returns field operations preserving other model fields, credentials, backoff, used image budgets, and unselected retry classes.
 * @throws when a draft is invalid or a selected model is absent.
 */
export declare function optionOperations(draft: OptionsDraft, providerPath: readonly string[], models: readonly ModelOption[], read: ReadPath): SettingsPathOpView[];
//# sourceMappingURL=options.d.ts.map