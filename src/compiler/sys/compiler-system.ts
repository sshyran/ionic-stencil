import { Logger } from './logger/logger'
import { Diagnostic } from './logger/diagnostic'

export interface CopyTask {
  src: string;
  dest?: string;
  warn?: boolean;
  keepDirStructure?: boolean;
}

export interface BuildOutput {
  type: string;
  files: string[];
}

export interface LazyRequire {
  ensure(fromDir: string, moduleIds: string[]): Promise<Diagnostic[]>;
  require(fromDir: string, moduleId: string): any;
  getModulePath(fromDir: string, moduleId: string): string;
}
export type CompilerFileWatcherCallback = (fileName: string, eventKind: CompilerFileWatcherEvent) => void;


export interface CompilerFileWatcher {
  close(): void | Promise<void>;
}


export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}
export interface ResolveModuleIdOptions {
  moduleId: string;
  containingFile?: string;
  exts?: string[];
  packageFilter?: (pkg: any) => void;
}

export interface ResolveModuleIdResults {
  moduleId: string;
  resolveId: string;
  pkgData: { name: string; version: string; [key: string]: any };
  pkgDirPath: string;
}

export interface CompilerFsStats {
  /**
   * If it's a directory. `false` if there was an error.
   */
  isDirectory: boolean;
  /**
   * If it's a file. `false` if there was an error.
   */
  isFile: boolean;
  /**
   * If it's a symlink. `false` if there was an error.
   */
  isSymbolicLink: boolean;
  /**
   * The size of the file in bytes. `0` for directories or if there was an error.
   */
  size: number;
  /**
   * The timestamp indicating the last time this file was modified expressed in milliseconds since the POSIX Epoch.
   */
  mtimeMs?: number;
  /**
   * Error if there was one, otherwise `null`. `stat` and `statSync` do not throw errors but always returns this interface.
   */
  error: any;
}



export interface PlatformPath {
  normalize(p: string): string;
  join(...paths: string[]): string;
  resolve(...pathSegments: string[]): string;
  isAbsolute(p: string): boolean;
  relative(from: string, to: string): string;
  dirname(p: string): string;
  basename(p: string, ext?: string): string;
  extname(p: string): string;
  parse(p: string): ParsedPath;
  sep: string;
  delimiter: string;
  posix: any;
  win32: any;
}



export interface CompilerSystemCreateDirectoryOptions {
  /**
   * Indicates whether parent directories should be created.
   * @default false
   */
  recursive?: boolean;
  /**
   * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
   * @default 0o777.
   */
  mode?: number;
}

export interface WorkerMainController {
  send(...args: any[]): Promise<any>;
  handler(name: string): (...args: any[]) => Promise<any>;
  destroy(): void;
  maxWorkers: number;
}


export interface CopyResults {
  diagnostics: Diagnostic[];
  filePaths: string[];
  dirPaths: string[];
}

export interface CompilerSystemCreateDirectoryResults {
  basename: string;
  dirname: string;
  path: string;
  newDirs: string[];
  error: any;
}

export interface CompilerSystemRemoveDirectoryOptions {
  /**
   * Indicates whether child files and subdirectories should be removed.
   * @default false
   */
  recursive?: boolean;
}

export interface CompilerSystemRemoveDirectoryResults {
  basename: string;
  dirname: string;
  path: string;
  removedDirs: string[];
  removedFiles: string[];
  error: any;
}

export interface CompilerSystemRenameResults extends CompilerSystemRenamedPath {
  renamed: CompilerSystemRenamedPath[];
  oldDirs: string[];
  oldFiles: string[];
  newDirs: string[];
  newFiles: string[];
  error: any;
}

export interface CompilerSystemRenamedPath {
  oldPath: string;
  newPath: string;
  isFile: boolean;
  isDirectory: boolean;
}

export interface CompilerSystemRealpathResults {
  path: string;
  error: any;
}

export interface CompilerSystemRemoveFileResults {
  basename: string;
  dirname: string;
  path: string;
  error: any;
}

export interface CompilerSystemWriteFileResults {
  path: string;
  error: any;
}
export interface CompilerBuildResults {
  buildId: number;
  componentGraph?: BuildResultsComponentGraph;
  diagnostics: Diagnostic[];
  dirsAdded: string[];
  dirsDeleted: string[];
  duration: number;
  filesAdded: string[];
  filesChanged: string[];
  filesDeleted: string[];
  filesUpdated: string[];
  hasError: boolean;
  hasSuccessfulBuild: boolean;
  hmr?: HotModuleReplacement;
  hydrateAppFilePath?: string;
  isRebuild: boolean;
  namespace: string;
  outputs: BuildOutput[];
  rootDir: string;
  srcDir: string;
  timestamp: string;
}
export interface HotModuleReplacement {
  componentsUpdated?: string[];
  excludeHmr?: string[];
  externalStylesUpdated?: string[];
  imagesUpdated?: string[];
  indexHtmlUpdated?: boolean;
  inlineStylesUpdated?: HmrStyleUpdate[];
  reloadStrategy: PageReloadStrategy;
  scriptsAdded?: string[];
  scriptsDeleted?: string[];
  serviceWorkerUpdated?: boolean;
  versionId?: string;
}

export interface HmrStyleUpdate {
  styleId: string;
  styleTag: string;
  styleText: string;
}

export interface BuildResultsComponentGraph {
  [scopeId: string]: string[];
}


export type PageReloadStrategy = 'hmr' | 'pageReload' | null;

export type CompilerFileWatcherEvent =
  | CompilerEventFileAdd
  | CompilerEventFileDelete
  | CompilerEventFileUpdate
  | CompilerEventDirAdd
  | CompilerEventDirDelete;

export type CompilerEventName =
  | CompilerEventFsChange
  | CompilerEventFileUpdate
  | CompilerEventFileAdd
  | CompilerEventFileDelete
  | CompilerEventDirAdd
  | CompilerEventDirDelete
  | CompilerEventBuildStart
  | CompilerEventBuildFinish
  | CompilerEventBuildNoChange
  | CompilerEventBuildLog;

export type CompilerEventFsChange = 'fsChange';
export type CompilerEventFileUpdate = 'fileUpdate';
export type CompilerEventFileAdd = 'fileAdd';
export type CompilerEventFileDelete = 'fileDelete';
export type CompilerEventDirAdd = 'dirAdd';
export type CompilerEventDirDelete = 'dirDelete';
export type CompilerEventBuildStart = 'buildStart';
export type CompilerEventBuildFinish = 'buildFinish';
export type CompilerEventBuildLog = 'buildLog';
export type CompilerEventBuildNoChange = 'buildNoChange';


export type BuildOnEventRemove = () => boolean;

export interface CompilerBuildStart {
  buildId: number;
  timestamp: string;
}

export interface BuildLog {
  buildId: number;
  messages: string[];
  progress: number;
}


export interface BuildNoChangeResults {
  buildId: number;
  noChange: boolean;
}

export interface FsWatchResults {
  dirsAdded: string[];
  dirsDeleted: string[];
  filesUpdated: string[];
  filesAdded: string[];
  filesDeleted: string[];
}



export interface BuildOnEvents {
  on(cb: (eventName: CompilerEventName, data: any) => void): BuildOnEventRemove;

  on(eventName: CompilerEventFileAdd, cb: (path: string) => void): BuildOnEventRemove;
  on(eventName: CompilerEventFileDelete, cb: (path: string) => void): BuildOnEventRemove;
  on(eventName: CompilerEventFileUpdate, cb: (path: string) => void): BuildOnEventRemove;

  on(eventName: CompilerEventDirAdd, cb: (path: string) => void): BuildOnEventRemove;
  on(eventName: CompilerEventDirDelete, cb: (path: string) => void): BuildOnEventRemove;

  on(eventName: CompilerEventBuildStart, cb: (buildStart: CompilerBuildStart) => void): BuildOnEventRemove;
  on(eventName: CompilerEventBuildFinish, cb: (buildResults: CompilerBuildResults) => void): BuildOnEventRemove;
  on(eventName: CompilerEventBuildLog, cb: (buildLog: BuildLog) => void): BuildOnEventRemove;
  on(eventName: CompilerEventBuildNoChange, cb: () => void): BuildOnEventRemove;
}

export interface BuildEmitEvents {
  emit(eventName: CompilerEventFileAdd, path: string): void;
  emit(eventName: CompilerEventFileDelete, path: string): void;
  emit(eventName: CompilerEventFileUpdate, path: string): void;

  emit(eventName: CompilerEventDirAdd, path: string): void;
  emit(eventName: CompilerEventDirDelete, path: string): void;

  emit(eventName: CompilerEventBuildStart, buildStart: CompilerBuildStart): void;
  emit(eventName: CompilerEventBuildFinish, buildResults: CompilerBuildResults): void;
  emit(eventName: CompilerEventBuildNoChange, buildNoChange: BuildNoChangeResults): void;
  emit(eventName: CompilerEventBuildLog, buildLog: BuildLog): void;

  emit(eventName: CompilerEventFsChange, fsWatchResults: FsWatchResults): void;
}
export interface SystemDetails {
  cpuModel: string;
  freemem(): number;
  platform: 'darwin' | 'windows' | 'linux' | '';
  release: string;
  totalmem: number;
}
export interface CompilerDependency {
  name: string;
  version: string;
  main: string;
  resources?: string[];
}


export interface BuildEvents extends BuildOnEvents, BuildEmitEvents {
  unsubscribeAll(): void;
}

/**
 * Common system used by the compiler. All file reads, writes, access, etc. will all use
 * this system. Additionally, throughout each build, the compiler will use an internal
 * in-memory file system as to prevent unnecessary fs reads and writes. At the end of each
 * build all actions the in-memory fs performed will be written to disk using this system.
 * A NodeJS based system will use APIs such as `fs` and `crypto`, and a web-based system
 * will use in-memory Maps and browser APIs. Either way, the compiler itself is unaware
 * of the actual platform it's being ran on top of.
 */
export interface CompilerSystem {
  name: 'node' | 'in-memory';
  version: string;
  events?: BuildEvents;
  details?: SystemDetails;
  /**
   * Add a callback which will be ran when destroy() is called.
   */
  addDestory(cb: () => void): void;
  /**
   * Always returns a boolean, does not throw.
   */
  access(p: string): Promise<boolean>;
  /**
   * SYNC! Always returns a boolean, does not throw.
   */
  accessSync(p: string): boolean;
  applyGlobalPatch?(fromDir: string): Promise<void>;
  applyPrerenderGlobalPatch?(opts: { devServerHostUrl: string; window: any }): void;
  cacheStorage?: CacheStorage;
  checkVersion?: (logger: Logger, currentVersion: string) => Promise<() => void>;
  copy?(copyTasks: Required<CopyTask>[], srcDir: string): Promise<CopyResults>;
  /**
   * Always returns a boolean if the files were copied or not. Does not throw.
   */
  copyFile(src: string, dst: string): Promise<boolean>;
  /**
   * Used to destroy any listeners, file watchers or child processes.
   */
  destroy(): Promise<void>;
  /**
   * Does not throw.
   */
  createDir(p: string, opts?: CompilerSystemCreateDirectoryOptions): Promise<CompilerSystemCreateDirectoryResults>;
  /**
   * SYNC! Does not throw.
   */
  createDirSync(p: string, opts?: CompilerSystemCreateDirectoryOptions): CompilerSystemCreateDirectoryResults;
  homeDir(): string;
  /**
   * Used to determine if the current context of the terminal is TTY.
   */
  isTTY(): boolean;
  /**
   * Each platform as a different way to dynamically import modules.
   */
  dynamicImport?(p: string): Promise<any>;
  /**
   * Creates the worker controller for the current system.
   */
  createWorkerController?(maxConcurrentWorkers: number): WorkerMainController;
  encodeToBase64(str: string): string;
  ensureDependencies?(opts: {
    rootDir: string;
    logger: Logger;
    dependencies: CompilerDependency[];
  }): Promise<{ stencilPath: string; diagnostics: Diagnostic[] }>;
  ensureResources?(opts: { rootDir: string; logger: Logger; dependencies: CompilerDependency[] }): Promise<void>;
  /**
   * process.exit()
   */
  exit(exitCode: number): Promise<void>;
  /**
   * Optionally provide a fetch() function rather than using the built-in fetch().
   * First arg is a url string or Request object (RequestInfo).
   * Second arg is the RequestInit. Returns the Response object
   */
  fetch?(input: string | any, init?: any): Promise<any>;
  /**
   * Generates a sha1 digest encoded as HEX
   */
  generateContentHash?(content: string | any, length?: number): Promise<string>;
  /**
   * Generates a sha1 digest encoded as HEX from a file path
   */
  generateFileHash?(filePath: string | any, length?: number): Promise<string>;
  /**
   * Get the current directory.
   */
  getCurrentDirectory(): string;
  /**
   * The compiler's executing path.
   */
  getCompilerExecutingPath(): string;
  /**
   * The dev server's executing path.
   */
  getDevServerExecutingPath?(): string;
  getEnvironmentVar?(key: string): string;
  /**
   * Gets the absolute file path when for a dependency module.
   */
  getLocalModulePath(opts: { rootDir: string; moduleId: string; path: string }): string;
  /**
   * Gets the full url when requesting a dependency module to fetch from a CDN.
   */
  getRemoteModuleUrl(opts: { moduleId: string; path?: string; version?: string }): string;
  /**
   * Aync glob task. Only available in NodeJS compiler system.
   */
  glob?(pattern: string, options: { cwd?: string; nodir?: boolean; [key: string]: any }): Promise<string[]>;
  /**
   * The number of logical processors available to run threads on the user's computer (cpus).
   */
  hardwareConcurrency: number;
  /**
   * Tests if the path is a symbolic link or not. Always resolves a boolean. Does not throw.
   */
  isSymbolicLink(p: string): Promise<boolean>;
  lazyRequire?: LazyRequire;
  nextTick(cb: () => void): void;
  /**
   * Normalize file system path.
   */
  normalizePath(p: string): string;
  onProcessInterrupt?(cb: () => void): void;
  parseYarnLockFile?: (content: string) => {
    type: 'success' | 'merge' | 'conflict';
    object: any;
  };
  platformPath: PlatformPath;
  /**
   * All return paths are full normalized paths, not just the basenames. Always returns an array, does not throw.
   */
  readDir(p: string): Promise<string[]>;
  /**
   * SYNC! All return paths are full normalized paths, not just the basenames. Always returns an array, does not throw.
   */
  readDirSync(p: string): string[];
  /**
   * Returns undefined if file is not found. Does not throw.
   */
  readFile(p: string): Promise<string>;
  readFile(p: string, encoding: 'utf8'): Promise<string>;
  readFile(p: string, encoding: 'binary'): Promise<any>;
  /**
   * SYNC! Returns undefined if file is not found. Does not throw.
   */
  readFileSync(p: string, encoding?: string): string;
  /**
   * Does not throw.
   */
  realpath(p: string): Promise<CompilerSystemRealpathResults>;
  /**
   * SYNC! Does not throw.
   */
  realpathSync(p: string): CompilerSystemRealpathResults;
  /**
   * Remove a callback which will be ran when destroy() is called.
   */
  removeDestory(cb: () => void): void;
  /**
   * Rename old path to new path. Does not throw.
   */
  rename(oldPath: string, newPath: string): Promise<CompilerSystemRenameResults>;
  resolveModuleId?(opts: ResolveModuleIdOptions): Promise<ResolveModuleIdResults>;
  resolvePath(p: string): string;
  /**
   * Does not throw.
   */
  removeDir(p: string, opts?: CompilerSystemRemoveDirectoryOptions): Promise<CompilerSystemRemoveDirectoryResults>;
  /**
   * SYNC! Does not throw.
   */
  removeDirSync(p: string, opts?: CompilerSystemRemoveDirectoryOptions): CompilerSystemRemoveDirectoryResults;
  /**
   * Does not throw.
   */
  removeFile(p: string): Promise<CompilerSystemRemoveFileResults>;
  /**
   * SYNC! Does not throw.
   */
  removeFileSync(p: string): CompilerSystemRemoveFileResults;
  setupCompiler?: (c: { ts: any }) => void;

  /**
   * Always returns an object. Does not throw. Check for "error" property if there's an error.
   */
  stat(p: string): Promise<CompilerFsStats>;
  /**
   * SYNC! Always returns an object. Does not throw. Check for "error" property if there's an error.
   */
  statSync(p: string): CompilerFsStats;
  tmpDirSync(): string;
  watchDirectory?(p: string, callback: CompilerFileWatcherCallback, recursive?: boolean): CompilerFileWatcher;
  watchFile?(p: string, callback: CompilerFileWatcherCallback): CompilerFileWatcher;
  /**
   * How many milliseconds to wait after a change before calling watch callbacks.
   */
  watchTimeout?: number;
  /**
   * Does not throw.
   */
  writeFile(p: string, content: string): Promise<CompilerSystemWriteFileResults>;
  /**
   * SYNC! Does not throw.
   */
  writeFileSync(p: string, content: string): CompilerSystemWriteFileResults;
}
