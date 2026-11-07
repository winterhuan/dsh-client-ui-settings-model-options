/** Add model capability and provider retry controls to the built-in Models page. */
import type { Context } from '@deepseek-ai/cordis';
import type { ModelOptionsKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Model capability and request retry settings copy. */
        'settings.modelOptions': ModelOptionsKey;
    }
}
/** Namespace of this plugin's dictionaries. */
export declare const NS = "settings.modelOptions";
/** Host services used by the provider cards and shared save notifications. */
export declare const inject: string[];
/**
 * Register provider-card extensions and a save-outcome overlay through disposable slot effects.
 * @param ctx - browser plugin context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map