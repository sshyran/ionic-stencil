import { isBoolean } from '@utils';
import { createConfigFlags } from '../../cli/config-flags';
import type * as d from '../../declarations';
import {
  DEFAULT_DEV_MODE,
  DEFAULT_FS_NAMESPACE,
  DEFAULT_HASHED_FILENAME_LENTH,
  DEFAULT_NAMESPACE,
} from '../config/constants';
import { setPlatformPath } from '../sys/modules/path';
import { createLogger } from './logger/console-logger';
import { createSystem } from './stencil-sys';

export const getConfig = (userConfig: d.Config): d.ValidatedConfig => {
  const logger = userConfig.logger ?? createLogger();

  let devMode = userConfig.devMode ?? DEFAULT_DEV_MODE;
  // default devMode false
  if (userConfig.flags?.prod) {
    devMode = false;
  } else if (userConfig.flags?.dev) {
    devMode = true;
  } else if (!isBoolean(userConfig.devMode)) {
    devMode = DEFAULT_DEV_MODE;
  }

  const hashFileNames = userConfig.hashFileNames ?? !devMode;

  const config: d.ValidatedConfig = {
    ...userConfig,
    flags: createConfigFlags(userConfig.flags ?? {}),
    logger,
    outputTargets: userConfig.outputTargets ?? [],
    rootDir: userConfig.rootDir ?? '/',
    sys: userConfig.sys ?? createSystem({ logger }),
    testing: userConfig ?? {},
    namespace: userConfig.namespace ?? DEFAULT_NAMESPACE,
    fsNamespace: userConfig.fsNamespace ?? DEFAULT_FS_NAMESPACE,
    minifyJs: userConfig.minifyJs ?? !devMode,
    minifyCss: userConfig.minifyCss ?? !devMode,
    hashFileNames,
    hashedFileNameLength: userConfig.hashedFileNameLength ?? DEFAULT_HASHED_FILENAME_LENTH,
    buildEs5: userConfig.buildEs5 === true || (!devMode && userConfig.buildEs5 === 'prod'),
  };

  setPlatformPath(config.sys.platformPath);

  if (config.flags.debug || config.flags.verbose) {
    config.logLevel = 'debug';
  } else if (config.flags.logLevel) {
    config.logLevel = config.flags.logLevel;
  } else if (typeof config.logLevel !== 'string') {
    config.logLevel = 'info';
  }
  config.logger.setLevel(config.logLevel);

  return config;
};
