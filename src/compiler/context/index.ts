import { Diagnostic } from '../sys/logger/logger'

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


