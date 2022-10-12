import { Component, Prop, h } from '@stencil/core';

// TODO #3106
@Component({
  tag: 'attribute-delete',
})
export class AttributeDelete {
  @Prop({ reflect: true }) boolState?: boolean = true;
  private renderCount = 0;
  render() {
    this.renderCount++;
    return (
      <div>{`The Value of boolState is ${this.boolState} ${this.renderCount}`}</div>
    )
  }
}
