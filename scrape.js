const fs = require('fs');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

const siteURL = 'https://chromecastbg.alexmeub.com/';

const download_image = (url, image_path) => axios({
  url,
  responseType: 'stream',
}).then(response => new Promise((resolve, reject) => {
  response.data
    .pipe(fs.createWriteStream(image_path))
    .on('finish', () => resolve())
    .on('error', e => reject(e));
})).catch(error => {
  console.error(error);
});


(async function() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(siteURL);

  // AutoScroll until the end of the page
  await page.evaluate(async () => {
    const delay = 3000;
    const wait = (ms) => new Promise(res => setTimeout(res, ms));
    const count = async () => document.getElementsByTagName('figcaption').length;
    const scrollDown = async () => {
      const element = document.querySelector('li:last-child figcaption:last-child')
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
    }

    let preCount = 0;
    let postCount = 0;
    do {
      preCount = await count();
      await scrollDown();
      await wait(delay);
      postCount = await count();
    } while (postCount > preCount);
    await wait(delay);
  });

  const imageURLs = await page.evaluate(() => {
    return Array.from(document.getElementsByTagName('figcaption')).map(fig => fig.children[2]).map(anchor => anchor.href);
  });
  await browser.close();

  await Promise.all(imageURLs.map((url, index) => download_image(url, `images/background${index}.jpg`)));

})();

