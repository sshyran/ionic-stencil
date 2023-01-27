import { getHostRef, modeResolutionChain } from '@platform';

import type * as d from '../declarations';

// Private
/**
 * Determines the mode of a Stencil component, using the following heuristics:
 * 1. Evaluate each {@link d.ResolutionHandler} (with `elm`) that was provided via {@link setMode}, in the order the
 * handler was provided (first in, first evaluated)
 * 2. Of the results from the previous step, return the first truthy value
 * @param elm the element (associated with a Stencil component) to inspect using a series of
 * {@link d.ResolutionHandler}s
 * @returns the mode to apply to the element
 */
export const computeMode = (elm: d.HostElement): string =>
  modeResolutionChain
    .map((handler: d.ResolutionHandler) => handler(elm))
    .find((mode: ReturnType<d.ResolutionHandler>) => !!mode);

// Public
export const setMode = (handler: d.ResolutionHandler) => modeResolutionChain.push(handler);
export const getMode = (ref: d.RuntimeRef) => getHostRef(ref).$modeName$;
