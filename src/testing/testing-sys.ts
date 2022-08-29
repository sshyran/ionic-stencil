import type { CompilerSystem } from '@stencil/core/internal';
import { createSystem } from '../compiler/sys/stencil-sys';
import { createHash } from 'crypto';
import path from 'path';

/**
 * TODO
 */
export interface TestingSystem extends CompilerSystem {
  diskReads: number;
  diskWrites: number;
}

/**
 * Type guard for determining if a provided `CompilerSystem` is a `TestingSystem`
 * @param sys the `CompilerSystem` to evaluate
 * @returns true if the provided `CompilerSystem` is a `TestingSystem`, false otherwise
 */
function isTestingSystem(sys: CompilerSystem): sys is TestingSystem {
  return 'diskReads' in sys && 'diskWrites' in sys;
}

/**
 * TODO
 * @returns
 */
export const createTestingSystem = (): TestingSystem => {
  let diskReads = 0;
  let diskWrites = 0;
  const sys = createSystem();

  sys.platformPath = path;

  sys.generateContentHash = (content, length) => {
    let hash = createHash('sha1').update(content).digest('hex').toLowerCase();

    if (typeof length === 'number') {
      hash = hash.slice(0, length);
    }
    return Promise.resolve(hash);
  };

  /**
   * Wraps a function that performs read operations on the provided function.
   *
   * The wrapped function will be called with its provided arguments (I.E. it retains its original functionality). In
   * addition to the original functionality, the returned function will increment the `diskReads` property on an
   * instance of `TestingSystem`.
   *
   * It is at the discretion of the user of this function to determine if the provided function performs a read
   * operation. No compile-time nor run-time checks occur to verify that a read operation occurs on `fn`
   *
   * @param fn the function to wrap
   * @returns a new function that wraps the provided one and keeps track of the number of read operations that occurred
   */
  const wrapRead = (fn: (...args: any[]) => any): typeof fn => {
    const orgFn = fn;
    return (...args: any[]) => {
      diskReads++;
      return orgFn.apply(orgFn, args);
    };
  };

  /**
   * Wraps a function that performs write operations on the provided function.
   *
   * The wrapped function will be called with its provided arguments (I.E. it retains its original functionality). In
   * addition to the original functionality, the returned function will increment the `diskWrites` property on an
   * instance of `TestingSystem`.
   *
   * It is at the discretion of the user of this function to determine if the provided function performs a write
   * operation. No compile-time nor run-time checks occur to verify that a write operation occurs on `fn`
   *
   * @param fn the function to wrap
   * @returns a new function that wraps the provided one and keeps track of the number of write operations that occurred
   */
  const wrapWrite = (fn: (...args: any[]) => any): typeof fn => {
    const orgFn = fn;
    return (...args: any[]) => {
      diskWrites++;
      return orgFn.apply(orgFn, args);
    };
  };

  sys.access = wrapRead(sys.access);
  sys.accessSync = wrapRead(sys.accessSync);
  sys.homeDir = wrapRead(sys.homeDir);
  sys.readFile = wrapRead(sys.readFile);
  sys.readFileSync = wrapRead(sys.readFileSync);
  sys.readDir = wrapRead(sys.readDir);
  sys.readDirSync = wrapRead(sys.readDirSync);
  sys.stat = wrapRead(sys.stat);
  sys.statSync = wrapRead(sys.statSync);

  sys.copyFile = wrapWrite(sys.copyFile);
  sys.createDir = wrapWrite(sys.createDir);
  sys.createDirSync = wrapWrite(sys.createDirSync);
  sys.removeFile = wrapWrite(sys.removeFile);
  sys.removeFileSync = wrapWrite(sys.removeFileSync);
  sys.writeFile = wrapWrite(sys.writeFile);
  sys.writeFileSync = wrapWrite(sys.writeFileSync);

  sys.getCompilerExecutingPath = () => 'bin/stencil.js';

  Object.defineProperties(sys, {
    diskReads: {
      get() {
        return diskReads;
      },
      set(val: number) {
        diskReads = val;
      },
    },
    diskWrites: {
      get() {
        return diskWrites;
      },
      set(val: number) {
        diskWrites = val;
      },
    },
  });

  if (!isTestingSystem(sys)) {
    throw new Error('could not generate TestingSystem');
  }

  return sys;
};
