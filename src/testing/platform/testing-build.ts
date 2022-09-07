import type * as d from '@stencil/core/internal';

export const Build: d.UserBuildConditionals = {
  isBrowser: false,
  isDev: true,
  isServer: true,
  isTesting: true,
};
