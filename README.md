# @winterhuan/dsh-client-ui-settings-model-options

English | [中文](README.zh.md)

Model thinking, image input, and provider retry settings in the DSH Models page.

[Plugin documentation](packages/winterhuan/ui-settings-model-options/README.md) · [Release package](https://github.com/winterhuan/dsh-client-ui-settings-model-options/releases/download/v0.1.7-rc.2/winterhuan-dsh-client-ui-settings-model-options-0.1.7-rc.2.tgz)

Use Node 24 (default) or Node 22.19 and later, with pnpm 11.7.0.

```sh
git clone https://github.com/winterhuan/dsh-client-ui-settings-model-options.git
cd dsh-client-ui-settings-model-options
git submodule update --init
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
```

The upstream submodule supplies client test sources. Builds use the published DSH dependencies. The plugin source is in `packages/winterhuan/ui-settings-model-options`.
