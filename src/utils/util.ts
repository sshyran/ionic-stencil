import { dashToPascalCase, isString, toDashCase } from './helpers';

export const createJsVarName = (fileName: string) => {
  if (isString(fileName)) {
    fileName = fileName.split('?')[0];
    fileName = fileName.split('#')[0];
    fileName = fileName.split('&')[0];
    fileName = fileName.split('=')[0];
    fileName = toDashCase(fileName);
    fileName = fileName.replace(/[|;$%@"<>()+,.{}_\!\/\\]/g, '-');
    fileName = dashToPascalCase(fileName);

    if (fileName.length > 1) {
      fileName = fileName[0].toLowerCase() + fileName.slice(1);
    } else {
      fileName = fileName.toLowerCase();
    }

    if (fileName.length > 0 && !isNaN(fileName[0] as any)) {
      fileName = '_' + fileName;
    }
  }
  return fileName;
};

/**
 * Determines if a given file path points to a type declaration file (ending in .d.ts) or not. This function is
 * case-insensitive in its heuristics.
 * @param filePath the path to check
 * @returns `true` if the given `filePath` points to a type declaration file, `false` otherwise
 */
export const isDtsFile = (filePath: string): boolean => {
  const parts = filePath.toLowerCase().split('.');
  if (parts.length > 2) {
    return parts[parts.length - 2] === 'd' && parts[parts.length - 1] === 'ts';
  }
  return false;
};

export const getDynamicImportFunction = (namespace: string) => `__sc_import_${namespace.replace(/\s|-/g, '_')}`;


/**
 * Check whether a string is a member of a ReadonlyArray<string>
 *
 * We need a little helper for this because unfortunately `includes` is typed
 * on `ReadonlyArray<T>` as `(el: T): boolean` so a `string` cannot be passed
 * to `includes` on a `ReadonlyArray` 😢 thus we have a little helper function
 * where we do the type coercion just once.
 *
 * see microsoft/TypeScript#31018 for some discussion of this
 *
 * @param readOnlyArray the array we're checking
 * @param maybeMember a value which is possibly a member of the array
 * @returns whether the array contains the member or not
 */
export const readOnlyArrayHasStringMember = <T extends string>(
  readOnlyArray: ReadonlyArray<T>,
  maybeMember: T | string
): boolean => readOnlyArray.includes(maybeMember as typeof readOnlyArray[number]);
