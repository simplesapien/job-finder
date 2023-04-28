const puppeteer = require("puppeteer");

async function eightysix() {
  // Launch a headless browser using Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  // Create a new page in the headless browser
  const page = await browser.newPage();

  // Navigate to the target URL and wait until the network is idle
  await page.goto("https://www.86network.com/search/jobs/vancouver-bc", {
    waitUntil: "networkidle0",
  });

  // Evaluate the page content
  const data = await page.evaluate(() => {
    // Get the jobs section of the page
    const list = document.querySelector("div[data-regular-jobs]");
    if (!list) return null;

    // Get all job items
    const listItems = list.querySelectorAll("a");
    let jobs = [];

    // Iterate through job items and extract relevant data
    for (let i = 0; i < listItems.length; i++) {

      const item = listItems[i];
      const jobTitle = item.querySelector(".job-title-headline").innerText;
      const matchFound = jobTitle.match(/\b(server|bartender)\b/i);

      if (matchFound) {

        const datePosted = item.querySelector('.job-posting-logo-wrapper > div > div:nth-child(2)').innerText
        let unformatteDate = new Date();
        const dateMatch = datePosted.match(/(\d+)\s*(minute|hour|day)s?/i);

        const unit = dateMatch[2]
        const value = dateMatch[1]

        if (unit == 'minute') {
          unformatteDate.setMinutes(unformatteDate.getMinutes() - parseInt(value));
        } else if (unit == 'hour') {
          unformatteDate.setHours(unformatteDate.getHours() - parseInt(value));
        } else if (unit == 'day') {
          unformatteDate.setDate(unformatteDate.getDate() - parseInt(value));
        }

        // Address is being written over again when it doesn't find a textNode
        let address = 'N/A'
        let addressContainer = item.querySelector('.job-posting-card-text > div');

        for (var j = 0; j < addressContainer.childNodes.length; j++) {
          var node = addressContainer.childNodes[j];

          // Check if the node is a text node
          if (node.nodeType === Node.TEXT_NODE) {
            let textNode = node.textContent.trim()
            if (textNode != '') address = textNode;
          }
        }

        const job = {
          title: jobTitle,
          link: item.href,
          location: address,
          restaurant: item.querySelector(".bolded-company-name").innerText,
          date: unformatteDate.toString()
        };

        jobs.push(job);
      }
    }


    return jobs;
  });

  await browser.close();

  return data;
}

module.exports = eightysix;