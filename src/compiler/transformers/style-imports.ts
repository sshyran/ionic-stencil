import ts from 'typescript';

import type * as d from '../../declarations';
import { serializeImportPath } from './stencil-import-path';
import { retrieveTsModifiers } from './transform-utils';

/**
 *
 * @param transformOpts
 * @param tsSourceFile
 * @param moduleFile
 * @returns
 */
export const updateStyleImports = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  moduleFile: d.Module
): ts.SourceFile => {
  // add style imports built from @Component() styleUrl option
  if (transformOpts.module === 'cjs') {
    return updateCjsStyleRequires(transformOpts, tsSourceFile, moduleFile);
  }

  return updateEsmStyleImports(transformOpts, tsSourceFile, moduleFile);
};

/**
 * Add it!
 * @param transformOpts
 * @param tsSourceFile
 * @param moduleFile
 * @returns
 */
const updateEsmStyleImports = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  moduleFile: d.Module
): ts.SourceFile => {
  const styleImports: ts.Statement[] = [];
  let statements = tsSourceFile.statements.slice();
  let updateSourceFile = false;

  moduleFile.cmps.forEach((cmp) => {
    cmp.styles.forEach((style) => {
      if (typeof style.styleIdentifier === 'string') {
        updateSourceFile = true;
        if (style.externalStyles.length > 0) {
          // add style imports built from @Component() styleUrl option
          styleImports.push(createEsmStyleImport(transformOpts, tsSourceFile, cmp, style));
        } else {
          // update existing esm import of a style identifier
          statements = updateEsmStyleImportPath(transformOpts, tsSourceFile, statements, cmp, style);
        }
      }
    });
  });

  if (updateSourceFile) {
    let lastImportIndex = -1;

    for (let i = 0; i < statements.length; i++) {
      if (ts.isImportDeclaration(statements[i])) {
        lastImportIndex = i;
      }
    }

    statements.splice(lastImportIndex + 1, 0, ...styleImports);

    return ts.factory.updateSourceFile(tsSourceFile, statements);
  }

  return tsSourceFile;
};

const updateEsmStyleImportPath = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  statements: ts.Statement[],
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler
): ts.Statement[] => {
  for (let i = 0; i < statements.length; i++) {
    const n = statements[i];
    if (ts.isImportDeclaration(n) && n.importClause && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      if (n.importClause.name && n.importClause.name.escapedText === style.styleIdentifier) {
        const orgImportPath = n.moduleSpecifier.text;
        const importPath = getStyleImportPath(transformOpts, tsSourceFile, cmp, style, orgImportPath);

        statements[i] = ts.factory.updateImportDeclaration(
          n,
          retrieveTsModifiers(n),
          n.importClause,
          ts.factory.createStringLiteral(importPath),
          undefined
        );
        break;
      }
    }
  }
  return statements;
};
/**
 * Generate an ESM style import of the format:
 * `import myComponentStyle from './my-component.css?tag=my-component&encapsulation=shadow'
 *
 * @param transformOpts the transform options for the current compilation pass
 * @param tsSourceFile the TypeScript source file that is performing the import of the css file
 * @param cmp the metadata for the component that uses the style
 * @param style the style metadata
 * @returns the generated ESM-style import
 */
const createEsmStyleImport = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler
): ts.ImportDeclaration => {
  const importName = ts.factory.createIdentifier(style.styleIdentifier);
  const importPath = getStyleImportPath(transformOpts, tsSourceFile, cmp, style, style.externalStyles[0].absolutePath);

  return ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(false, importName, undefined),
    ts.factory.createStringLiteral(importPath)
  );
};

const updateCjsStyleRequires = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  moduleFile: d.Module
) => {
  const styleRequires: ts.Statement[] = [];

  moduleFile.cmps.forEach((cmp) => {
    cmp.styles.forEach((style) => {
      if (typeof style.styleIdentifier === 'string' && style.externalStyles.length > 0) {
        // add style imports built from @Component() styleUrl option
        styleRequires.push(createCjsStyleRequire(transformOpts, tsSourceFile, cmp, style));
      }
    });
  });

  if (styleRequires.length > 0) {
    return ts.factory.updateSourceFile(tsSourceFile, [...styleRequires, ...tsSourceFile.statements]);
  }

  return tsSourceFile;
};

const createCjsStyleRequire = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler
) => {
  const importName = ts.factory.createIdentifier(style.styleIdentifier);
  const importPath = getStyleImportPath(transformOpts, tsSourceFile, cmp, style, style.externalStyles[0].absolutePath);

  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          importName,
          undefined,
          undefined,
          ts.factory.createCallExpression(
            ts.factory.createIdentifier('require'),
            [],
            [ts.factory.createStringLiteral(importPath)]
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
};

/** Build a serialized query string path for a CSS file.
 * @param transformOpts the transform options for the current compilation pass
 * @param tsSourceFile the TypeScript source file that is performing the import of the css file
 * @param cmp the metadata for the component that uses the style
 * @param style the style metadata
 * @param importPath the path to the css file
 * @returns the serialized query string path
 */
const getStyleImportPath = (
  transformOpts: d.TransformOptions,
  tsSourceFile: ts.SourceFile,
  cmp: d.ComponentCompilerMeta,
  style: d.StyleCompiler,
  importPath: string
) => {
  const importData: d.SerializeImportData = {
    importeePath: importPath,
    importerPath: tsSourceFile.fileName,
    tag: cmp.tagName,
    encapsulation: cmp.encapsulation,
    mode: style.modeName,
  };
  return serializeImportPath(importData, transformOpts.styleImportData);
};
