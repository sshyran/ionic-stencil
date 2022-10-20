import type * as d from '../../declarations';
import { OutputTargetWww, ServiceWorkerConfig } from '../output-targets';
import { getRegisterSW, UNREGISTER_SW } from '../service-worker/generate-sw';
import { generateServiceWorkerUrl } from '../service-worker/service-worker-util';

export const updateIndexHtmlServiceWorker = async (
  config: d.Config,
  buildCtx: d.BuildCtx,
  doc: Document,
  outputTarget: OutputTargetWww
) => {
  const serviceWorker = outputTarget.serviceWorker;

  if (serviceWorker !== false) {
    if ((serviceWorker && serviceWorker.unregister) || (!serviceWorker && config.devMode)) {
      injectUnregisterServiceWorker(doc);
    } else if (serviceWorker) {
      await injectRegisterServiceWorker(buildCtx, outputTarget, doc);
    }
  }
};

const injectRegisterServiceWorker = async (buildCtx: d.BuildCtx, outputTarget: OutputTargetWww, doc: Document) => {
  const swUrl = generateServiceWorkerUrl(outputTarget, outputTarget.serviceWorker as ServiceWorkerConfig);
  const serviceWorker = getRegisterSwScript(doc, buildCtx, swUrl);
  doc.body.appendChild(serviceWorker);
};

const injectUnregisterServiceWorker = (doc: Document) => {
  const script = doc.createElement('script');
  script.innerHTML = UNREGISTER_SW;
  doc.body.appendChild(script);
};

const getRegisterSwScript = (doc: Document, buildCtx: d.BuildCtx, swUrl: string) => {
  const script = doc.createElement('script');
  script.setAttribute('data-build', `${buildCtx.timestamp}`);
  script.innerHTML = getRegisterSW(swUrl);
  return script;
};
