import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ProviderOptionsFace } from './operations.ts';
/** Provider identity, translated copy, settings snapshot, and Host actions supplied by the slot. */
export type ProviderOptionsProps = PropsRuntime<'settings.models.provider-card'> & PropsLocale<'settings.modelOptions'> & InjectFace<ProviderOptionsFace>;
/**
 * Render the saved provider's optional controls without adding another settings page.
 * @param props - provider-card owner and injected settings actions.
 * @returns a disclosure, or nothing for an unsaved provider.
 */
export declare function ProviderOptions(props: ProviderOptionsProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=ProviderOptions.d.ts.map