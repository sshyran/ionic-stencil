import { Component, getMode, setMode } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('style', () => {
  it('get style string', async () => {
    @Component({
      styles: `div { color: red; }`,
      tag: 'cmp-a',
    })
    class CmpA {
      render() {
        return `innertext`;
      }
    }

    const { root, styles } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      includeAnnotations: true,
    });

    expect(root).toHaveClass('hydrated');
    expect(styles.get('sc-cmp-a')).toBe(`div { color: red; }`);
  });

  describe('mode', () => {
    it('md mode', async () => {
      setMode(() => 'md');
      @Component({
        styles: {
          ios: `:host { color: black }`,
          md: `:host { color: red }`,
        },
        tag: 'cmp-a',
      })
      class CmpA {
        render() {
          return `Hola`;
        }
      }

      const { root, styles } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(styles.get('sc-cmp-a-md')).toEqual(':host { color: red }');
      expect(getMode(root)).toEqual('md');
    });

    it('ios mode', async () => {
      setMode(() => 'ios');
      @Component({
        styles: {
          ios: `:host { color: black };`,
          md: `:host { color: red };`,
        },
        tag: 'cmp-a',
      })
      class CmpA {
        render() {
          return `Hola`;
        }
      }
      const { root, styles } = await newSpecPage({
        components: [CmpA],
        html: `<cmp-a></cmp-a>`,
      });

      expect(styles.get('sc-cmp-a-ios')).toEqual(':host { color: black };');
      expect(getMode(root)).toEqual('ios');
    });
  });
});
