export type NodeMap = WeakMap<any, ComponentCompilerMeta>;

/** Must be serializable to JSON!! */
export interface ComponentCompilerFeatures {
  hasAttribute: boolean;
  hasAttributeChangedCallbackFn: boolean;
  hasComponentWillLoadFn: boolean;
  hasComponentDidLoadFn: boolean;
  hasComponentShouldUpdateFn: boolean;
  hasComponentWillUpdateFn: boolean;
  hasComponentDidUpdateFn: boolean;
  hasComponentWillRenderFn: boolean;
  hasComponentDidRenderFn: boolean;
  hasComponentDidUnloadFn: boolean;
  hasConnectedCallbackFn: boolean;
  hasDisconnectedCallbackFn: boolean;
  hasElement: boolean;
  hasEvent: boolean;
  hasLifecycle: boolean;
  hasListener: boolean;
  hasListenerTarget: boolean;
  hasListenerTargetWindow: boolean;
  hasListenerTargetDocument: boolean;
  hasListenerTargetBody: boolean;
  /**
   * @deprecated Prevented from new apps, but left in for older collections
   */
  hasListenerTargetParent: boolean;
  hasMember: boolean;
  hasMethod: boolean;
  hasMode: boolean;
  hasProp: boolean;
  hasPropBoolean: boolean;
  hasPropNumber: boolean;
  hasPropString: boolean;
  hasPropMutable: boolean;
  hasReflect: boolean;
  hasRenderFn: boolean;
  hasState: boolean;
  hasStyle: boolean;
  hasVdomAttribute: boolean;
  hasVdomClass: boolean;
  hasVdomFunctional: boolean;
  hasVdomKey: boolean;
  hasVdomListener: boolean;
  hasVdomPropOrAttr: boolean;
  hasVdomRef: boolean;
  hasVdomRender: boolean;
  hasVdomStyle: boolean;
  hasVdomText: boolean;
  hasVdomXlink: boolean;
  hasWatchCallback: boolean;
  htmlAttrNames: string[];
  htmlTagNames: string[];
  htmlParts: string[];
  isUpdateable: boolean;
  isPlain: boolean;
  potentialCmpRefs: string[];
}

/** Must be serializable to JSON!! */
export interface ComponentCompilerMeta extends ComponentCompilerFeatures {
  assetsDirs: CompilerAssetDir[];
  componentClassName: string;
  elementRef: string;
  encapsulation: Encapsulation;
  shadowDelegatesFocus: boolean;
  excludeFromCollection: boolean;
  isCollectionDependency: boolean;
  docs: CompilerJsDoc;
  jsFilePath: string;
  sourceMapPath: string;
  listeners: ComponentCompilerListener[];
  events: ComponentCompilerEvent[];
  methods: ComponentCompilerMethod[];
  virtualProperties: ComponentCompilerVirtualProperty[];
  properties: ComponentCompilerProperty[];
  watchers: ComponentCompilerWatch[];
  sourceFilePath: string;
  states: ComponentCompilerState[];
  styleDocs: CompilerStyleDoc[];
  styles: StyleCompiler[];
  tagName: string;
  internal: boolean;
  legacyConnect: ComponentCompilerLegacyConnect[];
  legacyContext: ComponentCompilerLegacyContext[];

  dependencies?: string[];
  dependents?: string[];
  directDependencies?: string[];
  directDependents?: string[];
}

export interface CompilerAssetDir {
  absolutePath?: string;
  cmpRelativePath?: string;
  originalComponentPath?: string;
}

export interface ComponentCompilerData {
  exportLine: string;
  filePath: string;
  cmp: ComponentCompilerMeta;
  uniqueComponentClassName?: string;
  importLine?: string;
}



