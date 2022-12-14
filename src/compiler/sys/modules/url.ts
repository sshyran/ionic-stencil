import { basicURLParse, serializePath, serializeURL } from 'whatwg-url';
    // inlineDynamicImports: true,
export { URL } from 'whatwg-url';

export const pathToFileURL = (path: string) => serializeURL(basicURLParse(path, { stateOverride: 'file' }));

export const fileURLToPath = (fileURL: string) => serializePath(basicURLParse(fileURL));
