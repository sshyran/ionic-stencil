import { MockNode, serializeNodeToHtml } from '@stencil/core/mock-doc';

const print = (val: HTMLElement | MockNode): string => {
  return serializeNodeToHtml(val, {
    outerHtml: true,
    prettyHtml: true,
    serializeShadowRoot: true,
  });
};

const test = (val: any): boolean => {
  return val !== undefined && val !== null && (val instanceof HTMLElement || val instanceof MockNode);
};

export const HtmlSerializer = {
  print,
  test,
};
