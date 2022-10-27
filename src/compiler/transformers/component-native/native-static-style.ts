import { dashToPascalCase, DEFAULT_STYLE_MODE } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { scopeCss } from '../../../utils/shadow-css';
import { getScopeId } from '../../style/scope-css';
import { createStaticGetter } from '../transform-utils';

/**
 * Create 1+ style static getters for a component.
 *
 * This function mutates the provided `classMembers` argument
 *
 * @param classMembers the collection of class members for the component to push to new static getter(s) to
 * @param cmp metadata for the component whose style getter(s) are being generated
 */
export const addNativeStaticStyle = (classMembers: ts.ClassElement[], cmp: d.ComponentCompilerMeta): void => {
  if (Array.isArray(cmp.styles) && cmp.styles.length > 0) {
    if (cmp.styles.length > 1 || (cmp.styles.length === 1 && cmp.styles[0].modeName !== DEFAULT_STYLE_MODE)) {
      // multiple style modes
      addMultipleModeStyleGetter(classMembers, cmp, cmp.styles);
    } else {
      // single style
      addSingleStyleGetter(classMembers, cmp, cmp.styles[0]);
    }
  }
};

/**
 * Create >1 style static getters for a component.
 *
 * This function mutates the provided `classMembers` argument
 *
 * @param classMembers the collection of class members for the component to push to new static getters to
 * @param cmp metadata for the component whose style getters are being generated
 * @param styles the styles for the component
 */
const addMultipleModeStyleGetter = (
  classMembers: ts.ClassElement[],
  cmp: d.ComponentCompilerMeta,
  styles: d.StyleCompiler[]
): void => {
  const styleModes: ts.ObjectLiteralElementLike[] = [];

  styles.forEach((style) => {
    if (typeof style.styleStr === 'string') {
      // inline the style string
      // static get style() { return { "ios": "string" }; }
      const styleLiteral = createStyleLiteral(cmp, style);
      const propStr = ts.factory.createPropertyAssignment(style.modeName, styleLiteral);
      styleModes.push(propStr);
    } else if (typeof style.styleIdentifier === 'string') {
      // direct import already written in the source code
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { "ios": myTagIosStyle }; }
      const styleIdentifier = ts.factory.createIdentifier(style.styleIdentifier);
      const propIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleIdentifier);
      styleModes.push(propIdentifier);
    } else if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
      // import generated from @Component() styleUrls option
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { "ios": myTagIosStyle }; }
      const styleUrlIdentifier = createStyleIdentifierFromUrl(cmp, style);
      const propUrlIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleUrlIdentifier);
      styleModes.push(propUrlIdentifier);
    }
  });

  const styleObj = ts.factory.createObjectLiteralExpression(styleModes, true);

  classMembers.push(createStaticGetter('style', styleObj));
};

/**
 * Creates a static getter for a component's style and adds it to the component's class members.
 *
 * This function mutates the provided `classMembers` argument
 *
 * @param classMembers the list of class members to add the style getter to
 * @param cmp the component for which the style is being generated
 * @param style the style whose getter is being retried
 */
const addSingleStyleGetter = (
  classMembers: ts.ClassElement[],
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler
): void => {
  if (typeof style.styleStr === 'string') {
    // inline the style string:
    // static get style() { return "string"; }
    const styleLiteral = createStyleLiteral(cmp, style);
    classMembers.push(createStaticGetter('style', styleLiteral));
  } else if (typeof style.styleIdentifier === 'string') {
    // direct import already written in the source code:
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    const styleIdentifier = ts.factory.createIdentifier(style.styleIdentifier);
    classMembers.push(createStaticGetter('style', styleIdentifier));
  } else if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
    // import generated from @Component() styleUrls option:
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    const styleUrlIdentifier = createStyleIdentifierFromUrl(cmp, style);
    classMembers.push(createStaticGetter('style', styleUrlIdentifier));
  }
};

/**
 * Create a {@link ts.StringLiteral} version of a literal CSS string
 * @param cmp the component metadata that uses the CSS string
 * @param style the style metadata whose literal CSS string will be converted to a TS node
 * @returns the new TS node
 */
const createStyleLiteral = (cmp: d.ComponentCompilerMeta, style: d.StyleCompiler): ts.StringLiteral => {
  if (cmp.encapsulation === 'scoped') {
    // scope the css first
    const scopeId = getScopeId(cmp.tagName, style.modeName);
    return ts.factory.createStringLiteral(scopeCss(style.styleStr, scopeId, false));
  }

  return ts.factory.createStringLiteral(style.styleStr);
};

/**
 * Generate an identifier for a component's styles.
 *
 * An identifier takes the form of:
 * "componentTagNameCamelCase(ModeNamePascalCase)?Style"
 *
 * where the mode name is omitted for the {@link DEFAULT_STYLE_MODE}
 *
 *
 * This is accomplished by mutating the provided `style` argument
 *
 * @param cmp the metadata for the component to generate the style identifier for
 * @param style the compiler style metadata
 * @returns an identifier generated for the component's styles
 */
const createStyleIdentifierFromUrl = (cmp: d.ComponentCompilerMeta, style: d.StyleCompiler): ts.Identifier => {
  style.styleIdentifier = dashToPascalCase(cmp.tagName);
  style.styleIdentifier = style.styleIdentifier.charAt(0).toLowerCase() + style.styleIdentifier.substring(1);

  if (style.modeName !== DEFAULT_STYLE_MODE) {
    style.styleIdentifier += dashToPascalCase(style.modeName);
  }

  style.styleIdentifier += 'Style';
  style.externalStyles = [style.externalStyles[0]];

  return ts.factory.createIdentifier(style.styleIdentifier);
};
