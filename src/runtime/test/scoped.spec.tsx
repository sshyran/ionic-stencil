import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('scoped', () => {
  it('should add scoped classes', async () => {
    @Component({
      scoped: true,
      styles: ':host { color: inherit }',
      tag: 'cmp-a',
    })
    class CmpA {
      render() {
        return (
          <cmp-b>
            <span>Hola</span>
          </cmp-b>
        );
      }
    }

    @Component({
      scoped: true,
      styles: ':host { color: inherit }',
      tag: 'cmp-b',
    })
    class CmpB {
      render() {
        return (
          <div>
            <slot></slot>
          </div>
        );
      }
    }
    const page = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a></cmp-a>`,
      includeAnnotations: true,
    });

    expect(page.root).toEqualHtml(`
    <cmp-a class="hydrated sc-cmp-a-h sc-cmp-a-s">
      <cmp-b class="hydrated sc-cmp-a sc-cmp-b-h sc-cmp-b-s">
        <!---->
        <div class="sc-cmp-b sc-cmp-b-s">
          <span class="sc-cmp-a">
            Hola
          </span>
        </div>
      </cmp-b>
    </cmp-a>
    `);
  });
});
