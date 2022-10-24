import { DEFAULT_STYLE_MODE } from '@utils';

import type * as d from '../../declarations';

/**
 * Set various fields on the provided component compiler metadata based on other fields set on the same piece of
 * metadata.
 *
 * This function mutates the provided metadata argument in place.
 *
 * @param cmpMeta the metadata for a component to update
 */
export const setComponentBuildConditionals = (cmpMeta: d.ComponentCompilerMeta): void => {
  if (cmpMeta.properties.length > 0) {
    cmpMeta.hasProp = true;
    cmpMeta.hasPropMutable = cmpMeta.properties.some((p) => p.mutable);
    cmpMeta.hasReflect = cmpMeta.properties.some((p) => p.reflect);
    cmpMeta.hasAttribute = cmpMeta.properties.some((p) => typeof p.attribute === 'string');
    cmpMeta.hasPropBoolean = cmpMeta.properties.some((p) => p.type === 'boolean');
    cmpMeta.hasPropNumber = cmpMeta.properties.some((p) => p.type === 'number');
    cmpMeta.hasPropString = cmpMeta.properties.some((p) => p.type === 'string');
  }

  if (cmpMeta.states.length > 0) {
    cmpMeta.hasState = true;
  }

  if (cmpMeta.watchers.length > 0) {
    cmpMeta.hasWatchCallback = true;
  }

  if (cmpMeta.methods.length > 0) {
    cmpMeta.hasMethod = true;
  }

  if (cmpMeta.events.length > 0) {
    cmpMeta.hasEvent = true;
  }

  if (cmpMeta.listeners.length > 0) {
    cmpMeta.hasListener = true;
    cmpMeta.hasListenerTargetWindow = cmpMeta.listeners.some((l) => l.target === 'window');
    cmpMeta.hasListenerTargetDocument = cmpMeta.listeners.some((l) => l.target === 'document');
    cmpMeta.hasListenerTargetBody = cmpMeta.listeners.some((l) => l.target === 'body');
    cmpMeta.hasListenerTargetParent = cmpMeta.listeners.some((l) => l.target === ('parent' as any));
    cmpMeta.hasListenerTarget = cmpMeta.listeners.some((l) => !!l.target);
  }

  cmpMeta.hasMember = cmpMeta.hasProp || cmpMeta.hasState || cmpMeta.hasElement || cmpMeta.hasMethod;

  cmpMeta.isUpdateable = cmpMeta.hasProp || cmpMeta.hasState;
  if (cmpMeta.styles.length > 0) {
    cmpMeta.hasStyle = true;
    cmpMeta.hasMode = cmpMeta.styles.some((s) => s.modeName !== DEFAULT_STYLE_MODE);
  }
  cmpMeta.hasLifecycle =
    cmpMeta.hasComponentWillLoadFn ||
    cmpMeta.hasComponentDidLoadFn ||
    cmpMeta.hasComponentShouldUpdateFn ||
    cmpMeta.hasComponentWillUpdateFn ||
    cmpMeta.hasComponentDidUpdateFn ||
    cmpMeta.hasComponentWillRenderFn ||
    cmpMeta.hasComponentDidRenderFn;
  cmpMeta.isPlain =
    !cmpMeta.hasMember && !cmpMeta.hasStyle && !cmpMeta.hasLifecycle && !cmpMeta.hasListener && !cmpMeta.hasVdomRender;
};
