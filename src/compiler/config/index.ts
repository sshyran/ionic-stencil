import { LogLevel, Logger } from '../sys/logger' 
import type {
  BuildEmitEvents,
  BuildOnEvents,
  BuildResultsComponentGraph,
  CompilerBuildResults,
  CompilerSystem,
  CopyTask,
  PageReloadStrategy,
} from '../sys/compiler-system';
import type { ConfigFlags } from '../../cli'

/**
 * https://stenciljs.com/docs/config/
 */
export interface StencilConfig {
  /**
   * By default, Stencil will attempt to optimize small scripts by inlining them in HTML. Setting
   * this flag to `false` will prevent this optimization and keep all scripts separate from HTML.
   */
  allowInlineScripts?: boolean;
  /**
   * By setting `autoprefixCss` to `true`, Stencil will use the appropriate config to automatically
   * prefix css. For example, developers can write modern and standard css properties, such as
   * "transform", and Stencil will automatically add in the prefixed version, such as "-webkit-transform".
   * As of Stencil v2, autoprefixing CSS is no longer the default.
   * Defaults to `false`
   */
  autoprefixCss?: boolean | any;

  /**
   * By default, Stencil will statically analyze the application and generate a component graph of
   * how all the components are interconnected.
   *
   * From the component graph it is able to best decide how components should be grouped
   * depending on their usage with one another within the app.
   * By doing so it's able to bundle components together in order to reduce network requests.
   * However, bundles can be manually generated using the bundles config.
   *
   * The bundles config is an array of objects that represent how components are grouped together
   * in lazy-loaded bundles.
   * This config is rarely needed as Stencil handles this automatically behind the scenes.
   */
  bundles?: ConfigBundle[];

  /**
   * Stencil will cache build results in order to speed up rebuilds.
   * To disable this feature, set enableCache to false.
   */
  enableCache?: boolean;

  /**
   * Stencil is traditionally used to compile many components into an app,
   * and each component comes with its own compartmentalized styles.
   * However, it's still common to have styles which should be "global" across all components and the website.
   * A global CSS file is often useful to set CSS Variables.
   *
   * Additionally, the globalStyle config can be used to precompile styles with Sass, PostCss, etc.
   * Below is an example folder structure containing a webapp's global sass file, named app.css.
   */
  globalStyle?: string;

  /**
   * When the hashFileNames config is set to true, and it is a production build,
   * the hashedFileNameLength config is used to determine how many characters the file name's hash should be.
   */
  hashedFileNameLength?: number;

  /**
   * During production builds, the content of each generated file is hashed to represent the content,
   * and the hashed value is used as the filename. If the content isn't updated between builds,
   * then it receives the same filename. When the content is updated, then the filename is different.
   *
   * By doing this, deployed apps can "forever-cache" the build directory and take full advantage of
   * content delivery networks (CDNs) and heavily caching files for faster apps.
   */
  hashFileNames?: boolean;

  /**
   * The namespace config is a string representing a namespace for the app.
   * For apps that are not meant to be a library of reusable components,
   * the default of App is just fine. However, if the app is meant to be consumed
   * as a third-party library, such as Ionic, a unique namespace is required.
   */
  namespace?: string;

  /**
   * Stencil is able to take an app's source and compile it to numerous targets,
   * such as an app to be deployed on an http server, or as a third-party library
   * to be distributed on npm. By default, Stencil apps have an output target type of www.
   *
   * The outputTargets config is an array of objects, with types of www and dist.
   */
  outputTargets?: OutputTarget[];

  /**
   * The plugins config can be used to add your own rollup plugins.
   * By default, Stencil does not come with Sass or PostCss support.
   * However, either can be added using the plugin array.
   */
  plugins?: any[];

  /**
   * Generate js source map files for all bundles
   */
  sourceMap?: boolean;

  /**
   * The srcDir config specifies the directory which should contain the source typescript files
   * for each component. The standard for Stencil apps is to use src, which is the default.
   */
  srcDir?: string;

  /**
   * Passes custom configuration down to the "@rollup/plugin-commonjs" that Stencil uses under the hood.
   * For further information: https://stenciljs.com/docs/module-bundling
   */
  commonjs?: BundlingConfig;

  /**
   * Passes custom configuration down to the "@rollup/plugin-node-resolve" that Stencil uses under the hood.
   * For further information: https://stenciljs.com/docs/module-bundling
   */
  nodeResolve?: NodeResolveConfig;

  /**
   * Passes custom configuration down to rollup itself, not all rollup options can be overridden.
   */
  rollupConfig?: RollupConfig;

  /**
   * Sets if the ES5 build should be generated or not. Stencil generates a modern build without ES5,
   * whereas this setting to `true` will also create es5 builds for both dev and prod modes. Setting
   * `buildEs5` to `prod` will only build ES5 in prod mode. Basically if the app does not need to run
   * on legacy browsers (IE11 and Edge 18 and below), it's safe to not build ES5, which will also speed
   * up build times. Defaults to `false`.
   */
  buildEs5?: boolean | 'prod';

  /**
   * Sets if the JS browser files are minified or not. Stencil uses `terser` under the hood.
   * Defaults to `false` in dev mode and `true` in production mode.
   */
  minifyJs?: boolean;

  /**
   * Sets if the CSS is minified or not.
   * Defaults to `false` in dev mode and `true` in production mode.
   */
  minifyCss?: boolean;

  /**
   * Forces Stencil to run in `dev` mode if the value is `true` and `production` mode
   * if it's `false`.
   *
   * Defaults to `false` (ie. production) unless the `--dev` flag is used in the CLI.
   */
  devMode?: boolean;

  /**
   * Object to provide a custom logger. By default a `logger` is already provided for the
   * platform the compiler is running on, such as NodeJS or a browser.
   */
  logger?: Logger;

  /**
   * Config to add extra runtime for DOM features that require more polyfills. Note
   * that not all DOM APIs are fully polyfilled when using the slot polyfill. These
   * are opt-in since not all users will require the additional runtime.
   */
  extras?: ConfigExtras;

  /**
   * The hydrated flag identifies if a component and all of its child components
   * have finished hydrating. This helps prevent any flash of unstyled content (FOUC)
   * as various components are asynchronously downloaded and rendered. By default it
   * will add the `hydrated` CSS class to the element. The `hydratedFlag` config can be used
   * to change the name of the CSS class, change it to an attribute, or change which
   * type of CSS properties and values are assigned before and after hydrating. This config
   * can also be used to not include the hydrated flag at all by setting it to `null`.
   */
  hydratedFlag?: HydratedFlag;

  /**
   * Ionic prefers to hide all components prior to hydration with a style tag appended
   * to the head of the document containing some `visibility: hidden;` css rules.
   *
   * Disabling this will remove the style tag that sets `visibility: hidden;` on all
   * unhydrated web components. This more closely follows the HTML spec, and allows
   * you to set your own fallback content.
   *
   */
  invisiblePrehydration?: boolean;

  /**
   * Sets the task queue used by stencil's runtime. The task queue schedules DOM read and writes
   * across the frames to efficiently render and reduce layout thrashing. By default,
   * `async` is used. It's recommended to also try each setting to decide which works
   * best for your use-case. In all cases, if your app has many CPU intensive tasks causing the
   * main thread to periodically lock-up, it's always recommended to try
   * [Web Workers](https://stenciljs.com/docs/web-workers) for those tasks.
   *
   * - `async`: DOM read and writes are scheduled in the next frame to prevent layout thrashing.
   *   During intensive CPU tasks it will not reschedule rendering to happen in the next frame.
   *   `async` is ideal for most apps, and if the app has many intensive tasks causing the main
   *   thread to lock-up, it's recommended to try [Web Workers](https://stenciljs.com/docs/web-workers)
   *   rather than the congestion async queue.
   *
   * - `congestionAsync`: DOM reads and writes are scheduled in the next frame to prevent layout
   *   thrashing. When the app is heavily tasked and the queue becomes congested it will then
   *   split the work across multiple frames to prevent blocking the main thread. However, it can
   *   also introduce unnecessary reflows in some cases, especially during startup. `congestionAsync`
   *   is ideal for apps running animations while also simultaneously executing intensive tasks
   *   which may lock-up the main thread.
   *
   * - `immediate`: Makes writeTask() and readTask() callbacks to be executed synchronously. Tasks
   *   are not scheduled to run in the next frame, but do note there is at least one microtask.
   *   The `immediate` setting is ideal for apps that do not provide long running and smooth
   *   animations. Like the async setting, if the app has intensive tasks causing the main thread
   *   to lock-up, it's recommended to try [Web Workers](https://stenciljs.com/docs/web-workers).
   */
  taskQueue?: 'async' | 'immediate' | 'congestionAsync';

  /**
   * Provide a object of key/values accessible within the app, using the `Env` object.
   */
  env?: { [prop: string]: string | undefined };

  globalScript?: string;
  srcIndexHtml?: string;
  watch?: boolean;
  testing?: TestingConfig;
  maxConcurrentWorkers?: number;
  preamble?: string;
  rollupPlugins?: { before?: any[]; after?: any[] };

  entryComponentsHint?: string[];
  buildDist?: boolean;
  buildLogFilePath?: string;
  cacheDir?: string;
  devInspector?: boolean;
  devServer?: StencilDevServerConfig;
  enableCacheStats?: boolean;
  sys?: CompilerSystem;
  tsconfig?: string;
  validateTypes?: boolean;
  /**
   * An array of RegExp patterns that are matched against all source files before adding
   * to the watch list in watch mode. If the file path matches any of the patterns, when it
   * is updated, it will not trigger a re-run of tests.
   */
  watchIgnoredRegex?: RegExp | RegExp[];
  excludeUnusedDependencies?: boolean;
  stencilCoreResolvedId?: string;
}

export interface ConfigExtras {
  /**
   * By default, the slot polyfill does not update `appendChild()` so that it appends
   * new child nodes into the correct child slot like how shadow dom works. This is an opt-in
   * polyfill for those who need it when using `element.appendChild(node)` and expecting the
   * child to be appended in the same location shadow dom would. This is not required for
   * IE11 or Edge 18, but can be enabled if the app is using `appendChild()`. Defaults to `false`.
   */
  appendChildSlotFix?: boolean;

  /**
   * By default, the runtime does not polyfill `cloneNode()` when cloning a component
   * that uses the slot polyfill. This is an opt-in polyfill for those who need it.
   * This is not required for IE11 or Edge 18, but can be enabled if the app is using
   * `cloneNode()` and unexpected node are being cloned due to the slot polyfill
   * simulating shadow dom. Defaults to `false`.
   */
  cloneNodeFix?: boolean;

  /**
   * Include the CSS Custom Property polyfill/shim for legacy browsers. ESM builds will
   * not include the css vars shim. Defaults to `false`
   */
  cssVarsShim?: boolean;

  /**
   * Dynamic `import()` shim. This is only needed for Edge 18 and below, and Firefox 67
   * and below. Defaults to `false`.
   */
  dynamicImportShim?: boolean;

  /**
   * Experimental flag. Projects that use a Stencil library built using the `dist` output target may have trouble lazily
   * loading components when using a bundler such as Vite or Parcel. Setting this flag to `true` will change how Stencil
   * lazily loads components in a way that works with additional bundlers. Setting this flag to `true` will increase
   * the size of the compiled output. Defaults to `false`.
   */
  experimentalImportInjection?: boolean;

  /**
   * Dispatches component lifecycle events. Mainly used for testing. Defaults to `false`.
   */
  lifecycleDOMEvents?: boolean;

  /**
   * Safari 10 supports ES modules with `<script type="module">`, however, it did not implement
   * `<script nomodule>`. When set to `true`, the runtime will patch support for Safari 10
   * due to its lack of `nomodule` support.
   * Defaults to `false`.
   */
  safari10?: boolean;

  /**
   * It is possible to assign data to the actual `<script>` element's `data-opts` property,
   * which then gets passed to Stencil's initial bootstrap. This feature is only required
   * for very special cases and rarely needed. Defaults to `false`.
   */
  scriptDataOpts?: boolean;

  /**
   * Experimental flag to align the behavior of invoking `textContent` on a scoped component to act more like a
   * component that uses the shadow DOM. Defaults to `false`
   */
  scopedSlotTextContentFix?: boolean;

  /**
   * If enabled `true`, the runtime will check if the shadow dom shim is required. However,
   * if it's determined that shadow dom is already natively supported by the browser then
   * it does not request the shim. When set to `false` it will avoid all shadow dom tests.
   * Defaults to `false`.
   */
  shadowDomShim?: boolean;

  /**
   * When a component is first attached to the DOM, this setting will wait a single tick before
   * rendering. This works around an Angular issue, where Angular attaches the elements before
   * settings their initial state, leading to double renders and unnecessary event dispatches.
   * Defaults to `false`.
   */
  initializeNextTick?: boolean;

  /**
   * For browsers that do not support shadow dom (IE11 and Edge 18 and below), slot is polyfilled
   * to simulate the same behavior. However, the host element's `childNodes` and `children`
   * getters are not patched to only show the child nodes and elements of the default slot.
   * Defaults to `false`.
   */
  slotChildNodesFix?: boolean;

  /**
   * Enables the tagNameTransform option of `defineCustomElements()`, so the component tagName
   * can be customized at runtime. Defaults to `false`.
   */
  tagNameTransform?: boolean;
}

export interface Config extends StencilConfig {
  buildAppCore?: boolean;
  buildDocs?: boolean;
  configPath?: string;
  writeLog?: boolean;
  devServer?: DevServerConfig;
  flags?: ConfigFlags;
  fsNamespace?: string;
  logLevel?: LogLevel;
  rootDir?: string;
  packageJsonFilePath?: string;
  suppressLogs?: boolean;
  profile?: boolean;
  tsCompilerOptions?: any;
  _isValidated?: boolean;
  _isTesting?: boolean;
}

/**
 * A 'loose' type useful for wrapping an incomplete / possible malformed
 * object as we work on getting it comply with a particular Interface T.
 *
 * Example:
 *
 * ```ts
 * interface Foo {
 *   bar: string
 * }
 *
 * function validateFoo(foo: Loose<Foo>): Foo {
 *   let validatedFoo = {
 *     ...foo,
 *     bar: foo.bar || DEFAULT_BAR
 *   }
 *
 *   return validatedFoo
 * }
 * ```
 *
 * Use this when you need to take user input or something from some other part
 * of the world that we don't control and transform it into something
 * conforming to a given interface. For best results, pair with a validation
 * function as shown in the example.
 */
type Loose<T extends Object> = Record<string, any> & Partial<T>;

/**
 * A Loose version of the Config interface. This is intended to let us load a partial config
 * and have type information carry though as we construct an object which is a valid `Config`.
 */
export type UnvalidatedConfig = Loose<Config>;

/**
 * Helper type to strip optional markers from keys in a type, while preserving other type information for the key.
 * This type takes a union of keys, K, in type T to allow for the type T to be gradually updated.
 *
 * ```typescript
 * type Foo { bar?: number, baz?: string }
 * type ReqFieldFoo = RequireFields<Foo, 'bar'>; // { bar: number, baz?: string }
 * ```
 */
type RequireFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Fields in {@link Config} to make required for {@link ValidatedConfig}
 */
type StrictConfigFields = 'flags' | 'logger' | 'outputTargets' | 'rootDir' | 'sys' | 'testing';

/**
 * A version of {@link Config} that makes certain fields required. This type represents a valid configuration entity.
 * When a configuration is received by the user, it is a bag of unverified data. In order to make stricter guarantees
 * about the data from a type-safety perspective, this type is intended to be used throughout the codebase once
 * validations have occurred at runtime.
 */
export type ValidatedConfig = RequireFields<Config, StrictConfigFields>;

export interface HydratedFlag {
  /**
   * Defaults to `hydrated`.
   */
  name?: string;
  /**
   * Can be either `class` or `attribute`. Defaults to `class`.
   */
  selector?: 'class' | 'attribute';
  /**
   * The CSS property used to show and hide components. Defaults to use the CSS `visibility`
   * property. Other commonly used CSS properties would be `display` with the `initialValue`
   * setting as `none`, or `opacity` with the `initialValue` as `0`. Defaults to `visibility`
   * and the default `initialValue` is `hidden`.
   */
  property?: string;
  /**
   * This is the CSS value to give all components before it has been hydrated.
   * Defaults to `hidden`.
   */
  initialValue?: string;
  /**
   * This is the CSS value to assign once a component has finished hydrating.
   * This is the CSS value that'll allow the component to show. Defaults to `inherit`.
   */
  hydratedValue?: string;
}

export interface StencilDevServerConfig {
  /**
   * IP address used by the dev server. The default is `0.0.0.0`, which points to all IPv4 addresses
   * on the local machine, such as `localhost`.
   */
  address?: string;
  /**
   * Base path to be used by the server. Defaults to the root pathname.
   */
  basePath?: string;
  /**
   * EXPERIMENTAL!
   * During development, node modules can be independently requested and bundled, making for
   * faster build times. This is only available using the Stencil Dev Server throughout
   * development. Production builds and builds with the `es5` flag will override
   * this setting to `false`. Default is `false`.
   */
  experimentalDevModules?: boolean;
  /**
   * If the dev server should respond with gzip compressed content. Defaults to `true`.
   */
  gzip?: boolean;
  /**
   * When set, the dev server will run via https using the SSL certificate and key you provide
   * (use `fs` if you want to read them from files).
   */
  https?: Credentials;
  /**
   * The URL the dev server should first open to. Defaults to `/`.
   */
  initialLoadUrl?: string;
  /**
   * When `true`, every request to the server will be logged within the terminal.
   * Defaults to `false`.
   */
  logRequests?: boolean;
  /**
   * By default, when dev server is started the local dev URL is opened in your default browser.
   * However, to prevent this URL to be opened change this value to `false`. Defaults to `true`.
   */
  openBrowser?: boolean;
  /**
   * Sets the server's port. Defaults to `3333`.
   */
  port?: number;
  /**
   * When files are watched and updated, by default the dev server will use `hmr` (Hot Module Replacement)
   * to update the page without a full page refresh. To have the page do a full refresh use `pageReload`.
   * To disable any reloading, use `null`. Defaults to `hmr`.
   */
  reloadStrategy?: PageReloadStrategy;
  /**
   * Local path to a NodeJs file with a dev server request listener as the default export.
   * The user's request listener is given the first chance to handle every request the dev server
   * receives, and can choose to handle it or instead pass it on to the default dev server
   * by calling `next()`.
   *
   * Below is an example of a NodeJs file the `requestListenerPath` config is using.
   * The request and response arguments are the same as Node's `http` module and `RequestListener`
   * callback. https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener
   *
   * ```js
   * module.exports = function (req, res, next) {
   *    if (req.url === '/ping') {
   *      // custom response overriding the dev server
   *      res.setHeader('Content-Type', 'text/plain');
   *      res.writeHead(200);
   *      res.end('pong');
   *    } else {
   *      // pass request on to the default dev server
   *      next();
   *    }
   * };
   * ```
   */
  requestListenerPath?: string;
  /**
   * The root directory to serve the files from.
   */
  root?: string;
  /**
   * If the dev server should Server-Side Render (SSR) each page, meaning it'll dynamically generate
   * server-side rendered html on each page load. The `--ssr` flag will most commonly be used with
   * the`--dev --watch --serve` flags during development. Note that this is for development purposes
   * only, and the built-in dev server should not be used for production. Defaults to `false`.
   */
  ssr?: boolean;
  /**
   * If the dev server fails to start up within the given timeout (in milliseconds), the startup will
   * be canceled. Set to zero to disable the timeout. Defaults to `15000`.
   */
  startupTimeout?: number;
  /**
   * Whether to use the dev server's websocket client or not. Defaults to `true`.
   */
  websocket?: boolean;
  /**
   * If the dev server should fork a worker for the server process or not. A singled-threaded dev server
   * is slower, however it is useful for debugging http requests and responses. Defaults to `true`.
   */
  worker?: boolean;
}

export interface TestingConfig extends JestConfig {
  /**
   * The `allowableMismatchedPixels` value is used to determine an acceptable
   * number of pixels that can be mismatched before the image is considered
   * to have changes. Realistically, two screenshots representing the same
   * content may have a small number of pixels that are not identical due to
   * anti-aliasing, which is perfectly normal. If the `allowableMismatchedRatio`
   * is provided it will take precedence, otherwise `allowableMismatchedPixels`
   * will be used.
   */
  allowableMismatchedPixels?: number;

  /**
   * The `allowableMismatchedRatio` ranges from `0` to `1` and is used to
   * determine an acceptable ratio of pixels that can be mismatched before
   * the image is considered to have changes. Realistically, two screenshots
   * representing the same content may have a small number of pixels that
   * are not identical due to anti-aliasing, which is perfectly normal. The
   * `allowableMismatchedRatio` is the number of pixels that were mismatched,
   * divided by the total number of pixels in the screenshot. For example,
   * a ratio value of `0.06` means 6% of the pixels can be mismatched before
   * the image is considered to have changes. If the `allowableMismatchedRatio`
   * is provided it will take precedence, otherwise `allowableMismatchedPixels`
   * will be used.
   */
  allowableMismatchedRatio?: number;

  /**
   * Matching threshold while comparing two screenshots. Value ranges from `0` to `1`.
   * Smaller values make the comparison more sensitive. The `pixelmatchThreshold`
   * value helps to ignore anti-aliasing. Default: `0.1`
   */
  pixelmatchThreshold?: number;

  /**
   * Additional arguments to pass to the browser instance.
   */
  browserArgs?: string[];

  /**
   * Path to a Chromium or Chrome executable to run instead of the bundled Chromium.
   */
  browserExecutablePath?: string;

  /**
   * Url of remote Chrome instance to use instead of local Chrome.
   */
  browserWSEndpoint?: string;

  /**
   * Whether to run browser e2e tests in headless mode. Defaults to true.
   */
  browserHeadless?: boolean;

  /**
   * Slows down e2e browser operations by the specified amount of milliseconds.
   * Useful so that you can see what is going on.
   */
  browserSlowMo?: number;

  /**
   * By default, all E2E pages wait until the "load" event, this global setting can be used
   * to change the default `waitUntil` behavior.
   */
  browserWaitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';

  /**
   * Whether to auto-open a DevTools panel for each tab.
   * If this option is true, the headless option will be set false
   */
  browserDevtools?: boolean;

  /**
   * Array of browser emulations to be using during e2e tests. A full e2e
   * test is ran for each emulation.
   */
  emulate?: EmulateConfig[];

  /**
   * Path to the Screenshot Connector module.
   */
  screenshotConnector?: string;

  /**
   * Amount of time in milliseconds to wait before a screenshot is taken.
   */
  waitBeforeScreenshot?: number;
}

export interface JestConfig {
  /**
   * This option tells Jest that all imported modules in your tests should be mocked automatically.
   * All modules used in your tests will have a replacement implementation, keeping the API surface. Default: false
   */
  automock?: boolean;

  /**
   * By default, Jest runs all tests and produces all errors into the console upon completion.
   * The bail config option can be used here to have Jest stop running tests after the first failure. Default: false
   */
  bail?: boolean;

  /**
   * The directory where Jest should store its cached dependency information. Jest attempts to scan your dependency tree once (up-front)
   * and cache it in order to ease some of the filesystem raking that needs to happen while running tests. This config option lets you
   * customize where Jest stores that cache data on disk. Default: "/tmp/<path>"
   */
  cacheDirectory?: string;

  /**
   * Automatically clear mock calls and instances between every test. Equivalent to calling jest.clearAllMocks()
   * between each test. This does not remove any mock implementation that may have been provided. Default: false
   */
  clearMocks?: boolean;

  /**
   * Indicates whether the coverage information should be collected while executing the test. Because this retrofits all
   * executed files with coverage collection statements, it may significantly slow down your tests. Default: false
   */
  collectCoverage?: boolean;

  /**
   * An array of glob patterns indicating a set of files for which coverage information should be collected.
   * If a file matches the specified glob pattern, coverage information will be collected for it even if no tests exist
   * for this file and it's never required in the test suite. Default: undefined
   */
  collectCoverageFrom?: any[];

  /**
   * The directory where Jest should output its coverage files. Default: undefined
   */
  coverageDirectory?: string;

  /**
   * An array of regexp pattern strings that are matched against all file paths before executing the test. If the file path matches
   * any of the patterns, coverage information will be skipped. These pattern strings match against the full path.
   * Use the <rootDir> string token to include the path to your project's root directory to prevent it from accidentally
   * ignoring all of your files in different environments that may have different root directories.
   * Example: ["<rootDir>/build/", "<rootDir>/node_modules/"]. Default: ["/node_modules/"]
   */
  coveragePathIgnorePatterns?: any[];

  /**
   * A list of reporter names that Jest uses when writing coverage reports. Any istanbul reporter can be used.
   * Default: ["json", "lcov", "text"]
   */
  coverageReporters?: any[];

  /**
   * This will be used to configure minimum threshold enforcement for coverage results. Thresholds can be specified as global,
   * as a glob, and as a directory or file path. If thresholds aren't met, jest will fail. Thresholds specified as a positive
   * number are taken to be the minimum percentage required. Thresholds specified as a negative number represent the maximum
   * number of uncovered entities allowed. Default: undefined
   */
  coverageThreshold?: any;

  errorOnDeprecated?: boolean;
  forceCoverageMatch?: any[];
  globals?: any;
  globalSetup?: string;
  globalTeardown?: string;

  /**
   * An array of directory names to be searched recursively up from the requiring module's location. Setting this option will
   * override the default, if you wish to still search node_modules for packages include it along with any other
   * options: ["node_modules", "bower_components"]. Default: ["node_modules"]
   */
  moduleDirectories?: string[];

  /**
   * An array of file extensions your modules use. If you require modules without specifying a file extension,
   * these are the extensions Jest will look for. Default: ['ts', 'tsx', 'js', 'json']
   */
  moduleFileExtensions?: string[];

  moduleNameMapper?: any;
  modulePaths?: any[];
  modulePathIgnorePatterns?: any[];
  notify?: boolean;
  notifyMode?: string;
  preset?: string;
  prettierPath?: string;
  projects?: any;
  reporters?: any;
  resetMocks?: boolean;
  resetModules?: boolean;
  resolver?: string;
  restoreMocks?: string;
  rootDir?: string;
  roots?: any[];
  runner?: string;

  /**
   * The paths to modules that run some code to configure or set up the testing environment before each test.
   * Since every test runs in its own environment, these scripts will be executed in the testing environment
   * immediately before executing the test code itself. Default: []
   */
  setupFiles?: string[];

  setupFilesAfterEnv?: string[];

  snapshotSerializers?: any[];
  testEnvironment?: string;
  testEnvironmentOptions?: any;
  testMatch?: string[];
  testPathIgnorePatterns?: string[];
  testPreset?: string;
  testRegex?: string;
  testResultsProcessor?: string;
  testRunner?: string;
  testURL?: string;
  timers?: string;
  transform?: { [key: string]: string };
  transformIgnorePatterns?: any[];
  unmockedModulePathPatterns?: any[];
  verbose?: boolean;
  watchPathIgnorePatterns?: any[];
}



export interface DevServerConfig extends StencilDevServerConfig {
  browserUrl?: string;
  devServerDir?: string;
  /**
   * A list of glob patterns like `subdir/*.js`  to exclude from hot-module
   * reloading updates.
   */
  excludeHmr?: string[];
  historyApiFallback?: HistoryApiFallback;
  openBrowser?: boolean;
  prerenderConfig?: string;
  protocol?: 'http' | 'https';
  srcIndexHtml?: string;
}

export interface Credentials {
  key: string;
  cert: string;
}

export interface HistoryApiFallback {
  index?: string;
  disableDotRule?: boolean;
}

