const puppeteer = require("puppeteer");

// Function to find the description of a job posting
async function findDescription(browser, url) {
  const newPage = await browser.newPage();
  await newPage.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  const description = await newPage.evaluate(
    () => document.querySelector("#postingbody").innerText
  );

  await newPage.close();
  return description;
}

async function craigslist() {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Navigate to the target URL and wait until the page loads
    await page.goto("https://vancouver.craigslist.org/search/fbh", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const data = await page.evaluate(() => {
      // Get the jobs section of the page
      const list = document.querySelector("#search-results-page-1 > ol");
      if (!list) return null;

      console.log(list);
      // Get all job elements
      const listItems = list.querySelectorAll("li");
      let jobs = [];

      // Iterate through job items and extract relevant data
      for (let i = 0; i < listItems.length; i++) {
        const item = listItems[i];

        // Check if the job title contains certain keywords and doesn't contain certain keywords
        const contain = item.innerText.match(/\b(server|bartender)\b/i);
        const dontContain = item.innerText.match(/\b(assistant)\b/i);
        const matchFound = contain && !dontContain;

        if (matchFound) {
          // Get the date and format it to one that will be used across DB
          let unformatteDate = new Date(
            item.querySelector(".meta span:nth-child(1)").title
          );

          // Annoying workaround because the names of restaurants aren't wrapped in a tag
          let restaurantName = "N/A";
          let restaurantContainer = item.querySelector(".meta");
          let counter = 0;

          // Check for presence of an address as a text node (the address isn't wrapped in any kind of element/tag)
          for (var j = 0; j < restaurantContainer.childNodes.length; j++) {
            var node = restaurantContainer.childNodes[j];

            // Check if the node is a text node
            if (node.nodeType === Node.TEXT_NODE) {
              counter++;
              var text = node.textContent.trim();

              // If there is a second text node, it's the restaurant's name
              if (counter == 2) restaurantName = text;
            }
          }

          const job = {
            title: item.querySelector(".posting-title").innerText,
            link: item.querySelector(".posting-title").href,
            location: item.querySelector(".supertitle").innerText,
            restaurant: restaurantName,
            date: unformatteDate.toString(),
          };

          jobs.push(job);
        }
      }
      return jobs;
    });

    // Find the description for each job
    for (let job of data) {
      job.description = await findDescription(browser, job.link);
    }

    await browser.close();
    return data;
  } catch (err) {
    console.log(err);
  }
}

module.exports = craigslist;

