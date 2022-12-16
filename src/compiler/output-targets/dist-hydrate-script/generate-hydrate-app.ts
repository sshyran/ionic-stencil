import { catchError, createOnWarnFn, generatePreamble, loadRollupDiagnostics } from '@utils';
import MagicString from 'magic-string';
import { join } from 'path';
import { RollupOptions } from 'rollup';
import { rollup } from 'rollup';

import type * as d from '../../../declarations';
import { getBuildFeatures, updateBuildConditionals } from '../../app-core/app-data';
import {
  STENCIL_HYDRATE_FACTORY_ID,
  STENCIL_INTERNAL_HYDRATE_ID,
  STENCIL_MOCK_DOC_ID,
} from '../../bundle/entry-alias-ids';
import { bundleHydrateFactory } from './bundle-hydrate-factory';
import { HYDRATE_FACTORY_INTRO, HYDRATE_FACTORY_OUTRO } from './hydrate-factory-closure';
import { updateToHydrateComponents } from './update-to-hydrate-components';
import { writeHydrateOutputs } from './write-hydrate-outputs';
import { rollupNodeResolvePlugin } from '@compiler-deps'

export const generateHydrateApp = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetHydrate[]
) => {
  try {
    const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
    const input = join(packageDir, 'internal', 'hydrate', 'runner.js');
    const mockDoc = join(packageDir, 'mock-doc', 'index.js');

    const rollupOptions: RollupOptions = {
      // ...config.rollupConfig.inputOptions,
      input,
      // inlineDynamicImports: true,
      plugins: [
        // rollupNodeResolvePlugin({
        //   browser: true,
        //   rootDir: config.rootDir,
        // }),
        {
          name: 'hydrateAppPlugin',
          resolveId(id) {
            if (id === STENCIL_HYDRATE_FACTORY_ID) {
              return id;
            }
            // if (id === input) {
            //   return input;
            // }
            if (id === STENCIL_MOCK_DOC_ID) {
              return mockDoc;
            }
            return null;
          },
          async load(id) {
            if (id === STENCIL_HYDRATE_FACTORY_ID) {
              return generateHydrateFactory(config, compilerCtx, buildCtx);
            }
            // return config.sys.readFile(id)
            return null
          },
        },

      ],
      treeshake: false,
      onwarn: createOnWarnFn(buildCtx.diagnostics),
    };

    console.log('HYDRATE_BUILD::1');

    const rollup2 = rollup

    // debugger;
    const rollupAppBuild = await rollup(rollupOptions);

    debugger;
    console.log('HYDRATE_BUILD::2');
    const rollupOutput = await rollupAppBuild.generate({
      banner: generatePreamble(config),
      format: 'cjs',
      file: 'index.js',
    });

    console.log('HYDRATE_BUILD::3');
    await writeHydrateOutputs(config, compilerCtx, buildCtx, outputTargets, rollupOutput);
    console.log('HYDRATE_BUILD::4');
  } catch (e: any) {
    console.log('HAD AN ERROR IN HYDRATE BUILD');
    console.log(e);
    debugger;
    if (!buildCtx.hasError) {
      // TODO(STENCIL-353): Implement a type guard that balances using our own copy of Rollup types (which are
      // breakable) and type safety (so that the error variable may be something other than `any`)
      loadRollupDiagnostics(config, compilerCtx, buildCtx, e);
    }
  }
};

const generateHydrateFactory = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  console.log('GENERATE_HYDRATE_FACTORY_CALLED');
  console.log(buildCtx.hasError);
  console.log('do we do anything??');
  // if (!buildCtx.hasError) {
    try {
      console.log('generateHydrateFactory::1');
      const cmps = buildCtx.components;
      console.log('generateHydrateFactory::2');
      const build = getHydrateBuildConditionals(config, cmps);
      console.log('generateHydrateFactory::3');

      const appFactoryEntryCode = await generateHydrateFactoryEntry(buildCtx);

      console.log('generateHydrateFactory::4');
      console.log(appFactoryEntryCode);
      const rollupFactoryBuild = await bundleHydrateFactory(config, compilerCtx, buildCtx, build, appFactoryEntryCode);
      console.log('generateHydrateFactory::5');
      console.log('rollupFactoryBuild:');
      console.log(rollupFactoryBuild);
      if (rollupFactoryBuild != null) {
        const rollupOutput = await rollupFactoryBuild.generate({
          format: 'cjs',
          esModule: false,
          strict: false,
          intro: HYDRATE_FACTORY_INTRO,
          outro: HYDRATE_FACTORY_OUTRO,
          preferConst: false,
        });

        if (rollupOutput != null && Array.isArray(rollupOutput.output)) {
          console.log('were here, returning');
          console.log(
            rollupOutput.output[0].code
          );
          return rollupOutput.output[0].code;
        }
      }
      console.log('generateHydrateFactory::6');
    } catch (e: any) {
      console.log('error occured in hydrate factory build');
      console.log(e);
      catchError(buildCtx.diagnostics, e);
    }
  // }
  return '';
};

const generateHydrateFactoryEntry = async (buildCtx: d.BuildCtx) => {
  const cmps = buildCtx.components;
  const hydrateCmps = await updateToHydrateComponents(cmps);
  const s = new MagicString('');

  s.append(`import { hydrateApp, registerComponents, styles } from '${STENCIL_INTERNAL_HYDRATE_ID}';\n`);

  hydrateCmps.forEach((cmpData) => s.append(cmpData.importLine + '\n'));

  s.append(`registerComponents([\n`);
  hydrateCmps.forEach((cmpData) => {
    s.append(`  ${cmpData.uniqueComponentClassName},\n`);
  });
  s.append(`]);\n`);
  s.append(`export { hydrateApp }\n`);

  return s.toString();
};

const getHydrateBuildConditionals = (config: d.ValidatedConfig, cmps: d.ComponentCompilerMeta[]) => {
  const build = getBuildFeatures(cmps) as d.BuildConditionals;

  build.lazyLoad = true;
  build.hydrateClientSide = false;
  build.hydrateServerSide = true;

  updateBuildConditionals(config, build);
  build.lifecycleDOMEvents = false;
  build.devTools = false;
  build.hotModuleReplacement = false;
  build.cloneNodeFix = false;
  build.appendChildSlotFix = false;
  build.slotChildNodesFix = false;
  build.safari10 = false;
  build.shadowDomShim = false;

  return build;
};
