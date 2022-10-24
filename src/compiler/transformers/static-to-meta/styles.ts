import { DEFAULT_STYLE_MODE, sortBy } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { normalizeStyles } from '../../style/normalize-styles';
import { ConvertIdentifier, getStaticValue } from '../transform-utils';

/**
 * Parse the static "style" related members that were declared on a component.
 *
 * There are multiple ways to declare style(s) on a component, via various keywords on the `@Component` decorator and
 * the various data structures associated with each keyword. Each must be accounted for in this function.
 *
 * This function has a side effect of storing each the style mode name (including the default style mode) on the
 * compiler context.
 *
 * @param compilerCtx the current compiler context
 * @param tagName the tag for the web component that styles should be associated with
 * @param componentFilePath the fully qualified path to the containing the component's declaration
 * @param isCollectionDependency `true` if the dependency is part of a `collections` output target, `false` otherwise
 * @param staticMembers the static class elements for a component
 * @returns the parsed styles for a component
 */
export const parseStaticStyles = (
  compilerCtx: d.CompilerCtx,
  tagName: string,
  componentFilePath: string,
  isCollectionDependency: boolean,
  staticMembers: ts.ClassElement[]
): d.StyleCompiler[] => {
  const styles: d.StyleCompiler[] = [];
  // If the dependency is a collection, use URLs that have been normalized to use ".css".
  // Otherwise, use the original URL for the stylesheet.
  const styleUrlsProp = isCollectionDependency ? 'styleUrls' : 'originalStyleUrls';
  const parsedStyleUrls = getStaticValue(staticMembers, styleUrlsProp) as d.CompilerModeStyles;
  let parsedStyles = getStaticValue(staticMembers, 'styles');

  if (parsedStyles) {
    if (typeof parsedStyles === 'string') {
      // styles: 'div { padding: 10px }'
      parsedStyles = parsedStyles.trim();
      if (parsedStyles.length > 0) {
        styles.push({
          modeName: DEFAULT_STYLE_MODE,
          styleId: null,
          styleStr: parsedStyles,
          styleIdentifier: null,
          externalStyles: [],
        });
        compilerCtx.styleModeNames.add(DEFAULT_STYLE_MODE);
      }
    } else if ((parsedStyles as ConvertIdentifier).__identifier) {
      styles.push(parseStyleIdentifier(parsedStyles, DEFAULT_STYLE_MODE));
      compilerCtx.styleModeNames.add(DEFAULT_STYLE_MODE);
    } else if (typeof parsedStyles === 'object') {
      Object.keys(parsedStyles).forEach((modeName) => {
        const parsedStyleMode = parsedStyles[modeName];
        if (typeof parsedStyleMode === 'string') {
          styles.push({
            modeName: modeName,
            styleId: null,
            styleStr: parsedStyleMode,
            styleIdentifier: null,
            externalStyles: [],
          });
        } else {
          styles.push(parseStyleIdentifier(parsedStyleMode, modeName));
        }
        compilerCtx.styleModeNames.add(modeName);
      });
    }
  }

  if (parsedStyleUrls && typeof parsedStyleUrls === 'object') {
    Object.keys(parsedStyleUrls).forEach((modeName) => {
      const externalStyles: d.ExternalStyleCompiler[] = [];
      const styleObj = parsedStyleUrls[modeName];
      styleObj.forEach((styleUrl) => {
        if (typeof styleUrl === 'string' && styleUrl.trim().length > 0) {
          externalStyles.push({
            absolutePath: null,
            relativePath: null,
            originalComponentPath: styleUrl.trim(),
          });
        }
      });

      if (externalStyles.length > 0) {
        const style: d.StyleCompiler = {
          modeName: modeName,
          styleId: null,
          styleStr: null,
          styleIdentifier: null,
          externalStyles: externalStyles,
        };

        styles.push(style);
        compilerCtx.styleModeNames.add(modeName);
      }
    });
  }

  normalizeStyles(tagName, componentFilePath, styles);

  return sortBy(styles, (s) => s.modeName);
};

/**
 *
 * @param parsedStyle
 * @param modeName
 * @returns
 */
const parseStyleIdentifier = (parsedStyle: ConvertIdentifier, modeName: string): d.StyleCompiler => {
  const style: d.StyleCompiler = {
    modeName: modeName,
    styleId: null,
    styleStr: null,
    styleIdentifier: parsedStyle.__escapedText,
    externalStyles: [],
  };
  return style;
};
