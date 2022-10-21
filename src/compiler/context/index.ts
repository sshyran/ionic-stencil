import { Diagnostic } from '../sys/logger/diagnostic'
import { ComponentCompilerMeta } from '../component-compiler-meta'

export interface CompilerCtx {
  version: number;
  activeBuildId: number;
  activeDirsAdded: string[];
  activeDirsDeleted: string[];
  activeFilesAdded: string[];
  activeFilesDeleted: string[];
  activeFilesUpdated: string[];
  addWatchDir: (path: string, recursive: boolean) => void;
  addWatchFile: (path: string) => void;
  cache: Cache;
  cssModuleImports: Map<string, string[]>;
  cachedGlobalStyle: string;
  collections: CollectionCompilerMeta[];
  compilerOptions: any;
  events: BuildEvents;
  fs: InMemoryFileSystem;
  hasSuccessfulBuild: boolean;
  isActivelyBuilding: boolean;
  lastBuildResults: CompilerBuildResults;
  moduleMap: ModuleMap;
  nodeMap: NodeMap;
  resolvedCollections: Set<string>;
  rollupCacheHydrate: any;
  rollupCacheLazy: any;
  rollupCacheNative: any;
  styleModeNames: Set<string>;
  changedModules: Set<string>;
  changedFiles: Set<string>;
  worker?: CompilerWorkerContext;

  rollupCache: Map<string, any>;

  reset(): void;
}

export interface CompilerWorkerContext {
  optimizeCss(inputOpts: OptimizeCssInput): Promise<OptimizeCssOutput>;
  prepareModule(
    input: string,
    minifyOpts: any,
    transpile: boolean,
    inlineHelpers: boolean
  ): Promise<{ output: string; diagnostics: Diagnostic[]; sourceMap?: SourceMap }>;
  prerenderWorker(prerenderRequest: PrerenderUrlRequest): Promise<PrerenderUrlResults>;
  transformCssToEsm(input: TransformCssToEsmInput): Promise<TransformCssToEsmOutput>;
}

export interface MsgToWorker {
  stencilId: number;
  args: any[];
}

export interface MsgFromWorker {
  stencilId?: number;
  stencilRtnValue: any;
  stencilRtnError: string;
}

export interface CompilerWorkerTask {
  stencilId?: number;
  inputArgs?: any[];
  resolve: (val: any) => any;
  reject: (msg: string) => any;
  retries?: number;
}

export type WorkerMsgHandler = (msgToWorker: MsgToWorker) => Promise<any>;

export interface WorkerTask {
  taskId: number;
  method: string;
  args: any[];
  resolve: (val: any) => any;
  reject: (msg: string) => any;
  retries: number;
  isLongRunningTask: boolean;
  workerKey: string;
}

export interface WorkerMessage {
  taskId?: number;
  method?: string;
  args?: any[];
  value?: any;
  error?: string;
  exit?: boolean;
}

export type WorkerRunner = (methodName: string, args: any[]) => Promise<any>;

export interface WorkerRunnerOptions {
  isLongRunningTask?: boolean;
  workerKey?: string;
}

export interface WorkerContext {
  tsHost?: any;
  tsProgram?: any;
}

export interface BuildCtx {
  buildId: number;
  buildResults: CompilerBuildResults;
  buildStats?: CompilerBuildStats | { diagnostics: Diagnostic[] };
  buildMessages: string[];
  bundleBuildCount: number;
  collections: Collection[];
  compilerCtx: CompilerCtx;
  esmBrowserComponentBundle: ReadonlyArray<BundleModule>;
  esmComponentBundle: ReadonlyArray<BundleModule>;
  es5ComponentBundle: ReadonlyArray<BundleModule>;
  systemComponentBundle: ReadonlyArray<BundleModule>;
  commonJsComponentBundle: ReadonlyArray<BundleModule>;
  components: ComponentCompilerMeta[];
  componentGraph: Map<string, string[]>;
  config: Config;
  createTimeSpan(msg: string, debug?: boolean): LoggerTimeSpan;
  data: any;
  debug: (msg: string) => void;
  diagnostics: Diagnostic[];
  dirsAdded: string[];
  dirsDeleted: string[];
  entryModules: EntryModule[];
  filesAdded: string[];
  filesChanged: string[];
  filesDeleted: string[];
  filesUpdated: string[];
  filesWritten: string[];
  globalStyle: string | undefined;
  hasConfigChanges: boolean;
  hasError: boolean;
  hasFinished: boolean;
  hasHtmlChanges: boolean;
  hasPrintedResults: boolean;
  hasServiceWorkerChanges: boolean;
  hasScriptChanges: boolean;
  hasStyleChanges: boolean;
  hasWarning: boolean;
  hydrateAppFilePath: string;
  indexBuildCount: number;
  indexDoc: Document;
  isRebuild: boolean;
  moduleFiles: Module[];
  packageJson: PackageJsonData;
  pendingCopyTasks: Promise<CopyResults>[];
  progress(task: BuildTask): void;
  requiresFullBuild: boolean;
  rollupResults?: RollupResults;
  scriptsAdded: string[];
  scriptsDeleted: string[];
  startTime: number;
  styleBuildCount: number;
  stylesPromise: Promise<void>;
  stylesUpdated: BuildStyleUpdate[];
  timeSpan: LoggerTimeSpan;
  timestamp: string;
  transpileBuildCount: number;
  validateTypesBuild?(): Promise<void>;
  validateTypesHandler?: (results: any) => Promise<void>;
  validateTypesPromise?: Promise<any>;
}


/**
 * Input CSS to be transformed into ESM
 */
export interface TransformCssToEsmInput {
  input: string;
  module?: 'cjs' | 'esm' | string;
  file?: string;
  tag?: string;
  encapsulation?: string;
  mode?: string;
  commentOriginalSelector?: boolean;
  sourceMap?: boolean;
  minify?: boolean;
  docs?: boolean;
  autoprefixer?: any;
  styleImportData?: string;
}

export interface TransformCssToEsmOutput {
  styleText: string;
  output: string;
  map: any;
  diagnostics: Diagnostic[];
  defaultVarName: string;
  styleDocs: StyleDoc[];
  imports: { varName: string; importPath: string }[];
}


