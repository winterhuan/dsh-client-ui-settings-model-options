/** Settings and catalog operations bound to the plugin's declared Remote namespaces. */
import type { Context } from '@deepseek-ai/cordis';
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client';
import type { HostObservable } from '@deepseek-ai/dsh-client-ui-slots';
import type { ModelCatalogModel, SettingsPathOpView } from '@deepseek-ai/dsh-api-remotes/client';
import type { ReadPath } from './options.ts';
/** The form can retain a refused draft and distinguish a revision conflict. */
export type SaveOutcome = {
    ok: true;
} | {
    ok: false;
    conflict: boolean;
    message: string;
};
/** Plain operations and observable values injected into each provider card. */
export interface ProviderOptionsFace {
    hooks: {
        settings: HostObservable<ConfigFormSnapshot<unknown>>;
    };
    read: ReadPath;
    save: (ops: SettingsPathOpView[], revision: number) => Promise<SaveOutcome>;
    loadModels: (provider: string) => Promise<{
        ok: true;
        models: readonly ModelCatalogModel[];
    } | {
        ok: false;
        message: string;
    }>;
}
/**
 * Bind a provider-family form to the shared settings mirror and native catalog.
 * @param ctx - plugin context with settings and session remotes injected.
 * @param ns - owning settings namespace.
 * @param report - report a settled write from the application-wide toast host.
 * @returns actions that preserve drafts on refusal and fold accepted writes into every settings surface.
 */
export declare function providerOptionsFace(ctx: Context, ns: string, report: (outcome: SaveOutcome) => void): ProviderOptionsFace;
//# sourceMappingURL=operations.d.ts.map