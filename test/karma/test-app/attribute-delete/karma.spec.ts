import { setupDomTests, waitForChanges } from '../util';
// TODO(UNDO)
fdescribe('attribute-delete', () => {
  const { setupDom, tearDownDom } = setupDomTests(document);
  const CUSTOM_ELEMENT_NAME = 'attribute-delete';
  let child: HTMLAttributeDeleteElement;
  beforeEach(async () => {
    const app = await setupDom('/attribute-delete/index.html');
    child = app.querySelector(CUSTOM_ELEMENT_NAME);

    if(!child) {
      throw new Error(`Unable to find element with selector, "${CUSTOM_ELEMENT_NAME}"`)
    }
  });
  afterEach(tearDownDom);

  describe('deleting attribute',  () => {
    it('removes the attribute from the dom', async () => {
      // a boolean attribute that is reflected to the DOM has a value of an empty string
      expect(child.hasAttribute('bool-state')).toBe(true);
      expect(child.getAttribute('bool-state')).toBe('');

      // set the _attribute_ on the DOM element to `null`
      const setAttributeNullButton = document.querySelector<HTMLButtonElement>('#setAttrNull');
      setAttributeNullButton.click();
      await waitForChanges();

      expect(child.hasAttribute('bool-state')).toBe(false);
    });

    it('only re-renders once', async () => {
      expect(child.textContent).toEqual('The Value of boolState is true 1');

      // set the _attribute_ on the DOM element to `null`
      const setAttributeNullButton = document.querySelector<HTMLButtonElement>('#setAttrNull');
      setAttributeNullButton.click();
      await waitForChanges();

      expect(child.textContent).toEqual('The Value of boolState is false 2');
    })
  });

  describe('deleting prop',  () => {
    it('removes the reflected attribute from the dom', async () => {
      // a boolean attribute that is reflected to the DOM has a value of an empty string
      expect(child.hasAttribute('bool-state')).toBe(true);
      expect(child.getAttribute('bool-state')).toBe('');

      // set the _property_ on the underlying JS object to `null`
      const setPropNullButton = document.querySelector<HTMLButtonElement>('#setPropNull');
      setPropNullButton.click();
      await waitForChanges();

      expect(child.hasAttribute('bool-state')).toBe(false);
    });

    it('only re-renders once', async () => {
      expect(child.textContent).toEqual('The Value of boolState is true 1');

      // set the _property_ on the underlying JS object to `null`
      const setPropNullButton = document.querySelector<HTMLButtonElement>('#setPropNull');
      setPropNullButton.click();
      await waitForChanges();

      expect(child.textContent).toEqual('The Value of boolState is null 2');
    })
  });
});
