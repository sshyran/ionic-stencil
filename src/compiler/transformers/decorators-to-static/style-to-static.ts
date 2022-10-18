import { DEFAULT_STYLE_MODE } from '@utils';
import { basename, dirname, extname, join } from 'path';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { ConvertIdentifier, convertValueToLiteral, createStaticGetter } from '../transform-utils';

/**
 * Converts a Stencil component's styles to static members
 * @param newMembers a data structure containing elements in a component class, representing static getters to be used
 * later in the transpilation process. This argument will be mutated by this function, where new static styles will be
 * added to this data structure.
 * @param componentOptions configuration options for the component that were declared as a part of the `@Component()`:
 * ```ts
 * @Component({
 *   // componentOptions
 * })
 * class MyComponent() {...}
 * ```
 */
export const styleToStatic = (newMembers: ts.ClassElement[], componentOptions: d.ComponentOptions): void => {
  // container for styles that are 'default' for a component.
  // build this data structure up first, to be merged into a larger one containing all modes later on.
  const defaultModeStyles = [];

  if (componentOptions.styleUrls) {
    if (Array.isArray(componentOptions.styleUrls)) {
      // styleUrls that are an array of type string are assumed a part of the 'default' style mode
      defaultModeStyles.push(...normalizeStyleUrl(componentOptions.styleUrls));
    } else {
      // styleUrls that are provided as an object may have the 'default' style mode defined, normalize it if it exists
      defaultModeStyles.push(...normalizeStyleUrl(componentOptions.styleUrls[DEFAULT_STYLE_MODE]));
    }
  }

  if (componentOptions.styleUrl) {
    // a single url is assumed to be a part of the 'default' style mode
    defaultModeStyles.push(...normalizeStyleUrl(componentOptions.styleUrl));
  }

  // container for mode-specific styles
  let styleUrls: d.CompilerModeStyles = {};
  if (componentOptions.styleUrls && !Array.isArray(componentOptions.styleUrls)) {
    styleUrls = normalizeStyleUrls(componentOptions.styleUrls);
  }

  if (defaultModeStyles.length > 0) {
    styleUrls[DEFAULT_STYLE_MODE] = defaultModeStyles;
  }

  if (Object.keys(styleUrls).length > 0) {
    const originalStyleUrls = convertValueToLiteral(styleUrls);
    newMembers.push(createStaticGetter('originalStyleUrls', originalStyleUrls));
    // normalize the various style urls to use ".css" as an extension, for later use by the compiler.
    // if a project uses standard CSS, it is possible that the generated intermediate representation matches the one
    // generated immediately before this one
    const normalizedStyleExt = normalizeExtension(styleUrls);
    const normalizedStyleExp = convertValueToLiteral(normalizedStyleExt);
    newMembers.push(createStaticGetter('styleUrls', normalizedStyleExp));
  }

  if (typeof componentOptions.styles === 'string') {
    const styles = componentOptions.styles.trim();
    if (styles.length > 0) {
      // @Component({
      //   styles: ":host {...}"
      // })
      newMembers.push(createStaticGetter('styles', ts.factory.createStringLiteral(styles)));
    }
  } else if (componentOptions.styles) {
    const convertIdentifier = componentOptions.styles as any as ConvertIdentifier;
    if (convertIdentifier.__identifier) {
      // The `styles` object itself is imported:
      // import styles from './styles.css';
      // @Component({
      //   styles
      // })
      const stylesIdentifier = convertIdentifier.__escapedText;
      newMembers.push(createStaticGetter('styles', ts.factory.createIdentifier(stylesIdentifier)));
    } else if (typeof convertIdentifier === 'object') {
      // The `styles` object is defined as an object literal (whose members might be imported):
      // import ios from './ios.css';
      // import md from './md.css';
      // @Component({
      //   styles: {
      //     ios,
      //     md
      //   }
      // })
      if (Object.keys(convertIdentifier).length > 0) {
        newMembers.push(createStaticGetter('styles', convertValueToLiteral(convertIdentifier)));
      }
    }
  }
};

/**
 * Normalizes the extensions to ".css" for paths found in a data structure containing mode styles
 * @param styleUrls the styles to normalize
 * @returns the normalized data structure
 */
const normalizeExtension = (styleUrls: d.CompilerModeStyles): d.CompilerModeStyles => {
  const compilerStyleUrls: d.CompilerModeStyles = {};
  Object.keys(styleUrls).forEach((key) => {
    compilerStyleUrls[key] = styleUrls[key].map((s) => useCss(s));
  });
  return compilerStyleUrls;
};

/**
 * Converts style paths that use extensions such as `.scss` to `.css` for later use
 * @param stylePath the style path to convert
 * @returns the converted file name
 */
const useCss = (stylePath: string): string => {
  const sourceFileDir = dirname(stylePath);
  const sourceFileExt = extname(stylePath);
  // when capturing the source filename, it's important we keep "accordion.ios" in "accordion.ios.scss"
  const sourceFileName = basename(stylePath, sourceFileExt);
  return join(sourceFileDir, sourceFileName + '.css');
};

/**
 * Helper method for 'normalizing' a series of mode styles. In this context, normalization refers to ensuring that each
 * mode's styles are stored in as a list, as opposed to a single string value, undefined, etc.
 * @param styleUrls the styles to normalize
 * @returns the normalized styles
 */
const normalizeStyleUrls = (styleUrls: d.ModeStyles): d.CompilerModeStyles => {
  const compilerStyleUrls: d.CompilerModeStyles = {};
  Object.keys(styleUrls).forEach((key) => {
    compilerStyleUrls[key] = normalizeStyleUrl(styleUrls[key]);
  });
  return compilerStyleUrls;
};

/**
 * Helper method that 'normalizes' its argument by ensuring that the provided value is an array. In the event that the
 * provided value is not an array, it will be converted to one that contains the provided contents.
 * @param style the style value to normalize
 * @returns the normalized style argument
 */
const normalizeStyleUrl = (style: string | string[] | undefined): string[] => {
  if (Array.isArray(style)) {
    return style;
  }
  if (style) {
    return [style];
  }
  return [];
};
