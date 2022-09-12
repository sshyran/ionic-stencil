import { BUILD } from '@app-data';
import { getHostRef, win } from '@platform';
import { HOST_FLAGS } from '@utils';

import type * as d from '../declarations';

let i = 0;

export const createTime = (fnName: string, tagName = '') => {
  if (BUILD.profile && performance.mark) {
    const key = `st:${fnName}:${tagName}:${i++}`;
    // Start
    performance.mark(key);

    // End
    return () => performance.measure(`[Stencil] ${fnName}() <${tagName}>`, key);
  } else {
    return () => {
      return;
    };
  }
};

export const uniqueTime = (key: string, measureText: string) => {
  if (BUILD.profile && performance.mark) {
    if (performance.getEntriesByName(key).length === 0) {
      performance.mark(key);
    }
    return () => {
      if (performance.getEntriesByName(measureText).length === 0) {
        performance.measure(measureText, key);
      }
    };
  } else {
    return () => {
      return;
    };
  }
};

const inspect = (ref: any) => {
  const hostRef = getHostRef(ref);
  if (!hostRef) {
    return undefined;
  }
  const flags = hostRef.$flags$;
  const hostElement = hostRef.$hostElement$ as d.HostElement;
  return {
    ancestorComponent: hostRef.$ancestorComponent$,
    flags: {
      hasConnected: !!(flags & HOST_FLAGS.hasConnected),
      hasInitializedComponent: !!(flags & HOST_FLAGS.hasInitializedComponent),
      hasLoadedComponent: !!(flags & HOST_FLAGS.hasLoadedComponent),
      hasRendered: !!(flags & HOST_FLAGS.hasRendered),
      isConstructingInstance: !!(flags & HOST_FLAGS.isConstructingInstance),
      isListenReady: !!(flags & HOST_FLAGS.isListenReady),
      isQueuedForUpdate: !!(flags & HOST_FLAGS.isQueuedForUpdate),
      isWaitingForChildren: !!(flags & HOST_FLAGS.isWaitingForChildren),
      isWatchReady: !!(flags & HOST_FLAGS.isWatchReady),
      needsRerender: !!(flags & HOST_FLAGS.needsRerender),
    },
    hostElement,
    instanceValues: hostRef.$instanceValues$,
    lazyInstance: hostRef.$lazyInstance$,
    modeName: hostRef.$modeName$,
    onInstancePromise: hostRef.$onInstancePromise$,
    onInstanceResolve: hostRef.$onInstanceResolve$,
    onReadyPromise: hostRef.$onReadyPromise$,
    onReadyResolve: hostRef.$onReadyResolve$,
    onRenderResolve: hostRef.$onRenderResolve$,
    queuedListeners: hostRef.$queuedListeners$,
    renderCount: hostRef.$renderCount$,
    rmListeners: hostRef.$rmListeners$,
    vnode: hostRef.$vnode$,
    // separate the computer properties from the rest
    ['s-cr']: hostElement['s-cr'],
    ['s-id']: hostElement['s-id'],
    ['s-lr']: hostElement['s-lr'],
    ['s-p']: hostElement['s-p'],
    ['s-rc']: hostElement['s-rc'],
    ['s-sc']: hostElement['s-sc'],
  };
};

export const installDevTools = () => {
  if (BUILD.devTools) {
    const stencil = ((win as any).stencil = (win as any).stencil || {});
    const originalInspect = stencil.inspect;

    stencil.inspect = (ref: any) => {
      let result = inspect(ref);
      if (!result && typeof originalInspect === 'function') {
        result = originalInspect(ref);
      }
      return result;
    };
  }
};
