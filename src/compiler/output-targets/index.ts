import type { RollupCache } from 'rollup';

import type * as d from '../../declarations';
import type { JsonDocs } from '../../declarations/stencil-public-docs';
import { outputCopy } from './copy/output-copy';
import { outputCollection } from './dist-collection';
import { outputCustomElements } from './dist-custom-elements';
import { outputCustomElementsBundle } from './dist-custom-elements-bundle';
import { outputHydrateScript } from './dist-hydrate-script';
import { outputLazy } from './dist-lazy/lazy-output';
import { outputAngular } from './output-angular';
import { outputDocs } from './output-docs';
import { outputLazyLoader } from './output-lazy-loader';
import { outputTypes } from './output-types';
import { outputWww } from './output-www';

export const generateOutputTargets = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx
) => {
  const timeSpan = buildCtx.createTimeSpan('generate outputs started', true);

  const changedModuleFiles = Array.from(compilerCtx.changedModules)
    .map((filename) => compilerCtx.moduleMap.get(filename))
    .filter((mod) => mod && !mod.isCollectionDependency);

  compilerCtx.changedModules.clear();

  invalidateRollupCaches(compilerCtx);

  await Promise.all([
    outputAngular(config, compilerCtx, buildCtx),
    outputCopy(config, compilerCtx, buildCtx),
    outputCollection(config, compilerCtx, buildCtx, changedModuleFiles),
    outputCustomElements(config, compilerCtx, buildCtx),
    outputCustomElementsBundle(config, compilerCtx, buildCtx),
    outputHydrateScript(config, compilerCtx, buildCtx),
    outputLazyLoader(config, compilerCtx),
    outputLazy(config, compilerCtx, buildCtx),
    outputWww(config, compilerCtx, buildCtx),
  ]);

  // must run after all the other outputs
  // since it validates files were created
  await outputDocs(config, compilerCtx, buildCtx);
  await outputTypes(config, compilerCtx, buildCtx);

  timeSpan.finish('generate outputs finished');
};

const invalidateRollupCaches = (compilerCtx: d.CompilerCtx) => {
  const invalidatedIds = compilerCtx.changedFiles;
  compilerCtx.rollupCache.forEach((cache: RollupCache) => {
    cache.modules.forEach((mod) => {
      if (mod.transformDependencies.some((id) => invalidatedIds.has(id))) {
        mod.originalCode = null;
      }
    });
  });
};

export interface OutputTargetDist extends OutputTargetBase {
  type: 'dist';

  buildDir?: string;
  dir?: string;

  collectionDir?: string | null;
  /**
   * When `true` this flag will transform aliased import paths defined in
   * a project's `tsconfig.json` to relative import paths in the compiled output's
   * `dist-collection` bundle if it is generated (i.e. `collectionDir` is set).
   *
   * Paths will be left in aliased format if `false` or `undefined`.
   *
   * @example
   * // tsconfig.json
   * {
   *   paths: {
   *     "@utils/*": ['/src/utils/*']
   *   }
   * }
   *
   * // Source file
   * import * as dateUtils from '@utils/date-utils';
   * // Output file
   * import * as dateUtils from '../utils/date-utils';
   */
  transformAliasedImportPathsInCollection?: boolean | null;

  typesDir?: string;
  esmLoaderPath?: string;
  copy?: CopyTask[];
  polyfills?: boolean;

  empty?: boolean;
}

export interface OutputTargetDistCollection extends OutputTargetBase {
  type: 'dist-collection';
  empty?: boolean;
  dir: string;
  collectionDir: string;
  /**
   * When `true` this flag will transform aliased import paths defined in
   * a project's `tsconfig.json` to relative import paths in the compiled output.
   *
   * Paths will be left in aliased format if `false` or `undefined`.
   *
   * @example
   * // tsconfig.json
   * {
   *   paths: {
   *     "@utils/*": ['/src/utils/*']
   *   }
   * }
   *
   * // Source file
   * import * as dateUtils from '@utils/date-utils';
   * // Output file
   * import * as dateUtils from '../utils/date-utils';
   */
  transformAliasedImportPaths?: boolean | null;
}

export interface OutputTargetDistTypes extends OutputTargetBase {
  type: 'dist-types';
  dir: string;
  typesDir: string;
}

export interface OutputTargetDistLazy extends OutputTargetBase {
  type: 'dist-lazy';

  dir?: string;
  esmDir?: string;
  esmEs5Dir?: string;
  systemDir?: string;
  cjsDir?: string;
  polyfills?: boolean;
  isBrowserBuild?: boolean;

  esmIndexFile?: string;
  cjsIndexFile?: string;
  systemLoaderFile?: string;
  legacyLoaderFile?: string;
  empty?: boolean;
}

export interface OutputTargetDistGlobalStyles extends OutputTargetBase {
  type: 'dist-global-styles';
  file: string;
}

export interface OutputTargetDistLazyLoader extends OutputTargetBase {
  type: 'dist-lazy-loader';
  dir: string;

  esmDir: string;
  esmEs5Dir?: string;
  cjsDir: string;
  componentDts: string;

  empty: boolean;
}

export interface OutputTargetHydrate extends OutputTargetBase {
  type: 'dist-hydrate-script';
  dir?: string;
  /**
   * Module IDs that should not be bundled into the script.
   * By default, all node builtin's, such as `fs` or `path`
   * will be considered "external" and not bundled.
   */
  external?: string[];
  empty?: boolean;
}

export interface OutputTargetCustom extends OutputTargetBase {
  type: 'custom';
  name: string;
  validate?: (config: d.Config, diagnostics: d.Diagnostic[]) => void;
  generator: (config: d.Config, compilerCtx: any, buildCtx: any, docs: any) => Promise<void>;
  copy?: CopyTask[];
}

/**
 * Output target for generating [custom data](https://github.com/microsoft/vscode-custom-data) for VS Code as a JSON
 * file.
 */
export interface OutputTargetDocsVscode extends OutputTargetBase {
  /**
   * Designates this output target to be used for generating VS Code custom data.
   * @see OutputTargetBase#type
   */
  type: 'docs-vscode';
  /**
   * The location on disk to write the JSON file.
   */
  file: string;
  /**
   * A base URL to find the source code of the component(s) described in the JSON file.
   */
  sourceCodeBaseUrl?: string;
}

export interface OutputTargetDocsReadme extends OutputTargetBase {
  type: 'docs-readme';
  dir?: string;
  dependencies?: boolean;
  footer?: string;
  strict?: boolean;
}

export interface OutputTargetDocsJson extends OutputTargetBase {
  type: 'docs-json';

  file: string;
  typesFile?: string | null;
  strict?: boolean;
}

export interface OutputTargetDocsCustom extends OutputTargetBase {
  type: 'docs-custom';

  generator: (docs: JsonDocs, config: d.Config) => void | Promise<void>;
  strict?: boolean;
}

export interface OutputTargetStats extends OutputTargetBase {
  type: 'stats';

  file?: string;
}

export interface OutputTargetBaseNext {
  type: string;
  dir?: string;
}

export interface OutputTargetDistCustomElements extends OutputTargetBaseNext {
  type: 'dist-custom-elements';
  empty?: boolean;
  /**
   * Triggers the following behaviors when enabled:
   * 1. All `@stencil/core/*` module references are treated as external during bundling.
   * 2. File names are not hashed.
   * 3. File minification will follow the behavior defined at the root of the Stencil config.
   */
  externalRuntime?: boolean;
  copy?: CopyTask[];
  inlineDynamicImports?: boolean;
  includeGlobalScripts?: boolean;
  minify?: boolean;
  /**
   * Enables the auto-definition of a component and its children (recursively) in the custom elements registry. This
   * functionality allows consumers to bypass the explicit call to define a component, its children, its children's
   * children, etc. Users of this flag should be aware that enabling this functionality may increase bundle size.
   */
  autoDefineCustomElements?: boolean;
  /**
   * Enables the generation of type definition files for the output target.
   */
  generateTypeDeclarations?: boolean;
}

export interface OutputTargetDistCustomElementsBundle extends OutputTargetBaseNext {
  type: 'dist-custom-elements-bundle';
  empty?: boolean;
  externalRuntime?: boolean;
  copy?: CopyTask[];
  inlineDynamicImports?: boolean;
  includeGlobalScripts?: boolean;
  minify?: boolean;
}

/**
 * The base type for output targets. All output targets should extend this base type.
 */
export interface OutputTargetBase {
  /**
   * A unique string to differentiate one output target from another
   */
  type: string;
}

export type OutputTargetBuild = OutputTargetDistCollection | OutputTargetDistLazy;

export interface OutputTargetAngular extends OutputTargetBase {
  type: 'angular';

  componentCorePackage: string;
  directivesProxyFile?: string;
  directivesArrayFile?: string;
  directivesUtilsFile?: string;
  excludeComponents?: string[];
}

export interface OutputTargetCopy extends OutputTargetBase {
  type: 'copy';

  dir: string;
  copy?: CopyTask[];
  copyAssets?: 'collection' | 'dist';
}

export interface OutputTargetWww extends OutputTargetBase {
  /**
   * Webapp output target.
   */
  type: 'www';

  /**
   * The directory to write the app's JavaScript and CSS build
   * files to. The default is to place this directory as a child
   * to the `dir` config. Default: `build`
   */
  buildDir?: string;

  /**
   * The directory to write the entire application to.
   * Note, the `buildDir` is where the app's JavaScript and CSS build
   * files are written. Default: `www`
   */
  dir?: string;

  /**
   * Empty the build directory of all files and directories on first build.
   * Default: `true`
   */
  empty?: boolean;

  /**
   * The default index html file of the app, commonly found at the
   * root of the `src` directory.
   * Default: `index.html`
   */
  indexHtml?: string;

  /**
   * The copy config is an array of objects that defines any files or folders that should
   * be copied over to the build directory.
   *
   * Each object in the array must include a src property which can be either an absolute path,
   * a relative path or a glob pattern. The config can also provide an optional dest property
   * which can be either an absolute path or a path relative to the build directory.
   * Also note that any files within src/assets are automatically copied to www/assets for convenience.
   *
   * In the copy config below, it will copy the entire directory from src/docs-content over to www/docs-content.
   */
  copy?: CopyTask[];

  /**
   * The base url of the app, it's required during prerendering to be the absolute path
   * of your app, such as: `https://my.app.com/app`.
   *
   * Default: `/`
   */
  baseUrl?: string;

  /**
   * By default, stencil will include all the polyfills required by legacy browsers in the ES5 build.
   * If it's `false`, stencil will not emit this polyfills anymore and it's your responsibility to provide them before
   * stencil initializes.
   */
  polyfills?: boolean;

  /**
   * Path to an external node module which has exports of the prerender config object.
   * ```
   * module.exports = {
   *   afterHydrate(document, url) {
   *     document.title = `URL: ${url.href}`;
   *   }
   * }
   * ```
   */
  prerenderConfig?: string;

  /**
   * Service worker config for production builds. During development builds
   * service worker script will be injected to automatically unregister existing
   * service workers. When set to `false` neither a service worker registration
   * or unregistration will be added to the index.html.
   */
  serviceWorker?: ServiceWorkerConfig | null | false;
  appDir?: string;
}

export type OutputTarget =
  | OutputTargetAngular
  | OutputTargetCopy
  | OutputTargetCustom
  | OutputTargetDist
  | OutputTargetDistCollection
  | OutputTargetDistCustomElements
  | OutputTargetDistCustomElementsBundle
  | OutputTargetDistLazy
  | OutputTargetDistGlobalStyles
  | OutputTargetDistLazyLoader
  | OutputTargetDocsJson
  | OutputTargetDocsCustom
  | OutputTargetDocsReadme
  | OutputTargetDocsVscode
  | OutputTargetWww
  | OutputTargetHydrate
  | OutputTargetStats
  | OutputTargetDistTypes;

export interface ServiceWorkerConfig {
  // https://developers.google.com/web/tools/workbox/modules/workbox-build#full_generatesw_config
  unregister?: boolean;

  swDest?: string;
  swSrc?: string;
  globPatterns?: string[];
  globDirectory?: string | string[];
  globIgnores?: string | string[];
  templatedUrls?: any;
  maximumFileSizeToCacheInBytes?: number;
  manifestTransforms?: any;
  modifyUrlPrefix?: any;
  dontCacheBustURLsMatching?: RegExp;
  navigateFallback?: string;
  navigateFallbackWhitelist?: RegExp[];
  navigateFallbackBlacklist?: RegExp[];
  cacheId?: string;
  skipWaiting?: boolean;
  clientsClaim?: boolean;
  directoryIndex?: string;
  runtimeCaching?: any[];
  ignoreUrlParametersMatching?: any[];
  handleFetch?: boolean;
}

export interface CopyTask {
  src: string;
  dest?: string;
  warn?: boolean;
  keepDirStructure?: boolean;
}
