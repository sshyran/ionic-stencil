import type * as d from '@stencil/core/internal';
import { NODE_TYPES, parseHtmlToFragment, serializeNodeToHtml } from '@stencil/core/mock-doc';

export function toEqualHtml(input: string | HTMLElement | ShadowRoot, shouldEqual: string) {
  return compareHtml(input, shouldEqual, true);
}

export function toEqualLightHtml(input: string | HTMLElement | ShadowRoot, shouldEqual: string) {
  return compareHtml(input, shouldEqual, false);
}

export function compareHtml(
  input: string | HTMLElement | ShadowRoot,
  shouldEqual: string,
  serializeShadowRoot: boolean
) {
  if (input == null) {
    throw new Error(`expect toEqualHtml() value is "${input}"`);
  }

  if (typeof (input as any).then === 'function') {
    throw new Error(`element must be a resolved value, not a promise, before it can be tested`);
  }

  let serializeA: string;

  if ((input as HTMLElement).nodeType === NODE_TYPES.ELEMENT_NODE) {
    const options = getSpecOptions(input as any);
    serializeA = serializeNodeToHtml(input as any, {
      excludeTags: ['body'],
      outerHtml: true,
      prettyHtml: true,
      removeHtmlComments: options.includeAnnotations === false,
      serializeShadowRoot,
    });
  } else if ((input as HTMLElement).nodeType === NODE_TYPES.DOCUMENT_FRAGMENT_NODE) {
    serializeA = serializeNodeToHtml(input as any, {
      excludeTagContent: ['style'],
      excludeTags: ['style'],
      prettyHtml: true,
      serializeShadowRoot,
    });
  } else if (typeof input === 'string') {
    const parseA = parseHtmlToFragment(input);
    serializeA = serializeNodeToHtml(parseA, {
      prettyHtml: true,
      serializeShadowRoot,
    });
  } else {
    throw new Error(`expect toEqualHtml() value should be an element, shadow root or string.`);
  }

  const parseB = parseHtmlToFragment(shouldEqual);

  const serializeB = serializeNodeToHtml(parseB, {
    excludeTags: ['body'],
    prettyHtml: true,
  });

  if (serializeA !== serializeB) {
    expect(serializeA).toBe(serializeB);
    return {
      message: () => 'HTML does not match',
      pass: false,
    };
  }

  return {
    message: () => 'expect HTML to match',
    pass: true,
  };
}

function getSpecOptions(el: HTMLElement): Partial<d.NewSpecPageOptions> {
  if (el && el.ownerDocument && el.ownerDocument.defaultView) {
    return (el.ownerDocument.defaultView as any)['__stencil_spec_options'] || {};
  }

  return {};
}
