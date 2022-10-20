import type { ConfigFlags } from '../cli/config-flags';
import type { PrerenderUrlResults } from './stencil-private';
import type { JsonDocs } from './stencil-public-docs';
import type { Diagnostic } from '../compiler/sys/logger/diagnostic';
import type { Logger, LogLevel } from '../compiler/sys/logger/logger';
import type {
  BuildEmitEvents,
  BuildOnEvents,
  BuildResultsComponentGraph,
  CompilerBuildResults,
  CompilerSystem,
  CopyTask,
  PageReloadStrategy,
} from '../compiler/sys/compiler-system';

export * from './stencil-public-docs';
export * from '../compiler/sys/compiler-system';
export * from "../compiler/sys/logger/logger";
export * from "../compiler/sys/logger/diagnostic";
export * from "../compiler/config";
export { TaskCommand } from '../cli'

export interface DevServerEditor {
  id: string;
  name?: string;
  supported?: boolean;
  priority?: number;
}

/**
 * The prerender config is used when prerendering a `www` output target.
 * Within `stencil.config.ts`, set the path to the prerendering
 * config file path using the `prerenderConfig` property, such as:
 *
 * ```tsx
 * import { Config } from '@stencil/core';
 * export const config: Config = {
 *   outputTargets: [
 *     {
 *       type: 'www',
 *       baseUrl: 'https://stenciljs.com/',
 *       prerenderConfig: './prerender.config.ts',
 *     }
 *   ]
 * };
 * ```
 *
 * The `prerender.config.ts` should export a `config` object using
 * the `PrerenderConfig` interface.
 *
 * ```tsx
 * import { PrerenderConfig } from '@stencil/core';
 * export const config: PrerenderConfig = {
 *   ...
 * };
 * ```
 *
 * For more info: https://stenciljs.com/docs/static-site-generation
 */
export interface PrerenderConfig {
  /**
   * Run after each `document` is hydrated, but before it is serialized
   * into an HTML string. Hook is passed the `document` and its `URL`.
   */
  afterHydrate?(document: Document, url: URL, results: PrerenderUrlResults): any | Promise<any>;
  /**
   * Run before each `document` is hydrated. Hook is passed the `document` it's `URL`.
   */
  beforeHydrate?(document: Document, url: URL): any | Promise<any>;
  /**
   * Runs after the template Document object has serialize into an
   * HTML formatted string. Returns an HTML string to be used as the
   * base template for all prerendered pages.
   */
  afterSerializeTemplate?(html: string): string | Promise<string>;
  /**
   * Runs before the template Document object is serialize into an
   * HTML formatted string. Returns the Document to be serialized which
   * will become the base template html for all prerendered pages.
   */
  beforeSerializeTemplate?(document: Document): Document | Promise<Document>;
  /**
   * A hook to be used to generate the canonical `<link>` tag
   * which goes in the `<head>` of every prerendered page. Returning `null`
   * will not add a canonical url tag to the page.
   */
  canonicalUrl?(url: URL): string | null;
  /**
   * While prerendering, crawl same-origin URLs found within `<a href>` elements.
   * Defaults to `true`.
   */
  crawlUrls?: boolean;
  /**
   * URLs to start the prerendering from. By default the root URL of `/` is used.
   */
  entryUrls?: string[];
  /**
   * Return `true` the given `<a>` element should be crawled or not.
   */
  filterAnchor?(attrs: { [attrName: string]: string }, base?: URL): boolean;
  /**
   * Return `true` if the given URL should be prerendered or not.
   */
  filterUrl?(url: URL, base: URL): boolean;
  /**
   * Returns the file path which the prerendered HTML content
   * should be written to.
   */
  filePath?(url: URL, filePath: string): string;
  /**
   * Returns the hydrate options to use for each individual prerendered page.
   */
  hydrateOptions?(url: URL): PrerenderHydrateOptions;
  /**
   * Returns the template file's content. The template is the base
   * HTML used for all prerendered pages.
   */
  loadTemplate?(filePath: string): string | Promise<string>;
  /**
   * Used to normalize the page's URL from a given a string and the current
   * page's base URL. Largely used when reading an anchor's `href` attribute
   * value and normalizing it into a `URL`.
   */
  normalizeUrl?(href: string, base: URL): URL;
  robotsTxt?(opts: RobotsTxtOpts): string | RobotsTxtResults;
  sitemapXml?(opts: SitemapXmpOpts): string | SitemapXmpResults;
  /**
   * Static Site Generated (SSG). Does not include Stencil's clientside
   * JavaScript, custom elements or preload modules.
   */
  staticSite?: boolean;
  /**
   * If the prerenndered URLs should have a trailing "/"" or not. Defaults to `false`.
   */
  trailingSlash?: boolean;
}

export interface HydrateDocumentOptions {
  /**
   * Build ID that will be added to `<html data-stencil-build="BUILD_ID">`. By default
   * a random ID will be generated
   */
  buildId?: string;
  /**
   * Sets the `href` attribute on the `<link rel="canonical">`
   * tag within the `<head>`. If the value is not defined it will
   * ensure a canonical link tag is no included in the `<head>`.
   */
  canonicalUrl?: string;
  /**
   * Include the HTML comments and attributes used by the clientside
   * JavaScript to read the structure of the HTML and rebuild each
   * component. Defaults to `true`.
   */
  clientHydrateAnnotations?: boolean;
  /**
   * Constrain `setTimeout()` to 1ms, but still async. Also
   * only allows `setInterval()` to fire once, also constrained to 1ms.
   * Defaults to `true`.
   */
  constrainTimeouts?: boolean;
  /**
   * Sets `document.cookie`
   */
  cookie?: string;
  /**
   * Sets the `dir` attribute on the top level `<html>`.
   */
  direction?: string;
  /**
   * Component tag names listed here will not be prerendered, nor will
   * hydrated on the clientside. Components listed here will be ignored
   * as custom elements and treated no differently than a `<div>`.
   */
  excludeComponents?: string[];
  /**
   * Sets the `lang` attribute on the top level `<html>`.
   */
  language?: string;
  /**
   * Maximum number of components to hydrate on one page. Defaults to `300`.
   */
  maxHydrateCount?: number;
  /**
   * Sets `document.referrer`
   */
  referrer?: string;
  /**
   * Removes every `<script>` element found in the `document`. Defaults to `false`.
   */
  removeScripts?: boolean;
  /**
   * Removes CSS not used by elements within the `document`. Defaults to `true`.
   */
  removeUnusedStyles?: boolean;
  /**
   * The url the runtime uses for the resources, such as the assets directory.
   */
  resourcesUrl?: string;
  /**
   * Prints out runtime console logs to the NodeJS process. Defaults to `false`.
   */
  runtimeLogging?: boolean;
  /**
   * Component tags listed here will only be prerendered or serverside-rendered
   * and will not be clientside hydrated. This is useful for components that
   * are not dynamic and do not need to be defined as a custom element within the
   * browser. For example, a header or footer component would be a good example that
   * may not require any clientside JavaScript.
   */
  staticComponents?: string[];
  /**
   * The amount of milliseconds to wait for a page to finish rendering until
   * a timeout error is thrown. Defaults to `15000`.
   */
  timeout?: number;
  /**
   * Sets `document.title`.
   */
  title?: string;
  /**
   * Sets `location.href`
   */
  url?: string;
  /**
   * Sets `navigator.userAgent`
   */
  userAgent?: string;
}

export interface SerializeDocumentOptions extends HydrateDocumentOptions {
  /**
   * Runs after the `document` has been hydrated.
   */
  afterHydrate?(document: any): any | Promise<any>;
  /**
   * Sets an approximate line width the HTML should attempt to stay within.
   * Note that this is "approximate", in that HTML may often not be able
   * to be split at an exact line width. Additionally, new lines created
   * is where HTML naturally already has whitespace, such as before an
   * attribute or spaces between words. Defaults to `100`.
   */
  approximateLineWidth?: number;
  /**
   * Runs before the `document` has been hydrated.
   */
  beforeHydrate?(document: any): any | Promise<any>;
  /**
   * Format the HTML in a nicely indented format.
   * Defaults to `false`.
   */
  prettyHtml?: boolean;
  /**
   * Remove quotes from attribute values when possible.
   * Defaults to `true`.
   */
  removeAttributeQuotes?: boolean;
  /**
   * Remove the `=""` from standardized `boolean` attributes,
   * such as `hidden` or `checked`. Defaults to `true`.
   */
  removeBooleanAttributeQuotes?: boolean;
  /**
   * Remove these standardized attributes when their value is empty:
   * `class`, `dir`, `id`, `lang`, and `name`, `title`. Defaults to `true`.
   */
  removeEmptyAttributes?: boolean;
  /**
   * Remove HTML comments. Defaults to `true`.
   */
  removeHtmlComments?: boolean;
}

export interface HydrateFactoryOptions extends SerializeDocumentOptions {
  serializeToHtml: boolean;
  destroyWindow: boolean;
  destroyDocument: boolean;
}

export interface PrerenderHydrateOptions extends SerializeDocumentOptions {
  /**
   * Adds `<link rel="modulepreload">` for modules that will eventually be requested.
   * Defaults to `true`.
   */
  addModulePreloads?: boolean;
  /**
   * Hash the content of assets, such as images, fonts and css files,
   * and add the hashed value as `v` querystring. For example,
   * `/assets/image.png?v=abcd1234`. This allows for assets to be
   * heavily cached by setting the server's response header with
   * `Cache-Control: max-age=31536000, immutable`.
   */
  hashAssets?: 'querystring';
  /**
   * External stylesheets from `<link rel="stylesheet">` are instead inlined
   * into `<style>` elements. Defaults to `false`.
   */
  inlineExternalStyleSheets?: boolean;
  /**
   * Minify CSS content within `<style>` elements. Defaults to `true`.
   */
  minifyStyleElements?: boolean;
  /**
   * Minify JavaScript content within `<script>` elements. Defaults to `true`.
   */
  minifyScriptElements?: boolean;
  /**
   * Entire `document` should be static. This is useful for specific pages that
   * should be static, rather than the entire site. If the whole site should be static,
   * use the `staticSite` property on the prerender config instead. If only certain
   * components should be static then use `staticComponents` instead.
   */
  staticDocument?: boolean;
}

export interface RobotsTxtOpts {
  urls: string[];
  sitemapUrl: string;
  baseUrl: string;
  dir: string;
}

export interface RobotsTxtResults {
  content: string;
  filePath: string;
  url: string;
}

export interface SitemapXmpOpts {
  urls: string[];
  baseUrl: string;
  dir: string;
}

export interface SitemapXmpResults {
  content: string;
  filePath: string;
  url: string;
}

export interface TranspileOnlyResults {
  diagnostics: Diagnostic[];
  output: string;
  sourceMap: any;
}



export interface ConfigBundle {
  components: string[];
}

export interface BundlingConfig {
  namedExports?: {
    [key: string]: string[];
  };
}

export interface NodeResolveConfig {
  module?: boolean;
  jsnext?: boolean;
  main?: boolean;
  browser?: boolean;
  extensions?: string[];
  preferBuiltins?: boolean;
  jail?: string;
  only?: Array<string | RegExp>;
  modulesOnly?: boolean;

  /**
   * @see https://github.com/browserify/resolve#resolveid-opts-cb
   */
  customResolveOptions?: {
    basedir?: string;
    package?: string;
    extensions?: string[];
    readFile?: Function;
    isFile?: Function;
    isDirectory?: Function;
    packageFilter?: Function;
    pathFilter?: Function;
    paths?: Function | string[];
    moduleDirectory?: string | string[];
    preserveSymlinks?: boolean;
  };
}

export interface RollupConfig {
  inputOptions?: RollupInputOptions;
  outputOptions?: RollupOutputOptions;
}

export interface RollupInputOptions {
  context?: string;
  moduleContext?: ((id: string) => string) | { [id: string]: string };
  treeshake?: boolean;
}

export interface RollupOutputOptions {
  globals?: { [name: string]: string } | ((name: string) => string);
}

export interface Testing {
  run(opts: TestingRunOptions): Promise<boolean>;
  destroy(): Promise<void>;
}

export interface TestingRunOptions {
  e2e?: boolean;
  screenshot?: boolean;
  spec?: boolean;
  updateScreenshot?: boolean;
}

export interface EmulateConfig {
  /**
   * Predefined device descriptor name, such as "iPhone X" or "Nexus 10".
   * For a complete list please see: https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts
   */
  device?: string;

  /**
   * User-Agent to be used. Defaults to the user-agent of the installed Puppeteer version.
   */
  userAgent?: string;

  viewport?: EmulateViewport;
}

export interface EmulateViewport {
  /**
   * Page width in pixels.
   */
  width: number;

  /**
   * page height in pixels.
   */
  height: number;

  /**
   * Specify device scale factor (can be thought of as dpr). Defaults to 1.
   */
  deviceScaleFactor?: number;

  /**
   * Whether the meta viewport tag is taken into account. Defaults to false.
   */
  isMobile?: boolean;

  /**
   * Specifies if viewport supports touch events. Defaults to false
   */
  hasTouch?: boolean;

  /**
   * Specifies if viewport is in landscape mode. Defaults to false.
   */
  isLandscape?: boolean;
}

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
  validate?: (config: Config, diagnostics: Diagnostic[]) => void;
  generator: (config: Config, compilerCtx: any, buildCtx: any, docs: any) => Promise<void>;
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

  generator: (docs: JsonDocs, config: Config) => void | Promise<void>;
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

export interface LoadConfigInit {
  /**
   * User config object to merge into default config and
   * config loaded from a file path.
   */
  config?: UnvalidatedConfig;
  /**
   * Absolute path to a Stencil config file. This path cannot be
   * relative and it does not resolve config files within a directory.
   */
  configPath?: string;
  logger?: Logger;
  sys?: CompilerSystem;
  /**
   * When set to true, if the "tsconfig.json" file is not found
   * it'll automatically generate and save a default tsconfig
   * within the root directory.
   */
  initTsConfig?: boolean;
}

/**
 * Results from an attempt to load a config. The values on this interface
 * have not yet been validated and are not ready to be used for arbitrary
 * operations around the codebase.
 */
export interface LoadConfigResults {
  config: ValidatedConfig;
  diagnostics: Diagnostic[];
  tsconfig: {
    path: string;
    compilerOptions: any;
    files: string[];
    include: string[];
    exclude: string[];
    extends: string;
  };
}

export interface CacheStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}

export interface WorkerOptions {
  maxConcurrentWorkers?: number;
  maxConcurrentTasksPerWorker?: number;
  logger?: Logger;
}

export interface RollupInterface {
  rollup: {
    (config: any): Promise<any>;
  };
  plugins: {
    nodeResolve(opts: any): any;
    replace(opts: any): any;
    commonjs(opts: any): any;
    json(): any;
  };
}

export interface ResolveModuleOptions {
  manuallyResolve?: boolean;
  packageJson?: boolean;
}

export interface PrerenderStartOptions {
  buildId?: string;
  hydrateAppFilePath: string;
  componentGraph: BuildResultsComponentGraph;
  srcIndexHtmlPath: string;
}

export interface PrerenderResults {
  buildId: string;
  diagnostics: Diagnostic[];
  urls: number;
  duration: number;
  average: number;
}

/**
 * Input for CSS optimization functions, including the input CSS
 * string and a few boolean options which turn on or off various
 * optimizations.
 */
export interface OptimizeCssInput {
  input: string;
  filePath?: string;
  autoprefixer?: boolean | null | AutoprefixerOptions;
  minify?: boolean;
  sourceMap?: boolean;
  resolveUrl?: (url: string) => Promise<string> | string;
}

/**
 * This is not a real interface describing the options which can
 * be passed to autoprefixer, for that see the docs, here:
 * https://github.com/postcss/autoprefixer#options
 *
 * Instead, this basically just serves as a label type to track
 * that arguments are being passed consistently.
 */
export type AutoprefixerOptions = Object;

/**
 * Output from CSS optimization functions, wrapping up optimized
 * CSS and any diagnostics produced during optimization.
 */
export interface OptimizeCssOutput {
  output: string;
  diagnostics: Diagnostic[];
}

export interface OptimizeJsInput {
  input: string;
  filePath?: string;
  target?: 'es5' | 'latest';
  pretty?: boolean;
  sourceMap?: boolean;
}

export interface OptimizeJsOutput {
  output: string;
  sourceMap: any;
  diagnostics: Diagnostic[];
}

export interface FsWatcherItem {
  close(): void;
}

export interface MakeDirectoryOptions {
  /**
   * Indicates whether parent folders should be created.
   * @default false
   */
  recursive?: boolean;
  /**
   * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
   * @default 0o777.
   */
  mode?: number;
}

export interface FsStats {
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
}

export interface Compiler {
  build(): Promise<CompilerBuildResults>;
  createWatcher(): Promise<CompilerWatcher>;
  destroy(): Promise<void>;
  sys: CompilerSystem;
}

export interface CompilerWatcher extends BuildOnEvents {
  start: () => Promise<WatcherCloseResults>;
  close: () => Promise<WatcherCloseResults>;
  request: (data: CompilerRequest) => Promise<CompilerRequestResponse>;
}

export interface CompilerRequest {
  path?: string;
}

export interface WatcherCloseResults {
  exitCode: number;
}

export interface CompilerRequestResponse {
  path: string;
  nodeModuleId: string;
  nodeModuleVersion: string;
  nodeResolvedPath: string;
  cachePath: string;
  cacheHit: boolean;
  content: string;
  status: number;
}

export interface TranspileOptions {
  /**
   * A component can be defined as a custom element by using `customelement`, or the
   * component class can be exported by using `module`. Default is `customelement`.
   */
  componentExport?: 'customelement' | 'module' | string | undefined;
  /**
   * Sets how and if component metadata should be assigned on the compiled
   * component output. The `compilerstatic` value will set the metadata to
   * a static `COMPILER_META` getter on the component class. This option
   * is useful for unit testing preprocessors. Default is `null`.
   */
  componentMetadata?: 'runtimestatic' | 'compilerstatic' | string | undefined;
  /**
   * The actual internal import path for any `@stencil/core` imports.
   * Default is `@stencil/core/internal/client`.
   */
  coreImportPath?: string;
  /**
   * The current working directory. Default is `/`.
   */
  currentDirectory?: string;
  /**
   * The filename of the code being compiled. Default is `module.tsx`.
   */
  file?: string;
  /**
   * Module format to use for the compiled code output, which can be either `esm` or `cjs`.
   * Default is `esm`.
   */
  module?: 'cjs' | 'esm' | string;
  /**
   * Sets how and if any properties, methods and events are proxied on the
   * component class. The `defineproperty` value sets the getters and setters
   * using Object.defineProperty. Default is `defineproperty`.
   */
  proxy?: 'defineproperty' | string | undefined;
  /**
   * How component styles should be associated to the component. The `static`
   * setting will assign the styles as a static getter on the component class.
   */
  style?: 'static' | string | undefined;
  /**
   * How style data should be added for imports. For example, the `queryparams` value
   * adds the component's tagname and encapsulation info as querystring parameter
   * to the style's import, such as `style.css?tag=my-tag&encapsulation=shadow`. This
   * style data can be used by bundlers to further optimize each component's css.
   * Set to `null` to not include the querystring parameters. Default is `queryparams`.
   */
  styleImportData?: 'queryparams' | string | undefined;
  /**
   * The JavaScript source target TypeScript should to transpile to. Values can be
   * `latest`, `esnext`, `es2017`, `es2015`, or `es5`. Defaults to `latest`.
   */
  target?: CompileTarget;
  /**
   * Create a source map. Using `inline` will inline the source map into the
   * code, otherwise the source map will be in the returned `map` property.
   * Default is `true`.
   */
  sourceMap?: boolean | 'inline';
  /**
   * Base directory to resolve non-relative module names. Same as the `baseUrl`
   * TypeScript compiler option: https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
   */
  baseUrl?: string;
  /**
   * List of path mapping entries for module names to locations relative to the `baseUrl`.
   * Same as the `paths` TypeScript compiler option:
   * https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
   */
  paths?: { [key: string]: string[] };
  /**
   * Passed in Stencil Compiler System, otherwise falls back to the internal in-memory only system.
   */
  sys?: CompilerSystem;
}

export type CompileTarget =
  | 'latest'
  | 'esnext'
  | 'es2020'
  | 'es2019'
  | 'es2018'
  | 'es2017'
  | 'es2015'
  | 'es5'
  | string
  | undefined;

export interface TranspileResults {
  code: string;
  data?: any[];
  diagnostics: Diagnostic[];
  imports?: { path: string }[];
  inputFileExtension: string;
  inputFilePath: string;
  map: any;
  outputFilePath: string;
}

export interface TransformOptions {
  coreImportPath: string;
  componentExport: 'lazy' | 'module' | 'customelement' | null;
  componentMetadata: 'runtimestatic' | 'compilerstatic' | null;
  currentDirectory: string;
  file?: string;
  isolatedModules?: boolean;
  module?: 'cjs' | 'esm';
  proxy: 'defineproperty' | null;
  style: 'static' | null;
  styleImportData: 'queryparams' | null;
  target?: string;
}

export interface CompileScriptMinifyOptions {
  target?: CompileTarget;
  pretty?: boolean;
}

export interface DevServer extends BuildEmitEvents {
  address: string;
  basePath: string;
  browserUrl: string;
  protocol: string;
  port: number;
  root: string;
  close(): Promise<void>;
}

export interface CliInitOptions {
  args: string[];
  logger: Logger;
  sys: CompilerSystem;
}
