import { Component, Prop, h } from '@stencil/core';

// TODO #3106
@Component({
  tag: 'attribute-delete',
})
export class AttributeDelete {
  // reflect a boolean property back to the DOM
  @Prop({ reflect: true }) boolState?: boolean = true;
  // acts as a proxy for unnecessary render cycle detection
  private renderCount = 0;

  render() {
    this.renderCount++;
    return <div>{`The Value of boolState is ${this.boolState} ${this.renderCount}`}</div>;
  }
}
