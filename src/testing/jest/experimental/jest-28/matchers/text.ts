import { NODE_TYPES } from '@stencil/core/mock-doc';

export function toEqualText(input: HTMLElement | string, expectTextContent: string) {
  if (input == null) {
    throw new Error(`expect toEqualText() value is "${input}"`);
  }

  if (typeof (input as any).then === 'function') {
    throw new Error(`element must be a resolved value, not a promise, before it can be tested`);
  }

  // TODO: I added this |undefined
  let textContent: string | undefined;

  if ((input as HTMLElement).nodeType === NODE_TYPES.ELEMENT_NODE) {
    // TODO I added the bang op
    textContent = (input as HTMLElement).textContent!.replace(/\s\s+/g, ' ').trim();
  } else if (input != null) {
    textContent = String(input).replace(/\s\s+/g, ' ').trim();
  }

  if (typeof expectTextContent === 'string') {
    expectTextContent = expectTextContent.replace(/\s\s+/g, ' ').trim();
  }

  const pass = textContent === expectTextContent;

  return {
    message: () => `expected textContent "${expectTextContent}" to ${pass ? 'not ' : ''}equal "${textContent}"`,
    pass: pass,
  };
}
