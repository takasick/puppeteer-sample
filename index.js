const puppeteer = require('puppeteer');

(async function main() {
  const targetPages = [
    'https://example.net/',
    'https://example.com/'
  ];

  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    args: [
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--window-size=1024,768'
    ]
  });

  let page;

  const pages = await browser.pages();
  if (pages.length === 0) {
    page = await browser.newPage();
  } else {
    page = pages.find((elm) => {
      if (elm.url() === 'about:blank') {
        return true;
      }
      return false;
    });

    if (page === undefined) {
      page = await browser.newPage();
    }
  }

  let targetPage;

  page._client.on('Network.requestWillBeSent', (evt) => {
    if (evt.request.mixedContentType === 'blockable') {
      console.error(`MIXED CONTENT: ${evt.request.url}`);
    } else if (evt.request.mixedContentType === 'optionally-blockable') {
      console.warn(`MIXED CONTENT: ${evt.request.url}`);
    }
  });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    let doBlock = false;

    if (req.resourceType() === 'image') {
      doBlock = true;
    }

    if (doBlock) {
      req.abort('aborted');
    } else {
      req.continue();
    }
  });

  page.on('requestfailed', (req) => {
    if (targetPage !== req.url()) {
      if (req.failure().errorText !== 'net::ERR_ABORTED') {
        console.error(`REQUEST FAILED: ${req.failure().errorText} ${req.url()}`);
      }
    }
  });

  page.on('response', (res) => {
    if (targetPage !== res.url()) {
      const status = res.status();
      if (status >= 400 && status <= 599) {
        console.error(`HTTP STATUS: ${res.status()} ${res.url()}`);
      }
    }
  });

  page.on('console', (msg) => {
    for (let i = 0, l = msg.args().length; i < l; ++i) {
      console.error(`CONSOLE OUTPUT: ${msg.type()} "${msg.text()}" ${msg.location().url}:${msg.location().lineNumber}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error(`SCRIPT ERROR: ${err.toString()}`);
  });

  // device emulate
  // await page.emulate(puppeteer.devices['iPhone 6']);

  for (let mainLoopCnt = 0, nPages = targetPages.length; mainLoopCnt < nPages; ++mainLoopCnt) {
    targetPage = targetPages[mainLoopCnt];
    console.time(targetPage);
    console.log(`TEST TARGET: ${targetPage}`);
    try {
      const response = await page.goto(targetPage, { waitUntil: 'networkidle0', timeout: 10000 });

      if (response.status() !== 200) {
        console.log(response.status());
      }

      if (response.request().redirectChain().length > 0) {
        console.log(`REDIRECT COUNT: ${response.request().redirectChain().length}`);
      }

      // List all Links
      const hrefs = await page.evaluate((selector) => {
        const elements = Array.from(document.getElementsByTagName(selector));
        return elements.map(elm => elm.href);
      }, 'a');

      for (let i = 0, l = hrefs.length; i < l; ++i) {
        const val = hrefs[i];
        console.error(`${val}`);
      }

      /* screenshot
      await page.screenshot({
        path: 'example.jpg',
        quality: 85,
        fullPage: true
      });
      */

      /* DOM
      let content = await page.content();
      */
    } catch (e) {
      if (e.name === 'TimeoutError') {
        console.error(`TIMEOUT: ${targetPage}`);
      } else {
        console.error(e.message);
        console.error(e);
      }
    }
    console.timeEnd(targetPage);
    console.log('');
  }
  await browser.close();
}());
