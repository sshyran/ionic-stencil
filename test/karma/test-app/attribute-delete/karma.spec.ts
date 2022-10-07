import { setupDomTests, waitForChanges } from '../util';

describe('attribute-delete', () => {
  const { setupDom, tearDownDom } = setupDomTests(document);
  let app: HTMLElement;

  beforeEach(async () => {
    app = await setupDom('/attribute-delete/index.html');
  });
  afterEach(tearDownDom);

  it('button click rerenders', async () => {
    const child = app.querySelector('attribute-delete');
    expect(child.getAttribute('bool-state')).toBe('');
    expect(child.getAttribute('noreflect')).toBe(null);
  });
});
