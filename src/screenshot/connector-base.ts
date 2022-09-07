import type * as d from '@stencil/core/internal';
import { tmpdir } from 'os';
import { join } from 'path';

import { emptyDir, fileExists, mkDir, readDir, readFile, readFileBuffer, rmDir, writeFile } from './screenshot-fs';

export class ScreenshotConnector implements d.ScreenshotConnector {
  allowableMismatchedPixels: number;
  allowableMismatchedRatio: number;
  appNamespace: string;
  buildAuthor: string;
  buildId: string;
  buildMessage: string;
  buildTimestamp: number;
  buildUrl: string;
  buildsDir: string;
  buildsDirName = 'builds';
  cacheDir: string;
  currentBuildDir: string;
  imagesDir: string;
  imagesDirName = 'images';
  logger: d.Logger;
  masterBuildFileName = 'master.json';
  masterBuildFilePath: string;
  packageDir: string;
  pixelmatchModulePath: string;
  pixelmatchThreshold: number;
  previewUrl: string;
  rootDir: string;
  screenshotCacheFileName = 'screenshot-cache.json';
  screenshotCacheFilePath: string;
  screenshotDir: string;
  screenshotDirName = 'screenshot';
  updateMaster: boolean;
  waitBeforeScreenshot: number;

  async initBuild(opts: d.ScreenshotConnectorOptions) {
    this.logger = opts.logger;

    this.buildId = opts.buildId;
    this.buildMessage = opts.buildMessage || '';
    this.buildAuthor = opts.buildAuthor;
    this.buildUrl = opts.buildUrl;
    this.previewUrl = opts.previewUrl;
    (this.buildTimestamp = typeof opts.buildTimestamp === 'number' ? opts.buildTimestamp : Date.now()),
      (this.cacheDir = opts.cacheDir);
    this.packageDir = opts.packageDir;
    this.rootDir = opts.rootDir;
    this.appNamespace = opts.appNamespace;
    this.waitBeforeScreenshot = opts.waitBeforeScreenshot;
    this.pixelmatchModulePath = opts.pixelmatchModulePath;

    if (!opts.logger) {
      throw new Error(`logger option required`);
    }

    if (typeof opts.buildId !== 'string') {
      throw new Error(`buildId option required`);
    }

    if (typeof opts.cacheDir !== 'string') {
      throw new Error(`cacheDir option required`);
    }

    if (typeof opts.packageDir !== 'string') {
      throw new Error(`packageDir option required`);
    }

    if (typeof opts.rootDir !== 'string') {
      throw new Error(`rootDir option required`);
    }

    this.updateMaster = !!opts.updateMaster;
    this.allowableMismatchedPixels = opts.allowableMismatchedPixels;
    this.allowableMismatchedRatio = opts.allowableMismatchedRatio;
    this.pixelmatchThreshold = opts.pixelmatchThreshold;

    this.logger.debug(`screenshot build: ${this.buildId}, ${this.buildMessage}, updateMaster: ${this.updateMaster}`);
    this.logger.debug(
      `screenshot, allowableMismatchedPixels: ${this.allowableMismatchedPixels}, allowableMismatchedRatio: ${this.allowableMismatchedRatio}, pixelmatchThreshold: ${this.pixelmatchThreshold}`
    );

    if (typeof opts.screenshotDirName === 'string') {
      this.screenshotDirName = opts.screenshotDirName;
    }

    if (typeof opts.imagesDirName === 'string') {
      this.imagesDirName = opts.imagesDirName;
    }

    if (typeof opts.buildsDirName === 'string') {
      this.buildsDirName = opts.buildsDirName;
    }

    this.screenshotDir = join(this.rootDir, this.screenshotDirName);
    this.imagesDir = join(this.screenshotDir, this.imagesDirName);
    this.buildsDir = join(this.screenshotDir, this.buildsDirName);
    this.masterBuildFilePath = join(this.buildsDir, this.masterBuildFileName);
    this.screenshotCacheFilePath = join(this.cacheDir, this.screenshotCacheFileName);
    this.currentBuildDir = join(tmpdir(), 'screenshot-build-' + this.buildId);

    this.logger.debug(`screenshotDirPath: ${this.screenshotDir}`);
    this.logger.debug(`imagesDirPath: ${this.imagesDir}`);
    this.logger.debug(`buildsDirPath: ${this.buildsDir}`);
    this.logger.debug(`currentBuildDir: ${this.currentBuildDir}`);
    this.logger.debug(`cacheDir: ${this.cacheDir}`);

    await mkDir(this.screenshotDir);

    await Promise.all([
      mkDir(this.imagesDir),
      mkDir(this.buildsDir),
      mkDir(this.currentBuildDir),
      mkDir(this.cacheDir),
    ]);
  }

  async pullMasterBuild() {
    /**/
  }

  async getMasterBuild() {
    let masterBuild: d.ScreenshotBuild = null;

    try {
      masterBuild = JSON.parse(await readFile(this.masterBuildFilePath));
    } catch (e) {}

    return masterBuild;
  }

  async completeBuild(masterBuild: d.ScreenshotBuild) {
    const filePaths = (await readDir(this.currentBuildDir))
      .map((f) => join(this.currentBuildDir, f))
      .filter((f) => f.endsWith('.json'));
    const screenshots = await Promise.all(filePaths.map(async (f) => JSON.parse(await readFile(f)) as d.Screenshot));

    this.sortScreenshots(screenshots);

    if (!masterBuild) {
      masterBuild = {
        appNamespace: this.appNamespace,
        author: this.buildAuthor,
        id: this.buildId,
        message: this.buildMessage,
        previewUrl: this.previewUrl,
        screenshots: screenshots,
        timestamp: this.buildTimestamp,
        url: this.buildUrl,
      };
    }

    const results: d.ScreenshotBuildResults = {
      appNamespace: this.appNamespace,
      compare: {
        a: {
          author: masterBuild.author,
          id: masterBuild.id,
          message: masterBuild.message,
          previewUrl: masterBuild.previewUrl,
          url: masterBuild.url,
        },
        appNamespace: this.appNamespace,
        b: {
          author: this.buildAuthor,
          id: this.buildId,
          message: this.buildMessage,
          previewUrl: this.previewUrl,
          url: this.buildUrl,
        },
        diffs: [],
        id: `${masterBuild.id}-${this.buildId}`,
        timestamp: this.buildTimestamp,
        url: null,
      },
      currentBuild: {
        appNamespace: this.appNamespace,
        author: this.buildAuthor,
        id: this.buildId,
        message: this.buildMessage,
        previewUrl: this.previewUrl,
        screenshots: screenshots,
        timestamp: this.buildTimestamp,
        url: this.buildUrl,
      },
      masterBuild: masterBuild,
    };

    results.currentBuild.screenshots.forEach((screenshot) => {
      screenshot.diff.device = screenshot.diff.device || screenshot.diff.userAgent;
      results.compare.diffs.push(screenshot.diff);
      delete screenshot.diff;
    });

    this.sortCompares(results.compare.diffs);

    await emptyDir(this.currentBuildDir);
    await rmDir(this.currentBuildDir);

    return results;
  }

  async publishBuild(results: d.ScreenshotBuildResults) {
    return results;
  }

  async generateJsonpDataUris(build: d.ScreenshotBuild) {
    if (build && Array.isArray(build.screenshots)) {
      for (let i = 0; i < build.screenshots.length; i++) {
        const screenshot = build.screenshots[i];

        const jsonpFileName = `screenshot_${screenshot.image}.js`;
        const jsonFilePath = join(this.cacheDir, jsonpFileName);
        const jsonpExists = await fileExists(jsonFilePath);

        if (!jsonpExists) {
          const imageFilePath = join(this.imagesDir, screenshot.image);
          const imageBuf = await readFileBuffer(imageFilePath);
          const jsonpContent = `loadScreenshot("${screenshot.image}","data:image/png;base64,${imageBuf.toString(
            'base64'
          )}");`;
          await writeFile(jsonFilePath, jsonpContent);
        }
      }
    }
  }

  async getScreenshotCache() {
    return null as d.ScreenshotCache;
  }

  async updateScreenshotCache(screenshotCache: d.ScreenshotCache, buildResults: d.ScreenshotBuildResults) {
    screenshotCache = screenshotCache || {};
    screenshotCache.timestamp = this.buildTimestamp;
    screenshotCache.lastBuildId = this.buildId;
    screenshotCache.size = 0;
    screenshotCache.items = screenshotCache.items || [];

    if (buildResults && buildResults.compare && Array.isArray(buildResults.compare.diffs)) {
      buildResults.compare.diffs.forEach((diff) => {
        if (typeof diff.cacheKey !== 'string') {
          return;
        }

        if (diff.imageA === diff.imageB) {
          // no need to cache identical matches
          return;
        }

        const existingItem = screenshotCache.items.find((i) => i.key === diff.cacheKey);
        if (existingItem) {
          // already have this cached, but update its timestamp
          existingItem.ts = this.buildTimestamp;
        } else {
          // add this item to the cache
          screenshotCache.items.push({
            key: diff.cacheKey,
            mp: diff.mismatchedPixels,
            ts: this.buildTimestamp,
          });
        }
      });
    }

    // sort so the newest items are on top
    screenshotCache.items.sort((a, b) => {
      if (a.ts > b.ts) return -1;
      if (a.ts < b.ts) return 1;
      if (a.mp > b.mp) return -1;
      if (a.mp < b.mp) return 1;
      return 0;
    });

    // keep only the most recent items
    screenshotCache.items = screenshotCache.items.slice(0, 1000);

    screenshotCache.size = screenshotCache.items.length;

    return screenshotCache;
  }

  toJson(masterBuild: d.ScreenshotBuild, screenshotCache: d.ScreenshotCache) {
    const masterScreenshots: { [screenshotId: string]: string } = {};
    if (masterBuild && Array.isArray(masterBuild.screenshots)) {
      masterBuild.screenshots.forEach((masterScreenshot) => {
        masterScreenshots[masterScreenshot.id] = masterScreenshot.image;
      });
    }

    const mismatchCache: { [cacheKey: string]: number } = {};
    if (screenshotCache && Array.isArray(screenshotCache.items)) {
      screenshotCache.items.forEach((cacheItem) => {
        mismatchCache[cacheItem.key] = cacheItem.mp;
      });
    }

    const screenshotBuild: d.ScreenshotBuildData = {
      allowableMismatchedPixels: this.allowableMismatchedPixels,
      allowableMismatchedRatio: this.allowableMismatchedRatio,
      buildId: this.buildId,
      buildsDir: this.buildsDir,
      cache: mismatchCache,
      currentBuildDir: this.currentBuildDir,
      imagesDir: this.imagesDir,
      masterScreenshots: masterScreenshots,
      pixelmatchModulePath: this.pixelmatchModulePath,
      pixelmatchThreshold: this.pixelmatchThreshold,
      rootDir: this.rootDir,
      screenshotDir: this.screenshotDir,
      timeoutBeforeScreenshot: this.waitBeforeScreenshot,
      updateMaster: this.updateMaster,
    };

    return JSON.stringify(screenshotBuild);
  }

  sortScreenshots(screenshots: d.Screenshot[]) {
    return screenshots.sort((a, b) => {
      if (a.desc && b.desc) {
        if (a.desc.toLowerCase() < b.desc.toLowerCase()) return -1;
        if (a.desc.toLowerCase() > b.desc.toLowerCase()) return 1;
      }

      if (a.device && b.device) {
        if (a.device.toLowerCase() < b.device.toLowerCase()) return -1;
        if (a.device.toLowerCase() > b.device.toLowerCase()) return 1;
      }

      if (a.userAgent && b.userAgent) {
        if (a.userAgent.toLowerCase() < b.userAgent.toLowerCase()) return -1;
        if (a.userAgent.toLowerCase() > b.userAgent.toLowerCase()) return 1;
      }

      if (a.width < b.width) return -1;
      if (a.width > b.width) return 1;

      if (a.height < b.height) return -1;
      if (a.height > b.height) return 1;

      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;

      return 0;
    });
  }

  sortCompares(compares: d.ScreenshotDiff[]) {
    return compares.sort((a, b) => {
      if (a.allowableMismatchedPixels > b.allowableMismatchedPixels) return -1;
      if (a.allowableMismatchedPixels < b.allowableMismatchedPixels) return 1;

      if (a.allowableMismatchedRatio > b.allowableMismatchedRatio) return -1;
      if (a.allowableMismatchedRatio < b.allowableMismatchedRatio) return 1;

      if (a.desc && b.desc) {
        if (a.desc.toLowerCase() < b.desc.toLowerCase()) return -1;
        if (a.desc.toLowerCase() > b.desc.toLowerCase()) return 1;
      }

      if (a.device && b.device) {
        if (a.device.toLowerCase() < b.device.toLowerCase()) return -1;
        if (a.device.toLowerCase() > b.device.toLowerCase()) return 1;
      }

      if (a.userAgent && b.userAgent) {
        if (a.userAgent.toLowerCase() < b.userAgent.toLowerCase()) return -1;
        if (a.userAgent.toLowerCase() > b.userAgent.toLowerCase()) return 1;
      }

      if (a.width < b.width) return -1;
      if (a.width > b.width) return 1;

      if (a.height < b.height) return -1;
      if (a.height > b.height) return 1;

      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;

      return 0;
    });
  }
}
