import { setupDomTests, waitForChanges } from '../util';
// TODO(NOW): unfocus this
fdescribe('attribute-delete', () => {
  const { setupDom, tearDownDom } = setupDomTests(document);
  let app: HTMLElement;

  beforeEach(async () => {
    app = await setupDom('/attribute-delete/index.html');
  });
  afterEach(tearDownDom);

  it('deleting attribute sets it to null', async () => {
    const child = app.querySelector('attribute-delete');
    // a boolean attribute that is reflected to the DOM has a value of an empty string
    expect(child.hasAttribute('bool-state')).toBe(true);
    expect(child.getAttribute('bool-state')).toBe('');

    // set the _attribute_ on the DOM element to `null`
    const setAttributeNullButton = document.querySelector<HTMLButtonElement>('#setAttrNull');
    setAttributeNullButton.click();
    await waitForChanges();

    expect(child.hasAttribute('bool-state')).toBe(false);
  });

  it('deleting prop does not set it to null', async () => {
    const child = app.querySelector('attribute-delete');
    // a boolean attribute that is reflected to the DOM has a value of an empty string
    expect(child.hasAttribute('bool-state')).toBe(true);
    expect(child.getAttribute('bool-state')).toBe('');

    // set the _property_ on the underlying JS object to `null`
    const setPropNullButton = document.querySelector<HTMLButtonElement>('#setPropNull');
    setPropNullButton.click();
    await waitForChanges();

    expect(child.hasAttribute('bool-state')).toBe(false);
  });
});
