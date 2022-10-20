import { isAbsolute, join } from 'path';

import type * as d from '../../../declarations';
import { OutputTarget, OutputTargetStats } from '../../output-targets';
import { isOutputTargetStats, STATS } from '../../output-targets/output-utils';

export const validateStats = (userConfig: d.ValidatedConfig, userOutputs: OutputTarget[]) => {
  const outputTargets: OutputTargetStats[] = [];

  if (userConfig.flags.stats) {
    const hasOutputTarget = userOutputs.some(isOutputTargetStats);
    if (!hasOutputTarget) {
      outputTargets.push({
        type: STATS,
      });
    }
  }

  outputTargets.push(...userOutputs.filter(isOutputTargetStats));
  outputTargets.forEach((outputTarget) => {
    if (!outputTarget.file) {
      outputTarget.file = 'stencil-stats.json';
    }

    if (!isAbsolute(outputTarget.file)) {
      outputTarget.file = join(userConfig.rootDir, outputTarget.file);
    }
  });

  return outputTargets;
};
