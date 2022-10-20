import type * as d from '../../../declarations';
import { OutputTarget, OutputTargetDistCollection } from '../../output-targets';
import { isOutputTargetDistCollection } from '../../output-targets/output-utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return DIST_COLLECTION output targets, ensuring that the `dir`
 * property is set on them.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated DIST_COLLECTION output targets
 */
export const validateCollection = (
  config: d.ValidatedConfig,
  userOutputs: OutputTarget[]
): OutputTargetDistCollection[] => {
  return userOutputs.filter(isOutputTargetDistCollection).map((outputTarget) => {
    return {
      ...outputTarget,
      transformAliasedImportPaths: outputTarget.transformAliasedImportPaths ?? false,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/collection'),
    };
  });
};
