import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'attribute-delete',
})
export class AttributeDelete {
  @Prop({ reflect: true }) boolState?: boolean = true;
  @Prop() noreflect?: boolean = true;

  render() {
    return (
      <div>Hello World</div>
    )
  }
}
