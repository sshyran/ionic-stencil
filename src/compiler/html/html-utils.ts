import { join, relative } from 'path';

import { OutputTargetWww } from '../output-targets';

export const getAbsoluteBuildDir = (outputTarget: OutputTargetWww) => {
  const relativeBuildDir = relative(outputTarget.dir, outputTarget.buildDir);
  return join('/', relativeBuildDir) + '/';
};
