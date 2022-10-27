import ts from 'typescript';

import { retrieveTsModifiers } from './transform-utils';

/**
 * Derives a list on non-static getter properties to remove from the given class node.
 *
 * Properties that are both:
 * - static
 * - have a name that matches an entry in {@link REMOVE_STATIC_GETTERS}
 * will be returned @param classNode the class node to remove static entries from
 *
 * @param classNode the class declaration containing the collection of members to filter
 * @returns the list of properties that do not meet the aforementioned criteria*/
export const removeStaticMetaProperties = (classNode: ts.ClassDeclaration): ts.ClassElement[] => {
  if (classNode.members == null) {
    return [];
  }
  return classNode.members.filter((classMember) => {
    if (retrieveTsModifiers(classMember)?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)) {
      const memberName = (classMember.name as any).escapedText;
      if (REMOVE_STATIC_GETTERS.has(memberName)) {
        return false;
      }
    }
    return true;
  });
};

const REMOVE_STATIC_GETTERS = new Set([
  'is',
  'properties',
  'encapsulation',
  'elementRef',
  'events',
  'listeners',
  'methods',
  'states',
  'originalStyleUrls',
  'styleMode',
  'style',
  'styles',
  'styleUrl',
  'watchers',
  'styleUrls',
  'contextProps',
  'connectProps',
]);
