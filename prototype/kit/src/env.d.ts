/** Build-time constants injected by tools/make/bundle-game.ts (esbuild `define`) and by vitest.config.ts. */
declare const __DEBUG__: boolean;
declare const __BUILD_ID__: string;
/** True only in a game's mechanics-preview page, which runs on invented (synthetic) data by design. */
declare const __PREVIEW__: boolean;

/** Stylesheets are bundled by esbuild; importing one has no value. */
declare module '*.css' {}
