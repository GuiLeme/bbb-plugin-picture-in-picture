// eslint-disable-next-line import/no-extraneous-dependencies
import {
  test, expect, BrowserContext, Browser, APIRequestContext, TestInfo,
} from '@playwright/test';
import { checkPluginAvailability } from '../core/fixtures/pluginBeforeAll';
import { ELEMENT_WAIT_LONGER_TIME } from '../core/constants';
import { elements as e } from '../elements';
import { SessionPage as ModPage } from '../core/sessionPage';
import { Plugin } from '../core/plugin';
import { encodeCustomParams } from '../core/helpers';
import { installVisibilityOverride, setTabHidden } from '../core/tabVisibilityDriver';
import { openPipWindow } from '../core/pipWindowHelper';

const PLUGIN_NAME = 'picture-in-picture';
const ENV_VAR_NAME = 'PICTURE_IN_PICTURE_PLUGIN_URL';

let pluginUrl: string | undefined = process.env[ENV_VAR_NAME];
const setPluginUrl = (url: string) => { pluginUrl = url; };
const getPluginUrl = () => pluginUrl;

test.describe('Picture-in-Picture Plugin - minimised presentation', () => {
  let modPage: ModPage;
  let context: BrowserContext;

  async function setupMeeting(browser: Browser, request: APIRequestContext, testInfo: TestInfo) {
    await checkPluginAvailability({
      pluginName: PLUGIN_NAME,
      setPluginUrl,
      getPluginUrl,
    })({ request }, testInfo);

    const createParameter = encodeCustomParams(
      `pluginManifests=${JSON.stringify([{ url: getPluginUrl() }])}`,
    );
    context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await installVisibilityOverride(context);
    const page = await context.newPage();
    const plugin = new Plugin({ browser });
    await plugin.initModPage(page, { createParameter });
    modPage = plugin.modPage;
  }

  test.beforeEach(async ({ browser, request }, testInfo) => {
    await setupMeeting(browser, request, testInfo);
  });

  test.afterEach(async () => {
    await context?.close();
  });

  test('hides the slide tile while the presentation is minimised', async () => {
    await modPage.page.waitForSelector(e.whiteboard, { timeout: ELEMENT_WAIT_LONGER_TIME });
    const pipPage = await openPipWindow(context, modPage.page);
    const slide = pipPage.locator('.pip-slide-item');

    await expect(slide).toBeVisible({ timeout: ELEMENT_WAIT_LONGER_TIME });

    await modPage.page.click('[data-test="minimizePresentation"]');
    await expect(slide).toHaveCount(0, { timeout: ELEMENT_WAIT_LONGER_TIME });

    await modPage.page.click('[data-test="restorePresentation"]');
    await expect(slide).toBeVisible({ timeout: ELEMENT_WAIT_LONGER_TIME });

    await setTabHidden(modPage.page, false);
  });
});
