import { execaSync } from 'execa';
import {dirname,join} from 'path';
import {fileURLToPath} from "url";

import * as Build from './build/build.js'

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptsDir, '..');

/**
 * Transpiles build scripts used to create the Stencil compiler artifact
 */
function transpileBuildScripts() {
  console.log('🧩  transpiling build scripts');
  const tscPath = join(rootDir, 'node_modules', '.bin', 'tsc');
  const tsconfig = join(scriptsDir, 'tsconfig.json');
  execaSync(tscPath, ['-p', tsconfig]);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--prepare')) {
    // with --prepare always compile the scripts
    transpileBuildScripts();
  }

  Build.run(rootDir, args);
}

main();
