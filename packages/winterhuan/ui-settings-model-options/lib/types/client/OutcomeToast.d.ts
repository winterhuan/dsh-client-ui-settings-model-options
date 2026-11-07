import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SaveOutcome } from './operations.ts';
/** A settled write and its sequence, so consecutive identical outcomes restart the toast. */
export interface OutcomeNotice {
    outcome: SaveOutcome;
    sequence: number;
}
/** Plain state and dismissal action for the root overlay. */
export interface OutcomeToastFace {
    hooks: {
        notice: HostObservable<OutcomeNotice | null>;
    };
    dismiss: () => void;
}
/**
 * Show the latest save result independently of the settings page lifetime.
 * @param props - outcome hook, dismissal, and localized copy.
 * @returns the shared Toast primitive, or null while no result is pending.
 */
export declare function OutcomeToast(props: PropsRuntime<'shell.overlay'> & PropsLocale<'settings.modelOptions'> & InjectFace<OutcomeToastFace>): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=OutcomeToast.d.ts.map