import { DEFAULT_STYLE_MODE, normalizePath } from '@utils';
import { dirname, isAbsolute, join, relative } from 'path';

import type * as d from '../../declarations';

/**
 * Helper function that "normalizes" a collection of compiler styles.
 *
 * In this function, to "normalize" means to:
 * - Create a uniform ID based on the tag name and the style mode name (e.g. 'ios', 'md', etc.)
 * - Modifying the paths of any external styles to include relative and absolute fields
 *
 * This function is expected to mutate the provided styles argument.
 *
 * @param tagName the tag name of the Stencil web component whose styles are being normalized
 * @param componentFilePath the fully qualified path of the file containing the Stencil component's declaration
 * @param styles the styles to normalize
 */
export const normalizeStyles = (tagName: string, componentFilePath: string, styles: d.StyleCompiler[]): void => {
  styles.forEach((style) => {
    if (style.modeName === DEFAULT_STYLE_MODE) {
      // Set the style ID to the uppercase name of the component. e.g. "MY-COMPONENT"
      style.styleId = tagName.toUpperCase();
    } else {
      // Set the style ID to the uppercase name of the component, with the mode name. `e.g. "MY-COMPONENT#ios"
      style.styleId = `${tagName.toUpperCase()}#${style.modeName}`;
    }

    if (Array.isArray(style.externalStyles)) {
      style.externalStyles.forEach((externalStyle) => {
        normalizeExternalStyle(componentFilePath, externalStyle);
      });
    }
  });
};

/**
 * Helper function that normalizes the paths of a component's external styles to include both relative and absolute
 * paths.
 * It does so by mutating the external style provided to this function.
 * @param componentFilePath the fully qualified path of the file containing the declaration of a Stencil component that
 * uses an external style
 * @param externalStyle the style to normalize
 */
const normalizeExternalStyle = (componentFilePath: string, externalStyle: d.ExternalStyleCompiler): void => {
  if (
    typeof externalStyle.originalComponentPath !== 'string' ||
    externalStyle.originalComponentPath.trim().length === 0
  ) {
    return;
  }

  // get the absolute path of the directory which the component is sitting in
  const componentDir = dirname(componentFilePath);

  if (isAbsolute(externalStyle.originalComponentPath)) {
    // this path is absolute already!
    // add to our list of style absolute paths
    externalStyle.absolutePath = normalizePath(externalStyle.originalComponentPath);

    // if this is an absolute path already, let's convert it to be relative
    externalStyle.relativePath = normalizePath(relative(componentDir, externalStyle.originalComponentPath));
  } else {
    // this path is relative to the component
    // add to our list of style relative paths
    externalStyle.relativePath = normalizePath(externalStyle.originalComponentPath);

    // create the absolute path to the style file
    externalStyle.absolutePath = normalizePath(join(componentDir, externalStyle.originalComponentPath));
  }
};
