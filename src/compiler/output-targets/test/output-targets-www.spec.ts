// import { expectFilesDoNotExist, expectFilesExist } from '../../../testing/testing-utils';
import type * as d from '../../../declarations';
import { mockConfig } from '@stencil/core/testing';
import path from 'path';
import { Compiler, Config, Diagnostic, ValidatedConfig } from '../../../declarations';
import { getConfig } from '../../sys/config';
import { CompilerContext } from '../../build/compiler-ctx';
import { isFunction } from '@utils';
import ts from 'typescript';
// import {patchFs} from "../../sys/fs-patch";
import { createInMemoryFs } from '../../sys/in-memory-fs';
import { Cache } from '../../cache';
import { resolveModuleIdAsync } from '../../sys/resolve/resolve-module-async';
import { createSysWorker } from '../../sys/worker/sys-worker';
import { patchTypescript } from '../../sys/typescript/typescript-sys';
import { createFullBuild } from '../../build/full-build';
import { createWatchBuild } from '../../build/watch-build';

describe('outputTarget, www', () => {
  // jest.setTimeout(20000);
  let compiler: d.Compiler;
  let compilerCtx: d.CompilerCtx;
  let config: d.Config;
  const root = path.resolve('/');

  it('default www files', async () => {
    config = mockConfig({
      buildAppCore: true,
      namespace: 'App',
      rootDir: path.join(root, 'User', 'testing', '/'),
    });

    [compiler, compilerCtx] = await createTestingCompiler(config);

    const projectDir = path.join(root, 'User', 'testing');

    await Promise.all([
      compilerCtx.fs.writeFile(path.join(projectDir, 'src', 'index.html'), `<cmp-a></cmp-a>`),
      compilerCtx.fs.writeFile(
        path.join(projectDir, 'src', 'components', 'cmp-a.tsx'),
        `@Component({ tag: 'cmp-a' }) export class CmpA {}`
      ),
    ]);
    // await compiler.fs.commit();

    const r = await compiler.build();
    expect(r.diagnostics).toHaveLength(0);

    expect(compiler.sys.readDirSync(path.join(projectDir, 'www', 'build', 'app.js'))).toBe('Ryan fail');
    // expectFilesExist(compiler.sys.file, [
    //   path.join(root, 'User', 'testing', 'www'),
    //   path.join(root, 'User', 'testing', 'www', 'build'),
    //   path.join(root, 'User', 'testing', 'www', 'build', 'app.js'),
    //   path.join(root, 'User', 'testing', 'www', 'build', 'app.js.map'),
    //   path.join(root, 'User', 'testing', 'www', 'build', 'app.esm.js'),
    //   path.join(root, 'User', 'testing', 'www', 'build', 'cmp-a.entry.js'),
    //   path.join(root, 'User', 'testing', 'www', 'build', 'cmp-a.entry.js.map'),
    //
    //   path.join(root, 'User', 'testing', 'www', 'index.html'),
    //
    //   path.join(root, 'User', 'testing', 'src', 'components.d.ts'),
    // ]);
    //
    // expectFilesDoNotExist(compiler.fs, [
    //   path.join(root, 'User', 'testing', 'src', 'components', 'cmp-a.js'),
    //
    //   path.join(root, 'User', 'testing', 'dist', '/'),
    //   path.join(root, 'User', 'testing', 'dist', 'collection'),
    //   path.join(root, 'User', 'testing', 'dist', 'collection', 'collection-manifest.json'),
    //   path.join(root, 'User', 'testing', 'dist', 'collection', 'components'),
    //   path.join(root, 'User', 'testing', 'dist', 'collection', 'components', 'cmp-a.js'),
    //
    //   path.join(root, 'User', 'testing', 'dist', 'testapp', '/'),
    //   path.join(root, 'User', 'testing', 'dist', 'testapp.js'),
    //   path.join(root, 'User', 'testing', 'dist', 'testapp', 'cmp-a.entry.js'),
    //   path.join(root, 'User', 'testing', 'dist', 'testapp', 'es5-build-disabled.js'),
    //   path.join(root, 'User', 'testing', 'dist', 'testapp', 'testapp.core.js'),
    //
    //   path.join(root, 'User', 'testing', 'dist', 'types'),
    //   path.join(root, 'User', 'testing', 'dist', 'types', 'components'),
    //   path.join(root, 'User', 'testing', 'dist', 'types', 'components.d.ts'),
    //   path.join(root, 'User', 'testing', 'dist', 'types', 'components', 'cmp-a.d.ts'),
    //   path.join(root, 'User', 'testing', 'dist', 'types', 'stencil.core.d.ts'),
    // ]);
  });
});

const createTestingCompiler = async (userConfig: Config): Promise<[d.Compiler, d.CompilerCtx]> => {
  // actual compiler code
  // could be in a web worker on the browser
  // or the main thread in node
  const config: ValidatedConfig = getConfig(userConfig);
  const diagnostics: Diagnostic[] = [];
  const sys = config.sys;
  const compilerCtx = new CompilerContext();

  if (isFunction(config.sys.setupCompiler)) {
    config.sys.setupCompiler({ ts });
  }

  // patchFs(sys);

  compilerCtx.fs = createInMemoryFs(sys);
  compilerCtx.cache = new Cache(config, createInMemoryFs(sys));
  await compilerCtx.cache.initCacheDir();

  sys.resolveModuleId = (opts) => resolveModuleIdAsync(sys, compilerCtx.fs, opts);
  compilerCtx.worker = createSysWorker(config);

  if (sys.events) {
    // Pipe events from sys.events to compilerCtx
    sys.events.on(compilerCtx.events.emit);
  }
  patchTypescript(config, compilerCtx.fs);

  const build = () => createFullBuild(config, compilerCtx);

  const createWatcher = () => createWatchBuild(config, compilerCtx);

  const destroy = async () => {
    compilerCtx.reset();
    compilerCtx.events.unsubscribeAll();
    await sys.destroy();
  };

  const compiler: Compiler = {
    build,
    createWatcher,
    destroy,
    sys,
  };

  config.logger.printDiagnostics(diagnostics);

  return [compiler, compilerCtx];
};
