window.__ModuleLoader__.load({
	id: "@winterhuan/dsh-client-ui-settings-model-options",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		/** Canonical order of the adapter's selectable thinking levels. */
		const THINKING_LEVELS = Object.keys({
			off: true,
			minimal: true,
			low: true,
			medium: true,
			high: true,
			xhigh: true,
			max: true
		});
		/**
		* What the batch control stages when thinking is enabled: the common
		* OpenAI-compatible levels with their own names as request values, and Off
		* sending nothing — the same initial shape the official model list offers.
		*/
		const STANDARD_REASONING = {
			mode: "custom",
			efforts: {
				off: "",
				low: "low",
				medium: "medium",
				high: "high"
			}
		};
		const DEFAULT_RETRYABLE_CODES = [
			"EMPTY_RESPONSE",
			"RATE_LIMIT",
			"SERVER",
			"TIMEOUT",
			"TRANSPORT"
		];
		/**
		* Read the provider's configured retry classes, or the pinned runtime defaults.
		* @param value - resolved settings namespace.
		* @param providerPath - provider's address within the namespace.
		* @param read - settings-owned reader.
		* @returns normal-mode retry classes; always mode ignores this list.
		*/
		function retryableCodes(value, providerPath, read) {
			const codes = read(value, [
				...providerPath,
				"retryPolicy",
				"retryableCodes"
			]);
			return Array.isArray(codes) && codes.every((code) => typeof code === "string") ? codes : DEFAULT_RETRYABLE_CODES;
		}
		/**
		* Join stored models with catalog labels without materializing a replacement catalog.
		* @param profile - resolved provider settings.
		* @param catalog - current models reported by the Host.
		* @param read - settings-owned path reader.
		* @param imageField - adapter-owned key that carries each model's input modalities.
		* @returns declared models, or catalog models and retained overrides when no list is configured.
		*/
		function modelOptions(profile, catalog, read, imageField = "input") {
			const configured = read(profile, ["models"]);
			if (Array.isArray(configured) && configured.length > 0) return configured.flatMap((model, index) => {
				const id = read(model, ["id"]);
				const name = read(model, ["name"]);
				return typeof id === "string" ? [{
					id,
					name: typeof name === "string" ? name : id,
					path: ["models", String(index)],
					reasoning: read(model, ["reasoningEfforts"]),
					image: read(model, [imageField]),
					imageField
				}] : [];
			});
			const overrides = read(profile, ["modelOverrides"]);
			const ids = new Set(catalog.map((model) => model.id));
			if (typeof overrides === "object" && overrides !== null) for (const id of Object.keys(overrides)) ids.add(id);
			return [...ids].map((id) => ({
				id,
				name: catalog.find((model) => model.id === id)?.name ?? id,
				path: ["modelOverrides", id],
				reasoning: read(overrides, [id, "reasoningEfforts"]),
				image: read(overrides, [id, imageField]),
				imageField
			}));
		}
		/**
		* Decode persisted capability metadata into editable values.
		* @param value - a model's reasoningEfforts setting.
		* @returns inherited, disabled, or explicitly declared levels.
		*/
		function reasoningDraft(value) {
			if (value === false) return {
				mode: "disabled",
				efforts: {}
			};
			if (typeof value !== "object" || value === null) return {
				mode: "inherit",
				efforts: {}
			};
			const efforts = {};
			for (const level of THINKING_LEVELS) {
				const wire = Reflect.get(value, level);
				if (typeof wire === "string") efforts[level] = wire;
				else if (level === "off" && wire === null) efforts.off = "";
			}
			return {
				mode: "custom",
				efforts
			};
		}
		/**
		* Decode a persisted input-modality declaration into an editable capability.
		* @param value - a model's adapter-owned input list.
		* @returns inherited when absent or empty, otherwise text-only or multimodal.
		*/
		function imageDraft(value) {
			if (!Array.isArray(value) || value.length === 0) return { mode: "inherit" };
			return value.includes("image") ? { mode: "textAndImage" } : { mode: "text" };
		}
		/**
		* Validate the draft before the Host performs protocol-specific validation.
		* @param draft - pending edits.
		* @returns the locale key of the first invalid field, or undefined.
		*/
		function draftError(draft) {
			if (draft.retry?.mode === "normal") {
				const count = Number(draft.retry.count);
				if (draft.retry.count.trim() === "" || !Number.isSafeInteger(count) || count < 0) return "invalidRetries";
			}
			for (const reasoning of draft.reasoning.values()) {
				const error = reasoningError(reasoning);
				if (error !== void 0) return error;
			}
		}
		/**
		* Check one capability declaration before editing or copying it.
		* @param reasoning - the source model's staged or stored capability.
		* @returns a field validation key, or undefined when the declaration can be saved.
		*/
		function reasoningError(reasoning) {
			if (reasoning.mode !== "custom") return void 0;
			if (!THINKING_LEVELS.some((level) => level !== "off" && reasoning.efforts[level] !== void 0)) return "missingLevel";
			if (THINKING_LEVELS.some((level) => level !== "off" && reasoning.efforts[level]?.trim() === "")) return "missingWire";
		}
		/**
		* Build atomic edits against the draft's original model addresses.
		* @param draft - validated edits and their starting snapshot.
		* @param providerPath - provider's address within its settings namespace.
		* @param models - model addresses read from that snapshot.
		* @param read - settings-owned reader for inherited retry settings.
		* @returns field operations preserving other model fields, credentials, backoff, used image budgets, and unselected retry classes.
		* @throws when a draft is invalid or a selected model is absent.
		*/
		function optionOperations(draft, providerPath, models, read) {
			const error = draftError(draft);
			if (error !== void 0) throw new Error(error);
			const ops = [];
			if (draft.retry !== void 0) {
				const path = [...providerPath, "retryPolicy"];
				if (draft.retry.mode === "inherit") {
					const inheritedMode = read(draft.snapshot.base, [...path, "mode"]);
					ops.push(inheritedMode === void 0 ? {
						op: "set",
						path: [...path, "mode"],
						value: "normal"
					} : {
						op: "unset",
						path: [...path, "mode"]
					});
					ops.push({
						op: "unset",
						path: [...path, "maxRetries"]
					});
				} else {
					ops.push({
						op: "set",
						path: [...path, "mode"],
						value: "normal"
					});
					ops.push({
						op: "set",
						path: [...path, "maxRetries"],
						value: Number(draft.retry.count)
					});
				}
			}
			if (draft.retryInvalidRequests !== void 0 || draft.retryAuthErrors !== void 0 || draft.retryQuotaErrors !== void 0 || draft.retryUnclassifiedErrors !== void 0) {
				const path = [...providerPath, "retryPolicy"];
				let codes = [...retryableCodes(draft.snapshot.value, providerPath, read)];
				for (const [code, enabled] of [
					["INVALID_REQUEST", draft.retryInvalidRequests],
					["AUTH", draft.retryAuthErrors],
					["QUOTA", draft.retryQuotaErrors],
					["PI_AI_ERROR", draft.retryUnclassifiedErrors]
				]) {
					if (enabled === void 0) continue;
					codes = enabled ? codes.includes(code) ? codes : [...codes, code] : codes.filter((existing) => existing !== code);
				}
				if (draft.retry === void 0 && read(draft.snapshot.value, [...path, "mode"]) === void 0) ops.push({
					op: "set",
					path: [...path, "mode"],
					value: "normal"
				});
				ops.push({
					op: "set",
					path: [...path, "retryableCodes"],
					value: codes.length ? [...codes] : [...DEFAULT_RETRYABLE_CODES]
				});
			}
			for (const [id, reasoning] of draft.reasoning) {
				const model = models.find((candidate) => candidate.id === id);
				if (model === void 0) throw new Error(`Model ${id} is absent from the settings draft`);
				const path = [
					...providerPath,
					...model.path,
					"reasoningEfforts"
				];
				if (reasoning.mode === "inherit") ops.push({
					op: "unset",
					path
				});
				else if (reasoning.mode === "disabled") ops.push({
					op: "set",
					path,
					value: false
				});
				else {
					const value = {};
					for (const level of THINKING_LEVELS) {
						const wire = reasoning.efforts[level];
						if (wire !== void 0) value[level] = level === "off" && wire.trim() === "" ? null : wire;
					}
					ops.push({
						op: "set",
						path,
						value
					});
				}
			}
			for (const [id, image] of draft.image) {
				const model = models.find((candidate) => candidate.id === id);
				if (model === void 0) throw new Error(`Model ${id} is absent from the settings draft`);
				const path = [
					...providerPath,
					...model.path,
					model.imageField
				];
				if (image.mode === "inherit") ops.push({
					op: "unset",
					path
				});
				else ops.push({
					op: "set",
					path,
					value: image.mode === "textAndImage" ? ["text", "image"] : ["text"]
				});
				if (model.imageField === "inputModalities" && image.mode !== "textAndImage") {
					ops.push({
						op: "unset",
						path: [
							...providerPath,
							...model.path,
							"imagePixelBudget"
						]
					});
					ops.push({
						op: "unset",
						path: [
							...providerPath,
							...model.path,
							"imageMaxBytes"
						]
					});
				}
			}
			return ops;
		}
		//#endregion
		//#region \0dsh-css:/Users/winter/dsh-plugins/dsh-client-ui-settings-model-options/packages/winterhuan/ui-settings-model-options/src/client/options.module.css.mjs
		const css = ".awwQ9W_details{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}.awwQ9W_details summary{cursor:pointer}.awwQ9W_editor,.awwQ9W_group,.awwQ9W_batch,.awwQ9W_mapping{flex-direction:column;gap:12px;min-width:0;display:flex}.awwQ9W_editor{padding-top:12px}.awwQ9W_group{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);margin:0;padding:12px}.awwQ9W_group legend{padding:0 4px;font-weight:500}.awwQ9W_hint,.awwQ9W_notice,.awwQ9W_validation p{overflow-wrap:anywhere;margin:0}.awwQ9W_hint{color:var(--dsw-alias-label-secondary)}.awwQ9W_notice{color:var(--dsw-alias-state-warn-label)}.awwQ9W_field{flex-direction:column;gap:6px;min-width:0;display:flex}.awwQ9W_field input,.awwQ9W_field select,.awwQ9W_count{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-settings-card-fill);width:100%;min-width:0;height:32px;color:var(--dsw-alias-label-primary);font:inherit;padding:0 10px}.awwQ9W_count{max-width:160px}.awwQ9W_loading{justify-content:center;padding:12px;display:flex}.awwQ9W_spinner{animation:1s linear infinite awwQ9W_spin}@keyframes awwQ9W_spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.awwQ9W_spinner{animation:none}}.awwQ9W_levels{border:0;flex-wrap:wrap;gap:12px;margin:0;padding:0;display:flex}.awwQ9W_levels legend{padding:0 0 6px}.awwQ9W_check{align-items:center;gap:6px;display:inline-flex}.awwQ9W_check input{accent-color:var(--dsw-alias-button-primary-fill);margin:0}.awwQ9W_preview{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);padding:12px}.awwQ9W_mappingPreview{margin:6px 0 0}.awwQ9W_mappingPreview>div{flex-wrap:wrap;gap:6px 12px;display:flex}.awwQ9W_mappingPreview dd{overflow-wrap:anywhere;margin:0}.awwQ9W_targetList{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);max-height:240px;margin:0;padding:4px;list-style:none;overflow-y:auto}.awwQ9W_target{cursor:pointer;align-items:flex-start;gap:8px;padding:6px;display:flex}.awwQ9W_target input{accent-color:var(--dsw-alias-button-primary-fill);margin:4px 0 0}.awwQ9W_targetCopy{overflow-wrap:anywhere;flex-direction:column;min-width:0;display:flex}.awwQ9W_recipientNames{overflow-wrap:anywhere;max-height:100px;margin:0;overflow-y:auto}.awwQ9W_mapping>*+*{margin-top:12px}.awwQ9W_validation{min-height:20px;color:var(--dsw-alias-state-error-primary)}.awwQ9W_actions{flex-wrap:wrap;gap:8px;display:flex}.awwQ9W_save,.awwQ9W_discard,.awwQ9W_link{font:inherit;cursor:pointer;border-radius:var(--dsw-radius-md)}.awwQ9W_save,.awwQ9W_discard{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);min-height:32px;padding:4px 12px}.awwQ9W_save{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}.awwQ9W_discard{color:var(--dsw-alias-label-primary);background:0 0}.awwQ9W_link{color:var(--dsw-alias-link);text-align:start;background:0 0;border:0;align-self:flex-start;padding:0}.awwQ9W_details button:disabled,.awwQ9W_details input:disabled,.awwQ9W_details select:disabled{opacity:.5;cursor:default}.awwQ9W_details :focus-visible{outline:2px solid var(--dsw-alias-button-primary-fill);outline-offset:2px}";
		const tagId = "@winterhuan/dsh-client-ui-settings-model-options/options.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@winterhuan/dsh-client-ui-settings-model-options";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var options_module_css_default = {
			"actions": "awwQ9W_actions",
			"batch": "awwQ9W_batch",
			"check": "awwQ9W_check",
			"count": "awwQ9W_count",
			"details": "awwQ9W_details",
			"discard": "awwQ9W_discard",
			"editor": "awwQ9W_editor",
			"field": "awwQ9W_field",
			"group": "awwQ9W_group",
			"hint": "awwQ9W_hint",
			"levels": "awwQ9W_levels",
			"link": "awwQ9W_link",
			"loading": "awwQ9W_loading",
			"mapping": "awwQ9W_mapping",
			"mappingPreview": "awwQ9W_mappingPreview",
			"notice": "awwQ9W_notice",
			"preview": "awwQ9W_preview",
			"recipientNames": "awwQ9W_recipientNames",
			"save": "awwQ9W_save",
			"spin": "awwQ9W_spin",
			"spinner": "awwQ9W_spinner",
			"target": "awwQ9W_target",
			"targetCopy": "awwQ9W_targetCopy",
			"targetList": "awwQ9W_targetList",
			"validation": "awwQ9W_validation"
		};
		//#endregion
		//#region lib/types/client/BatchTargets.js
		/** Searchable recipients shared by the capability batch panels. */
		/**
		* Select models that will receive one capability and review it before applying.
		* @param props - capability preview, available targets, localized copy, and draft actions.
		* @returns an inline selection panel with no targets preselected.
		*/
		function BatchTargets({ label, preview, hint, targets, t, onApply, onCancel }) {
			const [search, setSearch] = (0, react.useState)("");
			const [selected, setSelected] = (0, react.useState)(/* @__PURE__ */ new Set());
			const query = search.trim().toLowerCase();
			const visible = targets.filter((model) => `${model.name} ${model.id}`.toLowerCase().includes(query));
			const recipients = targets.filter((model) => selected.has(model.id));
			const allVisible = visible.length > 0 && visible.every((model) => selected.has(model.id));
			return (0, react_jsx_runtime.jsxs)("section", {
				className: options_module_css_default.batch,
				role: "group",
				"aria-label": label,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: options_module_css_default.preview,
						children: preview
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: options_module_css_default.hint,
						children: hint
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: options_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", { children: t("searchModels") }), (0, react_jsx_runtime.jsx)("input", {
							type: "search",
							value: search,
							onChange: (event) => {
								setSearch(event.target.value);
							}
						})]
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: options_module_css_default.link,
						disabled: visible.length === 0,
						onClick: () => {
							const next = new Set(selected);
							for (const model of visible) if (allVisible) next.delete(model.id);
							else next.add(model.id);
							setSelected(next);
						},
						children: t(allVisible ? "deselectVisible" : "selectVisible")
					}),
					(0, react_jsx_runtime.jsx)("ul", {
						className: options_module_css_default.targetList,
						children: visible.map((model) => (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsxs)("label", {
							className: options_module_css_default.target,
							children: [(0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								"aria-label": t("selectTarget", { model: model.name === model.id ? model.id : `${model.name} (${model.id})` }),
								checked: selected.has(model.id),
								onChange: (event) => {
									const next = new Set(selected);
									if (event.target.checked) next.add(model.id);
									else next.delete(model.id);
									setSelected(next);
								}
							}), (0, react_jsx_runtime.jsxs)("span", {
								className: options_module_css_default.targetCopy,
								children: [(0, react_jsx_runtime.jsx)("span", { children: model.name === model.id ? model.id : `${model.name} (${model.id})` }), (0, react_jsx_runtime.jsx)("span", {
									className: options_module_css_default.hint,
									children: model.summary
								})]
							})]
						}) }, model.id))
					}),
					visible.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: options_module_css_default.hint,
						children: t("noMatches")
					}) : null,
					(0, react_jsx_runtime.jsx)("p", {
						className: options_module_css_default.hint,
						"aria-live": "polite",
						children: t("selectedTargets", { count: String(recipients.length) })
					}),
					recipients.length > 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: options_module_css_default.recipientNames,
						children: recipients.map((model) => model.name === model.id ? model.id : `${model.name} (${model.id})`).join(t("listSeparator"))
					}) : null,
					(0, react_jsx_runtime.jsxs)("div", {
						className: options_module_css_default.actions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: options_module_css_default.discard,
							onClick: onCancel,
							children: t("cancelBatch")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: options_module_css_default.save,
							disabled: recipients.length === 0,
							onClick: () => {
								onApply(recipients.map((model) => model.id));
							},
							children: t("applyTargets", { count: String(recipients.length) })
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/BatchReasoning.js
		/** Levels the batch offers locale labels for; anything else prints its own name. */
		const LABELED_LEVELS = [
			"off",
			"low",
			"medium",
			"high"
		];
		/**
		* Summarize a configured capability without inferring an endpoint's support.
		* @param reasoning - the stored or staged model configuration.
		* @param t - model options dictionary.
		* @returns inheritance, non-thinking, or the explicitly selected level names.
		*/
		function reasoningSummary(reasoning, t) {
			if (reasoning.mode === "inherit") return t("summaryInherit");
			if (reasoning.mode === "disabled") return t("disabled");
			const label = (level) => LABELED_LEVELS.includes(level) ? t(level) : level;
			const selected = Object.keys(reasoning.efforts);
			return selected.length === 0 ? t("summaryEmpty") : selected.map(label).join(" / ");
		}
		/**
		* Select models that will receive one thinking capability.
		* @param props - capability preview, available targets, localized copy, and draft actions.
		* @returns an inline selection panel with no targets preselected.
		*/
		function BatchReasoning({ reasoning, targets, t, onApply, onCancel }) {
			return (0, react_jsx_runtime.jsx)(BatchTargets, {
				label: t("reasoningBatchTitle"),
				hint: t("reasoningBatchHint"),
				targets,
				t,
				onApply,
				onCancel,
				preview: (0, react_jsx_runtime.jsx)("p", {
					className: options_module_css_default.hint,
					children: t("reasoningBatchPreview", { capability: reasoningSummary(reasoning, t) })
				})
			});
		}
		//#endregion
		//#region lib/types/client/BatchImage.js
		/**
		* Summarize an image capability declaration without inferring an endpoint's support.
		* @param image - the stored or staged model configuration.
		* @param t - model options dictionary.
		* @returns inherited, text-only, or text-and-image.
		*/
		function imageSummary(image, t) {
			if (image.mode === "inherit") return t("summaryInherit");
			return image.mode === "textAndImage" ? t("imageTextAndImage") : t("imageText");
		}
		/**
		* Select models that will receive one image capability.
		* @param props - capability preview, available targets, localized copy, and draft actions.
		* @returns an inline selection panel with no targets preselected.
		*/
		function BatchImage({ image, targets, t, onApply, onCancel }) {
			return (0, react_jsx_runtime.jsx)(BatchTargets, {
				label: t("imageBatchTitle"),
				hint: t("imageBatchHint"),
				targets,
				t,
				onApply,
				onCancel,
				preview: (0, react_jsx_runtime.jsx)("p", {
					className: options_module_css_default.hint,
					children: t("imageBatchPreview", { capability: imageSummary(image, t) })
				})
			});
		}
		//#endregion
		//#region lib/types/client/ProviderOptions.js
		/** Provider-card controls; drafts remain local until one atomic settings save succeeds. */
		/**
		* Render the saved provider's optional controls without adding another settings page.
		* @param props - provider-card owner and injected settings actions.
		* @returns a disclosure, or nothing for an unsaved provider.
		*/
		function ProviderOptions(props) {
			const [open, setOpen] = (0, react.useState)(false);
			const snapshot = props.useSettings((value) => value);
			if (!props.configured) return null;
			return (0, react_jsx_runtime.jsxs)("details", {
				className: options_module_css_default.details,
				onToggle: (event) => {
					setOpen(event.currentTarget.open);
				},
				children: [(0, react_jsx_runtime.jsx)("summary", { children: props.t("title") }), open ? (0, react_jsx_runtime.jsx)(OptionsEditor, {
					...props,
					snapshot
				}) : null]
			});
		}
		function OptionsEditor(props) {
			const { snapshot, provider, read, t, loadModels, save } = props;
			const id = (0, react.useId)();
			const [draft, setDraft] = (0, react.useState)(null);
			const [reasoningMode, setReasoningMode] = (0, react.useState)("custom");
			const [imageMode, setImageMode] = (0, react.useState)("textAndImage");
			const [batch, setBatch] = (0, react.useState)(null);
			const reasoningBatch = batch?.kind === "reasoning" ? batch : null;
			const imageBatch = batch?.kind === "image" ? batch : null;
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [catalogError, setCatalogError] = (0, react.useState)(null);
			const [reload, setReload] = (0, react.useState)(0);
			const [saving, setSaving] = (0, react.useState)(false);
			const [conflicted, setConflicted] = (0, react.useState)(false);
			const active = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				active.current = true;
				return () => {
					active.current = false;
				};
			}, []);
			const piAi = provider.settingsNs === "llm-pi-ai";
			(0, react.useEffect)(() => {
				if (!piAi) return;
				let current = true;
				loadModels(provider.provider).then((result) => {
					if (!current) return;
					if (result.ok) {
						setCatalog(result.models);
						setCatalogError(null);
					} else setCatalogError(result.message);
				});
				return () => {
					current = false;
				};
			}, [
				piAi,
				loadModels,
				provider.provider,
				snapshot.revision,
				reload
			]);
			const source = draft?.snapshot ?? batch?.snapshot ?? snapshot;
			const models = modelOptions(read(source.value, provider.settingsPath), catalog, read, piAi ? "input" : "inputModalities");
			const stale = conflicted || source.revision !== snapshot.revision;
			const error = draft === null ? void 0 : draftError(draft);
			const blocked = saving || !snapshot.writable || stale || snapshot.status !== "ready";
			const retry = draft?.retry;
			const policyPath = [...provider.settingsPath, "retryPolicy"];
			const inherited = retry?.mode === "inherit";
			const policySource = inherited ? source.base : source.value;
			const unlimited = retry?.mode !== "normal" && read(policySource, [...policyPath, "mode"]) === "always";
			const retries = read(policySource, [...policyPath, "maxRetries"]);
			const retryText = retry?.mode === "normal" ? retry.count : unlimited ? "" : String(typeof retries === "number" ? retries : 5);
			const codes = retryableCodes(source.value, provider.settingsPath, read);
			const retryInvalid = unlimited || (draft?.retryInvalidRequests ?? codes.includes("INVALID_REQUEST"));
			const retryAuth = unlimited || (draft?.retryAuthErrors ?? codes.includes("AUTH"));
			const retryQuota = unlimited || (draft?.retryQuotaErrors ?? codes.includes("QUOTA"));
			const retryUnclassified = unlimited || (draft?.retryUnclassifiedErrors ?? codes.includes("PI_AI_ERROR"));
			const edit = (change) => {
				setDraft((current) => change(current ?? {
					snapshot: source,
					reasoning: /* @__PURE__ */ new Map(),
					image: /* @__PURE__ */ new Map()
				}));
			};
			const editRetry = (next) => {
				edit((current) => ({
					...current,
					retry: next
				}));
			};
			const summaries = models.map((item) => {
				const pending = draft?.reasoning.get(item.id);
				const summary = reasoningSummary(pending ?? reasoningDraft(item.reasoning), t);
				return {
					id: item.id,
					name: item.name,
					summary: pending === void 0 ? summary : t("pendingSummary", { summary })
				};
			});
			const imageSummaries = models.map((item) => {
				const pending = draft?.image.get(item.id);
				const summary = imageSummary(pending ?? imageDraft(item.image), t);
				return {
					id: item.id,
					name: item.name,
					summary: pending === void 0 ? summary : t("pendingSummary", { summary })
				};
			});
			const submit = async () => {
				if (draft === null || batch !== null || blocked || error !== void 0 || draft.snapshot.revision === void 0) return;
				setSaving(true);
				const result = await save(optionOperations(draft, provider.settingsPath, models, read), draft.snapshot.revision);
				if (!active.current) return;
				setSaving(false);
				if (result.ok) {
					setDraft(null);
					setConflicted(false);
				} else if (result.conflict) setConflicted(true);
			};
			if (snapshot.status !== "ready") return (0, react_jsx_runtime.jsx)("p", {
				role: "status",
				children: t("unavailable")
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: options_module_css_default.editor,
				children: [
					!snapshot.writable ? (0, react_jsx_runtime.jsx)("p", {
						className: options_module_css_default.notice,
						role: "status",
						children: t("readOnly")
					}) : null,
					piAi && catalogError !== null ? (0, react_jsx_runtime.jsxs)("div", {
						className: options_module_css_default.notice,
						role: "status",
						children: [t("catalogFailed", { message: catalogError }), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: options_module_css_default.link,
							onClick: () => {
								setReload((value) => value + 1);
							},
							children: t("reload")
						})]
					}) : null,
					piAi && models.length > 0 ? (0, react_jsx_runtime.jsxs)("fieldset", {
						className: options_module_css_default.group,
						disabled: blocked || imageBatch !== null,
						children: [(0, react_jsx_runtime.jsx)("legend", { children: t("reasoning") }), reasoningBatch !== null ? (0, react_jsx_runtime.jsx)(BatchReasoning, {
							reasoning: reasoningBatch.capability,
							targets: summaries,
							t,
							onCancel: () => {
								setBatch(null);
							},
							onApply: (ids) => {
								edit((current) => {
									const next = new Map(current.reasoning);
									for (const target of ids) next.set(target, reasoningBatch.capability);
									return {
										...current,
										reasoning: next
									};
								});
								setBatch(null);
							}
						}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								children: t("reasoningHint")
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: options_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("label", {
									htmlFor: `${id}-reasoning`,
									children: t("reasoningTarget")
								}), (0, react_jsx_runtime.jsxs)("select", {
									id: `${id}-reasoning`,
									value: reasoningMode,
									onChange: (event) => {
										const mode = event.target.value;
										if (mode === "inherit" || mode === "disabled" || mode === "custom") setReasoningMode(mode);
									},
									children: [
										(0, react_jsx_runtime.jsx)("option", {
											value: "custom",
											children: t("reasoningEnabled")
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "disabled",
											children: t("disabled")
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "inherit",
											children: t("inherit")
										})
									]
								})]
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: options_module_css_default.discard,
								onClick: () => {
									setBatch({
										kind: "reasoning",
										capability: reasoningMode === "custom" ? {
											...STANDARD_REASONING,
											efforts: { ...STANDARD_REASONING.efforts }
										} : {
											mode: reasoningMode,
											efforts: {}
										},
										snapshot: source
									});
								},
								children: t("reasoningBatchTitle")
							})
						] })]
					}) : null,
					models.length > 0 ? (0, react_jsx_runtime.jsxs)("fieldset", {
						className: options_module_css_default.group,
						disabled: blocked || reasoningBatch !== null,
						children: [(0, react_jsx_runtime.jsx)("legend", { children: t("imageInput") }), imageBatch !== null ? (0, react_jsx_runtime.jsx)(BatchImage, {
							image: imageBatch.capability,
							targets: imageSummaries,
							t,
							onCancel: () => {
								setBatch(null);
							},
							onApply: (ids) => {
								edit((current) => {
									const next = new Map(current.image);
									for (const target of ids) next.set(target, { mode: imageBatch.capability.mode });
									return {
										...current,
										image: next
									};
								});
								setBatch(null);
							}
						}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								children: t("imageInputHint")
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: options_module_css_default.field,
								children: [(0, react_jsx_runtime.jsx)("label", {
									htmlFor: `${id}-image`,
									children: t("imageTarget")
								}), (0, react_jsx_runtime.jsxs)("select", {
									id: `${id}-image`,
									value: imageMode,
									onChange: (event) => {
										const mode = event.target.value;
										if (mode === "inherit" || mode === "text" || mode === "textAndImage") setImageMode(mode);
									},
									children: [
										(0, react_jsx_runtime.jsx)("option", {
											value: "textAndImage",
											children: t("imageTextAndImage")
										}),
										(0, react_jsx_runtime.jsx)("option", {
											value: "text",
											children: t("imageText")
										}),
										piAi ? (0, react_jsx_runtime.jsx)("option", {
											value: "inherit",
											children: t("imageInherit")
										}) : null
									]
								})]
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: options_module_css_default.discard,
								onClick: () => {
									setBatch({
										kind: "image",
										capability: { mode: imageMode },
										snapshot: source
									});
								},
								children: t("imageBatchTitle")
							})
						] })]
					}) : null,
					(0, react_jsx_runtime.jsxs)("fieldset", {
						className: options_module_css_default.group,
						disabled: blocked,
						children: [
							(0, react_jsx_runtime.jsx)("legend", { children: t("retry") }),
							(0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								id: `${id}-retry-hint`,
								children: t("retryHint")
							}),
							unlimited ? (0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.notice,
								children: t("unlimited")
							}) : null,
							(0, react_jsx_runtime.jsx)("input", {
								className: options_module_css_default.count,
								type: "number",
								min: 0,
								max: Number.MAX_SAFE_INTEGER,
								step: 1,
								"aria-label": t("retry"),
								"aria-describedby": `${id}-retry-hint`,
								"aria-invalid": error === "invalidRetries",
								value: retryText,
								onChange: (event) => {
									editRetry({
										mode: "normal",
										count: event.target.value
									});
								}
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: options_module_css_default.link,
								onClick: () => {
									editRetry({ mode: "inherit" });
								},
								children: t("inheritedRetry")
							}),
							inherited ? (0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								children: t("restored")
							}) : null,
							(0, react_jsx_runtime.jsxs)("label", {
								className: options_module_css_default.check,
								children: [(0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: retryInvalid,
									disabled: unlimited,
									"aria-describedby": `${id}-invalid-retry-hint`,
									onChange: (event) => {
										const checked = event.target.checked;
										edit((current) => ({
											...current,
											retryInvalidRequests: checked
										}));
									}
								}), t("retryInvalidRequests")]
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								id: `${id}-invalid-retry-hint`,
								children: t("retryInvalidHint")
							}),
							(0, react_jsx_runtime.jsxs)("label", {
								className: options_module_css_default.check,
								children: [(0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: retryAuth,
									disabled: unlimited,
									"aria-describedby": `${id}-auth-retry-hint`,
									onChange: (event) => {
										const checked = event.target.checked;
										edit((current) => ({
											...current,
											retryAuthErrors: checked
										}));
									}
								}), t("retryAuthErrors")]
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								id: `${id}-auth-retry-hint`,
								children: t("retryAuthHint")
							}),
							(0, react_jsx_runtime.jsxs)("label", {
								className: options_module_css_default.check,
								children: [(0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: retryQuota,
									disabled: unlimited,
									"aria-describedby": `${id}-quota-retry-hint`,
									onChange: (event) => {
										const checked = event.target.checked;
										edit((current) => ({
											...current,
											retryQuotaErrors: checked
										}));
									}
								}), t("retryQuotaErrors")]
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								id: `${id}-quota-retry-hint`,
								children: t("retryQuotaHint")
							}),
							piAi ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("label", {
								className: options_module_css_default.check,
								children: [(0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: retryUnclassified,
									disabled: unlimited,
									"aria-describedby": `${id}-unclassified-retry-hint`,
									onChange: (event) => {
										const checked = event.target.checked;
										edit((current) => ({
											...current,
											retryUnclassifiedErrors: checked
										}));
									}
								}), t("retryUnclassifiedErrors")]
							}), (0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								id: `${id}-unclassified-retry-hint`,
								children: t("retryUnclassifiedHint")
							})] }) : null,
							!unlimited && !retryInvalid && !retryAuth && !retryQuota && !retryUnclassified && codes.length > 0 && codes.every((code) => code === "INVALID_REQUEST" || code === "AUTH" || code === "QUOTA" || code === "PI_AI_ERROR") ? (0, react_jsx_runtime.jsx)("p", {
								className: options_module_css_default.hint,
								children: t("retryDefaultsRestored")
							}) : null
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: options_module_css_default.validation,
						"aria-live": "polite",
						children: stale ? (0, react_jsx_runtime.jsx)("p", {
							role: "alert",
							children: t("conflict")
						}) : error === void 0 ? null : (0, react_jsx_runtime.jsx)("p", {
							role: "alert",
							children: t(error)
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: options_module_css_default.actions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: options_module_css_default.save,
							disabled: blocked || draft === null || batch !== null || error !== void 0,
							onClick: () => {
								submit();
							},
							children: saving ? t("saving") : t("save")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: options_module_css_default.discard,
							disabled: saving || draft === null && batch === null,
							onClick: () => {
								setDraft(null);
								setBatch(null);
								setConflicted(false);
							},
							children: t("discard")
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/operations.js
		/**
		* Bind a provider-family form to the shared settings mirror and native catalog.
		* @param ctx - plugin context with settings and session remotes injected.
		* @param ns - owning settings namespace.
		* @param report - report a settled write from the application-wide toast host.
		* @returns actions that preserve drafts on refusal and fold accepted writes into every settings surface.
		*/
		function providerOptionsFace(ctx, ns, report) {
			const mirror = ctx.configForms.describe();
			return {
				hooks: { settings: ctx.configForms.get(ns) },
				read: (value, path) => ctx.settingsSchema.getPath(value, path),
				save: async (ops, revision) => {
					let outcome;
					try {
						const response = await ctx.remote.settings.mutate(ns, ops, revision);
						if (response.ok) {
							mirror.acceptView(response.value);
							outcome = { ok: true };
						} else {
							outcome = {
								ok: false,
								conflict: response.error.code === "settings/conflict",
								message: response.error.message
							};
							if (outcome.conflict) {
								const current = await ctx.remote.settings.describe();
								if (current.ok) {
									const view = current.value.namespaces.find((view) => view.ns === ns);
									if (view !== void 0) mirror.acceptView(view);
								}
							}
						}
					} catch (error) {
						outcome = {
							ok: false,
							conflict: false,
							message: error instanceof Error ? error.message : String(error)
						};
					}
					report(outcome);
					return outcome;
				},
				loadModels: async (provider) => {
					try {
						const response = await ctx.remote.session.modelCatalog();
						if (!response.ok) return {
							ok: false,
							message: response.error.message
						};
						const failure = response.value.failures.find((item) => item.id === provider);
						if (failure !== void 0) return {
							ok: false,
							message: failure.message
						};
						return {
							ok: true,
							models: response.value.groups.find((group) => group.id === provider)?.models ?? []
						};
					} catch (error) {
						return {
							ok: false,
							message: error instanceof Error ? error.message : String(error)
						};
					}
				}
			};
		}
		//#endregion
		//#region lib/types/client/OutcomeToast.js
		/** Application-wide save outcome, kept alive when a provider card closes. */
		/**
		* Show the latest save result independently of the settings page lifetime.
		* @param props - outcome hook, dismissal, and localized copy.
		* @returns the shared Toast primitive, or null while no result is pending.
		*/
		function OutcomeToast(props) {
			const notice = props.useNotice((value) => value);
			if (notice === null) return null;
			return notice.outcome.ok ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
				text: props.t("saved"),
				tone: "success",
				onDone: props.dismiss
			}, notice.sequence) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
				text: props.t("saveFailed", { message: notice.outcome.message }),
				icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutlineRegular, {}),
				onDone: props.dismiss
			}, notice.sequence);
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** Copy owned by the provider-card extension and its shared outcome toast. */
		/** English model settings copy. */
		const en = {
			title: "Capabilities and retries",
			summaryInherit: "Inherited",
			summaryEmpty: "No levels selected",
			pendingSummary: "{summary} (pending)",
			searchModels: "Search models",
			selectVisible: "Select all results",
			deselectVisible: "Deselect all results",
			selectTarget: "Select {model}",
			noMatches: "No matching models",
			selectedTargets: "{count} models selected",
			listSeparator: ", ",
			cancelBatch: "Cancel",
			applyTargets: "Apply to {count} models",
			reasoning: "Thinking capability",
			inherit: "Inherit configuration or model catalog",
			disabled: "Not supported",
			reasoningEnabled: "Standard levels (Off / Low / Medium / High)",
			reasoningHint: "Provider settings declare levels per model; apply one capability to several models here. Applying stages drafts only. Choose the level for a conversation in the chat model picker.",
			reasoningTarget: "Thinking capability to apply",
			reasoningBatchTitle: "Apply thinking capability to models",
			reasoningBatchHint: "Select the models that should receive this thinking capability. Applying stages their drafts; Save persists every edit together.",
			reasoningBatchPreview: "Applying: {capability}",
			imageInput: "Image input",
			imageInputHint: "Provider settings enable image input per model; apply one capability to several models here. Applying stages drafts only.",
			imageTarget: "Image capability to apply",
			imageText: "Text only",
			imageTextAndImage: "Text and images",
			imageInherit: "Restore inherited",
			imageBatchTitle: "Apply image input to models",
			imageBatchHint: "Select the models that should receive this image capability. Applying stages their drafts; Save persists every edit together.",
			imageBatchPreview: "Applying: {capability}",
			off: "Off",
			low: "Low",
			medium: "Medium",
			high: "High",
			retry: "Maximum retries",
			retryHint: "Additional attempts after the first request, shared by all models from this provider. 0 disables retries; the default is 5. Only eligible request failures are retried.",
			retryInvalidRequests: "Retry invalid requests (HTTP 400/413)",
			retryInvalidHint: "Uses the retry limit above. Requests are sent again unchanged; retries do not fix unsupported parameters.",
			retryAuthErrors: "Retry authentication errors (AUTH)",
			retryAuthHint: "Uses the retry limit above. Enable this only when the provider can recover; invalid credentials and exhausted quota will keep failing.",
			retryQuotaErrors: "Retry quota errors (QUOTA)",
			retryQuotaHint: "Uses the retry limit above. Requests are sent again unchanged; retries do not add quota. Enable this when the provider can recover.",
			retryUnclassifiedErrors: "Retry unclassified errors (PI_AI_ERROR)",
			retryUnclassifiedHint: "Uses the retry limit above. Includes failures the pi-ai adapter cannot classify, such as a transient gateway message without a status code. Unclassified failures can be permanent, so requests may repeat without succeeding.",
			retryDefaultsRestored: "Turning this off restores the default transient error classes because no other retry class is configured.",
			unlimited: "The current policy retries without a limit. Enter a number to use bounded retries.",
			inheritedRetry: "Restore inherited retry limit",
			restored: "Inherited setting will be restored when saved",
			save: "Save",
			saving: "Saving…",
			discard: "Discard changes",
			saved: "Model settings saved",
			saveFailed: "Could not save model settings: {message}",
			unavailable: "Model settings are unavailable",
			readOnly: "Model settings are read-only",
			conflict: "Settings changed elsewhere. Discard these edits and try again.",
			invalidRetries: "Enter a non-negative whole number of retries",
			missingLevel: "Select at least one thinking level other than Off",
			missingWire: "Enter a parameter value for every selected thinking level",
			catalogFailed: "Could not load the model catalog: {message}",
			reload: "Reload models"
		};
		/** Chinese model settings copy. */
		const zh = {
			title: "模型能力与重试",
			summaryInherit: "继承",
			summaryEmpty: "未选择级别",
			pendingSummary: "{summary}（待保存）",
			searchModels: "搜索模型",
			selectVisible: "全选搜索结果",
			deselectVisible: "取消全选搜索结果",
			selectTarget: "选择 {model}",
			noMatches: "没有匹配的模型",
			selectedTargets: "已选择 {count} 个模型",
			listSeparator: "、",
			cancelBatch: "取消",
			applyTargets: "应用到 {count} 个模型",
			reasoning: "思考能力",
			inherit: "继承配置或模型目录",
			disabled: "不支持",
			reasoningEnabled: "标准级别（关闭 / 低 / 中 / 高）",
			reasoningHint: "提供方设置里逐个模型声明级别；这里把同一种能力一次应用到多个模型，应用只写入草稿。聊天时在模型选择器中选择本次使用的级别",
			reasoningTarget: "要应用的思考能力",
			reasoningBatchTitle: "批量设置思考能力",
			reasoningBatchHint: "勾选要接收该思考能力的模型。应用只写入草稿，点击“保存”后统一生效",
			reasoningBatchPreview: "将应用：{capability}",
			imageInput: "图片输入",
			imageInputHint: "提供方设置里逐个模型开启图片输入；这里把同一种能力一次应用到多个模型，应用只写入草稿",
			imageTarget: "要应用的图片能力",
			imageText: "仅文本",
			imageTextAndImage: "文本和图片",
			imageInherit: "恢复继承",
			imageBatchTitle: "批量设置图片输入",
			imageBatchHint: "勾选要接收该图片能力的模型。应用只写入草稿，点击“保存”后统一生效",
			imageBatchPreview: "将应用：{capability}",
			off: "关闭",
			low: "低",
			medium: "中",
			high: "高",
			retry: "最大重试次数",
			retryHint: "首次请求失败后额外重试的次数，同一提供方下的模型共用。0 表示不重试，默认 5 次；仅重试符合策略的请求错误",
			retryInvalidRequests: "重试无效请求（HTTP 400/413）",
			retryInvalidHint: "沿用上方次数上限，原样重新发送请求；重试不会修正不支持的参数",
			retryAuthErrors: "重试认证错误（AUTH）",
			retryAuthHint: "沿用上方次数上限。仅在提供方可能恢复时开启；无效密钥和额度不足会持续失败",
			retryQuotaErrors: "重试额度错误（QUOTA）",
			retryQuotaHint: "沿用上方次数上限，原样重新发送请求；重试不会增加额度，仅在提供方可能恢复时开启",
			retryUnclassifiedErrors: "重试未分类错误（PI_AI_ERROR）",
			retryUnclassifiedHint: "沿用上方次数上限。包含 pi-ai 适配器无法归类的失败，例如不带状态码的网关临时提示；未分类失败可能是永久性的，重试可能重复失败",
			retryDefaultsRestored: "当前未配置其他可重试错误，关闭后将恢复默认的临时错误分类",
			unlimited: "当前策略为不限次数重试，输入次数后改为有限重试",
			inheritedRetry: "恢复继承的重试次数",
			restored: "保存后恢复继承的设置",
			save: "保存",
			saving: "保存中…",
			discard: "放弃修改",
			saved: "模型设置已保存",
			saveFailed: "模型设置保存失败：{message}",
			unavailable: "模型设置暂不可用",
			readOnly: "模型设置为只读",
			conflict: "设置已在其他位置更改，请放弃当前修改后重试",
			invalidRetries: "请输入非负整数作为重试次数",
			missingLevel: "请至少选择一个“关闭”以外的思考级别",
			missingWire: "请填写每个已选思考级别的参数值",
			catalogFailed: "模型目录加载失败：{message}",
			reload: "重新加载模型"
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Namespace of this plugin's dictionaries. */
		const NS = "settings.modelOptions";
		/** Host services used by the provider cards and shared save notifications. */
		const inject = [
			"slots",
			"locale",
			"configForms",
			"settingsSchema",
			"remote",
			"remote.settings",
			"remote.session"
		];
		/**
		* Register provider-card extensions and a save-outcome overlay through disposable slot effects.
		* @param ctx - browser plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				en,
				zh
			}), "model-options: dictionaries");
			const notice = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(null);
			let sequence = 0;
			for (const ns of ["llm-pi-ai", "llm-deepseek"]) {
				const face = providerOptionsFace(ctx, ns, (outcome) => {
					notice.set({
						outcome,
						sequence: ++sequence
					});
				});
				ctx.effect(() => ctx.slots.inject("settings.models.provider-card", () => ctx.slots.register({
					name: "settings.models.provider-card",
					key: ns,
					locale: NS,
					inject: () => face
				}, ProviderOptions)), `model-options: ${ns}`);
			}
			ctx.effect(() => ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "model-options-outcome",
				locale: NS,
				inject: () => ({
					hooks: { notice },
					dismiss: () => {
						notice.set(null);
					}
				})
			}, OutcomeToast)), "model-options: outcome toast");
		}
		//#endregion
		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map