import { flatOne, normalizePath, sortBy } from '@utils';
import { basename, dirname, join, relative } from 'path';

import type * as d from '../../declarations';
import {
  OutputTarget,
  OutputTargetAngular,
  OutputTargetCopy,
  OutputTargetCustom,
  OutputTargetDist,
  OutputTargetDistCollection,
  OutputTargetDistCustomElements,
  OutputTargetDistCustomElementsBundle,
  OutputTargetDistGlobalStyles,
  OutputTargetDistLazy,
  OutputTargetDistLazyLoader,
  OutputTargetDistTypes,
  OutputTargetDocsCustom,
  OutputTargetDocsJson,
  OutputTargetDocsReadme,
  OutputTargetDocsVscode,
  OutputTargetHydrate,
  OutputTargetStats,
  OutputTargetWww,
} from '.';

export const relativeImport = (pathFrom: string, pathTo: string, ext?: string, addPrefix = true) => {
  let relativePath = relative(dirname(pathFrom), dirname(pathTo));
  if (addPrefix) {
    if (relativePath === '') {
      relativePath = '.';
    } else if (relativePath[0] !== '.') {
      relativePath = './' + relativePath;
    }
  }
  return normalizePath(`${relativePath}/${basename(pathTo, ext)}`);
};

export const getComponentsDtsSrcFilePath = (config: d.Config) => join(config.srcDir, GENERATED_DTS);

export const getComponentsDtsTypesFilePath = (outputTarget: OutputTargetDist | OutputTargetDistTypes) =>
  join(outputTarget.typesDir, GENERATED_DTS);

export const isOutputTargetDist = (o: OutputTarget): o is OutputTargetDist => o.type === DIST;

export const isOutputTargetDistCollection = (o: OutputTarget): o is OutputTargetDistCollection =>
  o.type === DIST_COLLECTION;

export const isOutputTargetDistCustomElements = (o: OutputTarget): o is OutputTargetDistCustomElements =>
  o.type === DIST_CUSTOM_ELEMENTS;

export const isOutputTargetDistCustomElementsBundle = (o: OutputTarget): o is OutputTargetDistCustomElementsBundle =>
  o.type === DIST_CUSTOM_ELEMENTS_BUNDLE;

export const isOutputTargetCopy = (o: OutputTarget): o is OutputTargetCopy => o.type === COPY;

export const isOutputTargetDistLazy = (o: OutputTarget): o is OutputTargetDistLazy => o.type === DIST_LAZY;

export const isOutputTargetAngular = (o: OutputTarget): o is OutputTargetAngular => o.type === ANGULAR;

export const isOutputTargetDistLazyLoader = (o: OutputTarget): o is OutputTargetDistLazyLoader =>
  o.type === DIST_LAZY_LOADER;

export const isOutputTargetDistGlobalStyles = (o: OutputTarget): o is OutputTargetDistGlobalStyles =>
  o.type === DIST_GLOBAL_STYLES;

export const isOutputTargetHydrate = (o: OutputTarget): o is OutputTargetHydrate => o.type === DIST_HYDRATE_SCRIPT;

export const isOutputTargetCustom = (o: OutputTarget): o is OutputTargetCustom => o.type === CUSTOM;

export const isOutputTargetDocs = (
  o: OutputTarget
): o is OutputTargetDocsJson | OutputTargetDocsReadme | OutputTargetDocsVscode | OutputTargetDocsCustom =>
  o.type === DOCS_README || o.type === DOCS_JSON || o.type === DOCS_CUSTOM || o.type === DOCS_VSCODE;

export const isOutputTargetDocsReadme = (o: OutputTarget): o is OutputTargetDocsReadme => o.type === DOCS_README;

export const isOutputTargetDocsJson = (o: OutputTarget): o is OutputTargetDocsJson => o.type === DOCS_JSON;

export const isOutputTargetDocsCustom = (o: OutputTarget): o is OutputTargetDocsCustom => o.type === DOCS_CUSTOM;

export const isOutputTargetDocsVscode = (o: OutputTarget): o is OutputTargetDocsVscode => o.type === DOCS_VSCODE;

export const isOutputTargetWww = (o: OutputTarget): o is OutputTargetWww => o.type === WWW;

export const isOutputTargetStats = (o: OutputTarget): o is OutputTargetStats => o.type === STATS;

export const isOutputTargetDistTypes = (o: OutputTarget): o is OutputTargetDistTypes => o.type === DIST_TYPES;

export const getComponentsFromModules = (moduleFiles: d.Module[]) =>
  sortBy(flatOne(moduleFiles.map((m) => m.cmps)), (c: d.ComponentCompilerMeta) => c.tagName);

export const ANGULAR = 'angular';
export const COPY = 'copy';
export const CUSTOM = 'custom';
export const DIST = 'dist';
export const DIST_COLLECTION = 'dist-collection';
export const DIST_CUSTOM_ELEMENTS = 'dist-custom-elements';
export const DIST_CUSTOM_ELEMENTS_BUNDLE = 'dist-custom-elements-bundle';

export const DIST_TYPES = 'dist-types';
export const DIST_HYDRATE_SCRIPT = 'dist-hydrate-script';
export const DIST_LAZY = 'dist-lazy';
export const DIST_LAZY_LOADER = 'dist-lazy-loader';
export const DIST_GLOBAL_STYLES = 'dist-global-styles';
export const DOCS_CUSTOM = 'docs-custom';
export const DOCS_JSON = 'docs-json';
export const DOCS_README = 'docs-readme';
export const DOCS_VSCODE = 'docs-vscode';
export const STATS = 'stats';
export const WWW = 'www';

/**
 * Valid output targets to specify in a Stencil config.
 *
 * Note that there are some output targets (e.g. `DIST_TYPES`) which are
 * programmatically set as output targets by the compiler when other output
 * targets (in that case `DIST`) are set, but which are _not_ supported in a
 * Stencil config. This is enforced in the output target validation code.
 */
export const VALID_CONFIG_OUTPUT_TARGETS = [
  // DIST
  WWW,
  DIST,
  DIST_COLLECTION,
  DIST_CUSTOM_ELEMENTS,
  DIST_CUSTOM_ELEMENTS_BUNDLE,
  DIST_LAZY,
  DIST_HYDRATE_SCRIPT,

  // DOCS
  DOCS_JSON,
  DOCS_README,
  DOCS_VSCODE,
  DOCS_CUSTOM,

  // MISC
  ANGULAR,
  COPY,
  CUSTOM,
  STATS,
] as const;

// Given a ReadonlyArray of strings we can derive a union type from them
// by getting `typeof ARRAY[number]`, i.e. the type of all values returns
// by number keys.
type ValidConfigOutputTarget = typeof VALID_CONFIG_OUTPUT_TARGETS[number];

/**
 * Check whether a given output target is a valid one to be set in a Stencil config
 *
 * @param targetType the type which we want to check
 * @returns whether or not the targetType is a valid, configurable output target.
 */
export function isValidConfigOutputTarget(targetType: string): targetType is ValidConfigOutputTarget {
  // unfortunately `includes` is typed on `ReadonlyArray<T>` as `(el: T):
  // boolean` so a `string` cannot be passed to `includes` on a
  // `ReadonlyArray` 😢 thus we `as any`
  //
  // see microsoft/TypeScript#31018 for some discussion of this
  return VALID_CONFIG_OUTPUT_TARGETS.includes(targetType as any);
}

export const GENERATED_DTS = 'components.d.ts';
