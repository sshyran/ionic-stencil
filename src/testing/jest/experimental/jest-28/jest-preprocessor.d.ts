/**
 * Determines if a file should be transformed prior to being consumed by Jest, based on the file name and its contents
 * @param filePath the path of the file
 * @param sourceText the contents of the file
 * @returns `true` if the file should be transformed, `false` otherwise
 */
export declare function shouldTransform(filePath: string, sourceText: string): boolean;
