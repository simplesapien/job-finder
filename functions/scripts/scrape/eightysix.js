const puppeteer = require("puppeteer");

// Find the description of a job posting
async function findDescription(browser, url) {
  try {
    const newPage = await browser.newPage();
    await newPage.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    const description = await newPage.evaluate(
      () =>
        document.querySelector(".job-posting--details > div > p:nth-of-type(3)")
          .innerText
    );
    await newPage.close();
    return description;
  } catch (err) {
    console.error(`Error occurred when finding the description for URL: ${url}. Error: ${err.message}`);
    throw err;
  }
}

// Main scraping function
async function eightysix() {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
    });
    const page = await browser.newPage();

    // Navigate to the target URL and wait until the network is idle
    await page.goto("https://www.86network.com/search/jobs/vancouver-bc", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const data = await page.evaluate(() => {
      try {
        const list = document.querySelector("div[data-regular-jobs]");
        if (!list) {
          throw new Error("Failed to find job listings element");
        }

        const listItems = list.querySelectorAll("a");
        let jobs = [];

        // Iterate through job items and extract relevant data
        for (let i = 0; i < listItems.length; i++) {
          const item = listItems[i];

          if (!item) {
            console.error(`Error: No item found at index ${i}`);
            continue;
          }

          const jobTitleElement = item.querySelector(".job-title-headline");
          // Rest of your code

          if (!jobTitleElement) {
            throw new Error(`Failed to find job title for item at index ${i}`);
          }
          const jobTitle = jobTitleElement.textContent;

          const datePostedElement = item.querySelector(
            ".job-posting-logo-wrapper > div > div:nth-child(2)"
          );
          if (!datePostedElement) {
            continue;
          }
          let datePosted = datePostedElement.textContent;

          const contain = item.innerText.match(/\b(server|bartender)\b/i);
          const dontContain = item.innerText.match(/\b(assistant)\b/i);
          const matchFound = contain && !dontContain;

          if (matchFound && datePosted) {
            let unformattedDate = new Date();
            const dateMatch = datePosted.match(/(\d+)\s*(minute|hour|day|month)s?/i);

            // The date is written as 'x minutes ago', 'x hours ago', or 'x days ago', so this is a way to normalize it
            const timeUnit = dateMatch[2];
            const value = dateMatch[1];
            if (timeUnit == "minute") {
              unformattedDate.setMinutes(
                unformattedDate.getMinutes() - parseInt(value)
              );
            } else if (timeUnit == "hour") {
              unformattedDate.setHours(unformattedDate.getHours() - parseInt(value));
            } else if (timeUnit == "day") {
              unformattedDate.setDate(unformattedDate.getDate() - parseInt(value));
            }
            // If it was written 'x months ago', we don't want to include it
            else if (timeUnit == "month") {
              continue;
            }

            // Set the address default to N/A unless an address is found
            let address = "N/A";
            let addressContainer = item.querySelector(
              ".job-posting-card-text > div"
            );

            if (!addressContainer) {
              throw new Error(`Failed to find address container for item at index ${i}`);
            }

            for (var j = 0; j < addressContainer.childNodes.length; j++) {
              var node = addressContainer.childNodes[j];

              // Check if the node is a text node
              if (node.nodeType === Node.TEXT_NODE) {
                let textNode = node.textContent.trim();
                if (textNode != "") address = textNode;
              }
            }

            const restaurantElement = item.querySelector(".bolded-company-name");
            if (!restaurantElement) {
              throw new Error(`Failed to find restaurant name for item at index ${i}`);
            }
            let restaurant = restaurantElement.textContent;

            const job = {
              title: jobTitle,
              link: item.href,
              location: address,
              restaurant: restaurant,
              date: unformattedDate.toString(),
            };

            jobs.push(job);
          }
        }
        return jobs;
      } catch (err) {
        console.error(`Error occurred during job data evaluation: ${err.message}`);
        throw err;
      }

    });

    // Add the job descriptions to each job object
    for (let job of data) {
      job.description = await findDescription(browser, job.link);
    }

    await browser.close();

    return data;
  } catch (err) {
    console.error(`Error occurred during web scraping: ${err.message}`);
    throw err; // Ensure error is propagated up
  }
}

module.exports = eightysix;