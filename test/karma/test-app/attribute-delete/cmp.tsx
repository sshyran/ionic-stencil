import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'attribute-delete',
})
export class AttributeDelete {
  @Prop({ reflect: true }) boolState?: boolean = true;

  render() {
    return (
      <div>{`The Value of boolState is ${this.boolState}`}</div>
    )
  }
}
