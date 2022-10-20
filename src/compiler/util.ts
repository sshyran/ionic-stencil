import { Diagnostic } from './sys/logger'
import { ValidatedConfig } from './config'
import { buildError } from '@utils';

/**
 * A type that describes the result of parsing a `package.json` file's contents
 */
export type ParsePackageJsonResult = {
  diagnostic: Diagnostic | null;
  data: any | null;
  filePath: string;
};

/**
 * Parse a string read from a `package.json` file
 * @param pkgJsonStr the string read from a `package.json` file
 * @param pkgJsonFilePath the path to the already read `package.json` file
 * @returns the results of parsing the provided contents of the `package.json` file
 */
export const parsePackageJson = (pkgJsonStr: string, pkgJsonFilePath: string): ParsePackageJsonResult => {
  const parseResult: ParsePackageJsonResult = {
    diagnostic: null,
    data: null,
    filePath: pkgJsonFilePath,
  };

  try {
    parseResult.data = JSON.parse(pkgJsonStr);
  } catch (e) {
    parseResult.diagnostic = buildError();
    parseResult.diagnostic.absFilePath = isString(pkgJsonFilePath) ? pkgJsonFilePath : undefined;
    parseResult.diagnostic.header = `Error Parsing JSON`;
    if (e instanceof Error) {
      parseResult.diagnostic.messageText = e.message;
    }
  }

  return parseResult;
};

export const readPackageJson = async (config: ValidatedConfig, compilerCtx: CompilerCtx, buildCtx: d.BuildCtx) => {
  try {
    const pkgJson = await compilerCtx.fs.readFile(config.packageJsonFilePath);

    if (pkgJson) {
      const parseResults = parsePackageJson(pkgJson, config.packageJsonFilePath);
      if (parseResults.diagnostic) {
        buildCtx.diagnostics.push(parseResults.diagnostic);
      } else {
        buildCtx.packageJson = parseResults.data;
      }
    }
  } catch (e) {
    if (!config.outputTargets.some((o) => o.type.includes('dist'))) {
      const diagnostic = buildError(buildCtx.diagnostics);
      diagnostic.header = `Missing "package.json"`;
      diagnostic.messageText = `Valid "package.json" file is required for distribution: ${config.packageJsonFilePath}`;
    }
  }
};

/**
 * Generate the preamble to be placed atop the main file of the build
 * @param config the Stencil configuration file
 * @returns the generated preamble
 */
export const generatePreamble = (config: d.Config): string => {
  const { preamble } = config;

  if (!preamble) {
    return '';
  }

  // generate the body of the JSDoc-style comment
  const preambleComment: string[] = preamble.split('\n').map((l) => ` * ${l}`);

  preambleComment.unshift(`/*!`);
  preambleComment.push(` */`);

  return preambleComment.join('\n');
};


