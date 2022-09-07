import { isFunction, isPromise, normalizePath } from '@utils';
import { parse as parseYarnLockFile } from '@yarnpkg/lockfile';
import { createHash } from 'crypto';
import exit from 'exit';
import fs from 'graceful-fs';
import { cpus, freemem, platform, release, tmpdir, totalmem } from 'os';
import * as os from 'os';
import path from 'path';
import type TypeScript from 'typescript';

import { buildEvents } from '../../compiler/events';
import type {
  CompilerSystem,
  CompilerSystemCreateDirectoryResults,
  CompilerSystemRealpathResults,
  CompilerSystemRemoveFileResults,
  CompilerSystemWriteFileResults,
} from '../../declarations';
import { asyncGlob, nodeCopyTasks } from './node-copy-tasks';
import { NodeLazyRequire } from './node-lazy-require';
import { NodeResolveModule } from './node-resolve-module';
import { checkVersion } from './node-stencil-version-checker';
import { NodeWorkerController } from './node-worker-controller';

export function createNodeSys(c: { process?: any } = {}) {
  const prcs: NodeJS.Process = c.process || global.process;
  const destroys = new Set<() => Promise<void> | void>();
  const onInterruptsCallbacks: (() => void)[] = [];

  const sysCpus = cpus();
  const hardwareConcurrency = sysCpus.length;
  const osPlatform = platform();

  const compilerExecutingPath = path.join(__dirname, '..', '..', 'compiler', 'stencil.js');
  const devServerExecutingPath = path.join(__dirname, '..', '..', 'dev-server', 'index.js');

  const runInterruptsCallbacks = () => {
    const promises: Promise<any>[] = [];
    let cb: () => any;
    while (isFunction((cb = onInterruptsCallbacks.pop()))) {
      try {
        const rtn = cb();
        if (isPromise(rtn)) {
          promises.push(rtn);
        }
      } catch (e) {}
    }
    if (promises.length > 0) {
      return Promise.all(promises);
    }
    return null;
  };

  const sys: CompilerSystem = {
    access(p) {
      return new Promise((resolve) => {
        fs.access(p, (err) => resolve(!err));
      });
    },
    accessSync(p) {
      let hasAccess = false;
      try {
        fs.accessSync(p);
        hasAccess = true;
      } catch (e) {}
      return hasAccess;
    },
    addDestory(cb) {
      destroys.add(cb);
    },
    applyPrerenderGlobalPatch(opts) {
      if (typeof global.fetch !== 'function') {
        const nodeFetch = require(path.join(__dirname, 'node-fetch.js'));

        global.fetch = (input: any, init: any) => {
          if (typeof input === 'string') {
            // fetch(url) w/ url string
            const urlStr = new URL(input, opts.devServerHostUrl).href;
            return nodeFetch.fetch(urlStr, init);
          } else {
            // fetch(Request) w/ request object
            input.url = new URL(input.url, opts.devServerHostUrl).href;
            return nodeFetch.fetch(input, init);
          }
        };

        global.Headers = nodeFetch.Headers;
        global.Request = nodeFetch.Request;
        global.Response = nodeFetch.Response;
        (global as any).FetchError = nodeFetch.FetchError;
      }

      opts.window.fetch = global.fetch;
      opts.window.Headers = global.Headers;
      opts.window.Request = global.Request;
      opts.window.Response = global.Response;
      opts.window.FetchError = (global as any).FetchError;
    },
    checkVersion,
    copy: nodeCopyTasks,
    copyFile(src, dst) {
      return new Promise((resolve) => {
        fs.copyFile(src, dst, (err) => {
          resolve(!err);
        });
      });
    },
    createDir(p, opts) {
      return new Promise((resolve) => {
        if (opts) {
          fs.mkdir(p, opts, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              error: err,
              newDirs: [],
              path: p,
            });
          });
        } else {
          fs.mkdir(p, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              error: err,
              newDirs: [],
              path: p,
            });
          });
        }
      });
    },
    createDirSync(p, opts) {
      const results: CompilerSystemCreateDirectoryResults = {
        basename: path.basename(p),
        dirname: path.dirname(p),
        error: null,
        newDirs: [],
        path: p,
      };
      try {
        fs.mkdirSync(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    createWorkerController(maxConcurrentWorkers) {
      const forkModulePath = path.join(__dirname, 'worker.js');
      return new NodeWorkerController(forkModulePath, maxConcurrentWorkers);
    },
    async destroy() {
      const waits: Promise<void>[] = [];
      destroys.forEach((cb) => {
        try {
          const rtn = cb();
          if (rtn && rtn.then) {
            waits.push(rtn);
          }
        } catch (e) {
          console.error(`node sys destroy: ${e}`);
        }
      });
      if (waits.length > 0) {
        await Promise.all(waits);
      }
      destroys.clear();
    },
    details: {
      cpuModel: (Array.isArray(sysCpus) && sysCpus.length > 0 ? sysCpus[0] && sysCpus[0].model : '') || '',
      freemem() {
        return freemem();
      },
      platform:
        osPlatform === 'darwin' || osPlatform === 'linux' ? osPlatform : osPlatform === 'win32' ? 'windows' : '',
      release: release(),
      totalmem: totalmem(),
    },
    dynamicImport(p) {
      return Promise.resolve(require(p));
    },
    encodeToBase64(str) {
      return Buffer.from(str).toString('base64');
    },
    async ensureDependencies() {
      return {
        diagnostics: [],
        stencilPath: sys.getCompilerExecutingPath(),
      };
    },
    async ensureResources() {},
    exit: async (exitCode) => {
      await runInterruptsCallbacks();
      exit(exitCode);
    },
    fetch: (input: any, init: any) => {
      const nodeFetch = require(path.join(__dirname, 'node-fetch.js'));

      if (typeof input === 'string') {
        // fetch(url) w/ url string
        const urlStr = new URL(input).href;
        return nodeFetch.fetch(urlStr, init);
      } else {
        // fetch(Request) w/ request object
        input.url = new URL(input.url).href;
        return nodeFetch.fetch(input, init);
      }
    },
    generateContentHash(content, length) {
      let hash = createHash('sha1').update(content).digest('hex').toLowerCase();
      if (typeof length === 'number') {
        hash = hash.slice(0, length);
      }
      return Promise.resolve(hash);
    },
    generateFileHash(filePath, length) {
      return new Promise((resolve, reject) => {
        const h = createHash('sha1');
        fs.createReadStream(filePath)
          .on('error', (err) => reject(err))
          .on('data', (data) => h.update(data))
          .on('end', () => {
            let hash = h.digest('hex').toLowerCase();
            if (typeof length === 'number') {
              hash = hash.slice(0, length);
            }
            resolve(hash);
          });
      });
    },
    getCompilerExecutingPath() {
      return compilerExecutingPath;
    },
    getCurrentDirectory() {
      return normalizePath(prcs.cwd());
    },
    getDevServerExecutingPath() {
      return devServerExecutingPath;
    },
    getEnvironmentVar(key) {
      return process.env[key];
    },
    getLocalModulePath() {
      return null;
    },
    getRemoteModuleUrl() {
      return null;
    },
    glob: asyncGlob,
    hardwareConcurrency,
    homeDir() {
      try {
        return os.homedir();
      } catch (e) {}
      return undefined;
    },
    isSymbolicLink(p: string) {
      return new Promise<boolean>((resolve) => {
        try {
          fs.lstat(p, (err, stats) => {
            if (err) {
              resolve(false);
            } else {
              resolve(stats.isSymbolicLink());
            }
          });
        } catch (e) {
          resolve(false);
        }
      });
    },
    isTTY() {
      return !!process?.stdout?.isTTY;
    },
    name: 'node',
    nextTick: prcs.nextTick,
    normalizePath,
    onProcessInterrupt: (cb) => {
      if (!onInterruptsCallbacks.includes(cb)) {
        onInterruptsCallbacks.push(cb);
      }
    },
    parseYarnLockFile(content: string) {
      return parseYarnLockFile(content);
    },
    platformPath: path,
    readDir(p) {
      return new Promise((resolve) => {
        fs.readdir(p, (err, files) => {
          if (err) {
            resolve([]);
          } else {
            resolve(
              files.map((f) => {
                return normalizePath(path.join(p, f));
              })
            );
          }
        });
      });
    },
    readDirSync(p) {
      try {
        return fs.readdirSync(p).map((f) => {
          return normalizePath(path.join(p, f));
        });
      } catch (e) {}
      return [];
    },
    readFile(p: string, encoding?: string) {
      if (encoding === 'binary') {
        return new Promise<any>((resolve) => {
          fs.readFile(p, (_, data) => {
            resolve(data);
          });
        });
      }
      return new Promise<string>((resolve) => {
        fs.readFile(p, 'utf8', (_, data) => {
          resolve(data);
        });
      });
    },
    readFileSync(p) {
      try {
        return fs.readFileSync(p, 'utf8');
      } catch (e) {}
      return undefined;
    },
    realpath(p) {
      return new Promise((resolve) => {
        fs.realpath(p, 'utf8', (e, data) => {
          resolve({
            error: e,
            path: data,
          });
        });
      });
    },
    realpathSync(p) {
      const results: CompilerSystemRealpathResults = {
        error: null,
        path: undefined,
      };
      try {
        results.path = fs.realpathSync(p, 'utf8');
      } catch (e) {
        results.error = e;
      }
      return results;
    },

    removeDestory(cb) {
      destroys.delete(cb);
    },
    removeDir(p, opts) {
      return new Promise((resolve) => {
        const recursive = !!(opts && opts.recursive);
        if (recursive) {
          fs.rmdir(p, { recursive: true }, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              error: err,
              path: p,
              removedDirs: [],
              removedFiles: [],
            });
          });
        } else {
          fs.rmdir(p, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              error: err,
              path: p,
              removedDirs: [],
              removedFiles: [],
            });
          });
        }
      });
    },
    removeDirSync(p, opts) {
      try {
        const recursive = !!(opts && opts.recursive);
        if (recursive) {
          fs.rmdirSync(p, { recursive: true });
        } else {
          fs.rmdirSync(p);
        }
        return {
          basename: path.basename(p),
          dirname: path.dirname(p),
          error: null,
          path: p,
          removedDirs: [],
          removedFiles: [],
        };
      } catch (e) {
        return {
          basename: path.basename(p),
          dirname: path.dirname(p),
          error: e,
          path: p,
          removedDirs: [],
          removedFiles: [],
        };
      }
    },
    removeFile(p) {
      return new Promise((resolve) => {
        fs.unlink(p, (err) => {
          resolve({
            basename: path.basename(p),
            dirname: path.dirname(p),
            error: err,
            path: p,
          });
        });
      });
    },
    removeFileSync(p) {
      const results: CompilerSystemRemoveFileResults = {
        basename: path.basename(p),
        dirname: path.dirname(p),
        error: null,
        path: p,
      };
      try {
        fs.unlinkSync(p);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    rename(oldPath, newPath) {
      return new Promise((resolve) => {
        fs.rename(oldPath, newPath, (error) => {
          resolve({
            error,
            isDirectory: false,
            isFile: false,
            newDirs: [],
            newFiles: [],
            newPath,
            oldDirs: [],
            oldFiles: [],
            oldPath,
            renamed: [],
          });
        });
      });
    },
    resolvePath(p) {
      return normalizePath(p);
    },
    setupCompiler(c) {
      const ts: typeof TypeScript = c.ts;
      const tsSysWatchDirectory = ts.sys.watchDirectory;
      const tsSysWatchFile = ts.sys.watchFile;

      sys.watchTimeout = 80;

      sys.events = buildEvents();

      sys.watchDirectory = (p, callback, recursive) => {
        const tsFileWatcher = tsSysWatchDirectory(
          p,
          (fileName) => {
            callback(normalizePath(fileName), 'fileUpdate');
          },
          recursive
        );

        const close = () => {
          tsFileWatcher.close();
        };

        sys.addDestory(close);

        return {
          close() {
            sys.removeDestory(close);
            tsFileWatcher.close();
          },
        };
      };

      sys.watchFile = (p, callback) => {
        const tsFileWatcher = tsSysWatchFile(p, (fileName, tsEventKind) => {
          fileName = normalizePath(fileName);
          if (tsEventKind === ts.FileWatcherEventKind.Created) {
            callback(fileName, 'fileAdd');
            sys.events.emit('fileAdd', fileName);
          } else if (tsEventKind === ts.FileWatcherEventKind.Changed) {
            callback(fileName, 'fileUpdate');
            sys.events.emit('fileUpdate', fileName);
          } else if (tsEventKind === ts.FileWatcherEventKind.Deleted) {
            callback(fileName, 'fileDelete');
            sys.events.emit('fileDelete', fileName);
          }
        });

        const close = () => {
          tsFileWatcher.close();
        };
        sys.addDestory(close);

        return {
          close() {
            sys.removeDestory(close);
            tsFileWatcher.close();
          },
        };
      };
    },
    stat(p) {
      return new Promise((resolve) => {
        fs.stat(p, (err, fsStat) => {
          if (err) {
            resolve({
              error: err,
              isDirectory: false,
              isFile: false,
              isSymbolicLink: false,
              mtimeMs: 0,
              size: 0,
            });
          } else {
            resolve({
              error: null,
              isDirectory: fsStat.isDirectory(),
              isFile: fsStat.isFile(),
              isSymbolicLink: fsStat.isSymbolicLink(),
              mtimeMs: fsStat.mtimeMs,
              size: fsStat.size,
            });
          }
        });
      });
    },
    statSync(p) {
      try {
        const fsStat = fs.statSync(p);
        return {
          error: null,
          isDirectory: fsStat.isDirectory(),
          isFile: fsStat.isFile(),
          isSymbolicLink: fsStat.isSymbolicLink(),
          mtimeMs: fsStat.mtimeMs,
          size: fsStat.size,
        };
      } catch (e) {
        return {
          error: e,
          isDirectory: false,
          isFile: false,
          isSymbolicLink: false,
          mtimeMs: 0,
          size: 0,
        };
      }
    },
    tmpDirSync() {
      return tmpdir();
    },
    version: prcs.versions.node,
    writeFile(p, content) {
      return new Promise((resolve) => {
        fs.writeFile(p, content, (err) => {
          resolve({ error: err, path: p });
        });
      });
    },
    writeFileSync(p, content) {
      const results: CompilerSystemWriteFileResults = {
        error: null,
        path: p,
      };
      try {
        fs.writeFileSync(p, content);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
  };

  const nodeResolve = new NodeResolveModule();

  sys.lazyRequire = new NodeLazyRequire(nodeResolve, {
    // eslint-disable-next-line sort-keys -- keep these in logical order
    '@types/jest': { minVersion: '24.9.1', recommendedVersion: '27.0.3', maxVersion: '27.0.0' },
    // eslint-disable-next-line sort-keys -- keep these in logical order
    jest: { minVersion: '24.9.1', recommendedVersion: '27.0.3', maxVersion: '27.0.0' },
    // eslint-disable-next-line sort-keys -- keep these in logical order
    'jest-cli': { minVersion: '24.9.0', recommendedVersion: '27.4.5', maxVersion: '27.0.0' },
    pixelmatch: { minVersion: '4.0.2', recommendedVersion: '4.0.2' },
    puppeteer: { minVersion: '1.19.0', recommendedVersion: '10.0.0' },
    'puppeteer-core': { minVersion: '1.19.0', recommendedVersion: '5.2.1' },
    'workbox-build': { minVersion: '4.3.1', recommendedVersion: '4.3.1' },
  });

  prcs.on('SIGINT', runInterruptsCallbacks);
  prcs.on('exit', runInterruptsCallbacks);

  return sys;
}
