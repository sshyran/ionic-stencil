import type * as d from '@stencil/core/declarations';
import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';

import { validateConfig } from '../../config/validate-config';
import { OutputTargetWww, ServiceWorkerConfig } from '../../output-targets';
import { generateServiceWorkerUrl } from '../service-worker-util';

describe('generateServiceWorkerUrl', () => {
  let userConfig: d.Config;
  let outputTarget: OutputTargetWww;

  it('sw url w/ baseUrl', () => {
    userConfig = mockConfig({
      devMode: false,
      outputTargets: [
        {
          type: 'www',
          baseUrl: '/docs',
        } as OutputTargetWww,
      ],
    });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    outputTarget = config.outputTargets[0] as OutputTargetWww;
    const swUrl = generateServiceWorkerUrl(outputTarget, outputTarget.serviceWorker as ServiceWorkerConfig);
    expect(swUrl).toBe('/docs/sw.js');
  });

  it('default sw url', () => {
    userConfig = mockConfig({ devMode: false });
    const { config } = validateConfig(userConfig, mockLoadConfigInit());
    outputTarget = config.outputTargets[0] as OutputTargetWww;
    const swUrl = generateServiceWorkerUrl(outputTarget, outputTarget.serviceWorker as ServiceWorkerConfig);
    expect(swUrl).toBe('/sw.js');
  });
});
