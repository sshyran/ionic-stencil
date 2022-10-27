import { dashToPascalCase, DEFAULT_STYLE_MODE } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';
import { scopeCss } from '../../utils/shadow-css';
import { getScopeId } from '../style/scope-css';
import { createStaticGetter } from './transform-utils';

/**
 * Adds static "style" getter within the class
 * ```typescript
 * const MyComponent = class {
 *   static get style() { return "styles"; }
 * }
 * ```
 *
 * This is accomplished by mutating the provided `classMembers` argument
 *
 * @param classMembers a class to existing members of a class. **this parameter will be mutated** rather than returning
 * a cloned version
 * @param cmp the metadata associated with the component being evaluated
 * @param commentOriginalSelector if `true`, add a comment with the original CSS selector to the style.
 */
export const addStaticStyleGetterWithinClass = (
  classMembers: ts.ClassElement[],
  cmp: d.ComponentCompilerMeta,
  commentOriginalSelector: boolean
): void => {
  const styleLiteral = getStyleLiteral(cmp, commentOriginalSelector);
  if (styleLiteral) {
    classMembers.push(createStaticGetter('style', styleLiteral));
  }
};

/**
 * Adds static "style" property to the class variable.
 *
 * ```typescript
 * const MyComponent = class {}
 * MyComponent.style = "styles";
 * ```
 *
 * This is accomplished by mutating the provided `styleStatements` argument
 *
 * @param styleStatements a list of statements containing style assignments to a class
 * @param cmp the metadata associated with the component being evaluated
 */
export const addStaticStylePropertyToClass = (styleStatements: ts.Statement[], cmp: d.ComponentCompilerMeta): void => {
  const styleLiteral = getStyleLiteral(cmp, false);
  if (styleLiteral) {
    const statement = ts.factory.createExpressionStatement(
      ts.factory.createAssignment(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(cmp.componentClassName), 'style'),
        styleLiteral
      )
    );
    styleStatements.push(statement);
  }
};

// TODO(NOW): 2x check these
/**
 * Get a representation of a style from a component.
 *
 * A representation can take on different forms:
 * - An identifier (e.g. something that has been imported by name: `import styles from './styles.css';`
 * - A string (e.g. "overflow: hidden");
 * - An object literal (e.g. `{"$": ["overflow: hidden"]}`
 * @param cmp the component to get the styles from
 * @param commentOriginalSelector if `true`, add a comment with the original CSS selector to the style.
 * @returns the retrieved style representations, or null if the styles on a component are empty
 */
const getStyleLiteral = (
  cmp: d.ComponentCompilerMeta,
  commentOriginalSelector: boolean
): ts.ObjectLiteralExpression | ts.Identifier | ts.StringLiteral | null => {
  if (Array.isArray(cmp.styles) && cmp.styles.length > 0) {
    if (cmp.styles.length > 1 || (cmp.styles.length === 1 && cmp.styles[0].modeName !== DEFAULT_STYLE_MODE)) {
      // multiple style modes
      return getMultipleModeStyle(cmp, cmp.styles, commentOriginalSelector);
    } else {
      // single style
      return getSingleStyle(cmp, cmp.styles[0], commentOriginalSelector);
    }
  }
  return null;
};

const getMultipleModeStyle = (
  cmp: d.ComponentCompilerMeta,
  styles: d.StyleCompiler[],
  commentOriginalSelector: boolean
): ts.ObjectLiteralExpression => {
  const styleModes: ts.ObjectLiteralElementLike[] = [];

  styles.forEach((style) => {
    if (typeof style.styleStr === 'string') {
      // inline the style string
      // static get style() { return { ios: "string" }; }
      const styleLiteral = createStyleLiteral(cmp, style, commentOriginalSelector);
      const propStr = ts.factory.createPropertyAssignment(style.modeName, styleLiteral);
      styleModes.push(propStr);
    } else if (typeof style.styleIdentifier === 'string') {
      // direct import already written in the source code
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { ios: myTagIosStyle }; }
      const styleIdentifier = ts.factory.createIdentifier(style.styleIdentifier);
      const propIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleIdentifier);
      styleModes.push(propIdentifier);
    } else if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
      // import generated from @Component() styleUrls option
      // import myTagIosStyle from './import-path.css';
      // static get style() { return { ios: myTagIosStyle }; }
      const styleUrlIdentifier = createStyleIdentifierFromUrl(cmp, style);
      const propUrlIdentifier = ts.factory.createPropertyAssignment(style.modeName, styleUrlIdentifier);
      styleModes.push(propUrlIdentifier);
    }
  });

  return ts.factory.createObjectLiteralExpression(styleModes, true);
};

const getSingleStyle = (
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
  commentOriginalSelector: boolean
): ts.StringLiteral | ts.Identifier => {
  if (typeof style.styleStr === 'string') {
    // inline the style string
    // static get style() { return "string"; }
    return createStyleLiteral(cmp, style, commentOriginalSelector);
  }

  if (typeof style.styleIdentifier === 'string') {
    // direct import already written in the source code
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    return ts.factory.createIdentifier(style.styleIdentifier);
  }

  if (Array.isArray(style.externalStyles) && style.externalStyles.length > 0) {
    // import generated from @Component() styleUrls option
    // import myTagStyle from './import-path.css';
    // static get style() { return myTagStyle; }
    return createStyleIdentifierFromUrl(cmp, style);
  }

  return null;
};

/**
 * Create a {@link ts.StringLiteral} version of a literal CSS string
 * @param cmp the component metadata that uses the CSS string
 * @param style the style metadata whose literal CSS string will be converted to a TS node
 * @param commentOriginalSelector
 * @returns the new TS node
 */
const createStyleLiteral = (
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
  commentOriginalSelector: boolean
): ts.StringLiteral => {
  if (cmp.encapsulation === 'scoped' || (commentOriginalSelector && cmp.encapsulation === 'shadow')) {
    // scope the css first
    const scopeId = getScopeId(cmp.tagName, style.modeName);
    return ts.factory.createStringLiteral(scopeCss(style.styleStr, scopeId, commentOriginalSelector));
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
