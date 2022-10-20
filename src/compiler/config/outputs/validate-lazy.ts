import { isBoolean } from '@utils';
import { join } from 'path';

import type * as d from '../../../declarations';
import { OutputTarget, OutputTargetDistLazy } from '../../output-targets';
import { DIST_LAZY, isOutputTargetDistLazy } from '../../output-targets/output-utils';
import { getAbsolutePath } from '../config-utils';

export const validateLazy = (config: d.ValidatedConfig, userOutputs: OutputTarget[]) => {
  return userOutputs.filter(isOutputTargetDistLazy).map((o) => {
    const dir = getAbsolutePath(config, o.dir || join('dist', config.fsNamespace));
    const lazyOutput: OutputTargetDistLazy = {
      type: DIST_LAZY,
      esmDir: dir,
      systemDir: config.buildEs5 ? dir : undefined,
      systemLoaderFile: config.buildEs5 ? join(dir, `${config.fsNamespace}.js`) : undefined,
      polyfills: !!o.polyfills,
      isBrowserBuild: true,
      empty: isBoolean(o.empty) ? o.empty : true,
    };
    return lazyOutput;
  });
};
