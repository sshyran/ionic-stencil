const lineBreakRegex = /\r?\n|\r/g;

export function getTextDocs(docs: d.CompilerJsDoc | undefined | null) {
  if (docs == null) {
    return '';
  }
  return `${docs.text.replace(lineBreakRegex, ' ')}
${docs.tags
  .filter((tag) => tag.name !== 'internal')
  .map((tag) => `@${tag.name} ${(tag.text || '').replace(lineBreakRegex, ' ')}`)
  .join('\n')}`.trim();
}
