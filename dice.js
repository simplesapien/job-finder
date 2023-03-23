const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.dice.com/");

  // Find the search input field and type "ham sandwich"
  const jobTitle = await page.$("#typeaheadInput");
  await jobTitle.type("web developer");

  const location = await page.$("#google-location-search");
  await location.type("Vancouver");

  const submit = await page.$("#submitSearch-button");
  await submit.click();

  await page.$("#ng-star-inserted:nth-child(1)");

  //   await browser.close();
})();
