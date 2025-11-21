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
  console.log("🚀 Craigslist scraper: Starting...");
  try {
    console.log("🌐 Craigslist scraper: Launching browser...");
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Navigate to the target URL and wait until the page loads
    console.log("🌐 Craigslist scraper: Navigating to Craigslist...");
    await page.goto("https://vancouver.craigslist.org/search/fbh", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    console.log("✅ Craigslist scraper: Page loaded");

    const data = await page.evaluate(() => {
      // Get the jobs section of the page - new structure uses div with id search-results-1
      const list = document.querySelector("#search-results-1");
      if (!list) {
        console.error("❌ Craigslist scraper: Main container (#search-results-1) not found!");
        return null;
      }

      console.log("✅ Craigslist scraper: Main container found");
      // Get all job elements - now they're divs with class cl-search-result
      const listItems = list.querySelectorAll("div.cl-search-result");
      console.log(`📋 Craigslist scraper: Found ${listItems.length} job listings`);
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
          const dateSpan = item.querySelector(".meta span:first-child");
          if (!dateSpan) {
            console.warn(`⚠️ Craigslist scraper: Date span not found for item ${i + 1}`);
          }
          let unformatteDate = dateSpan ? new Date(dateSpan.title) : new Date();

          // Extract restaurant name from meta section
          // Restaurant name appears after separators in the meta div
          let restaurantName = "N/A";
          const restaurantContainer = item.querySelector(".meta");
          
          if (restaurantContainer) {
            // Get all text nodes and find the last non-empty one before the button
            const textNodes = [];
            for (var j = 0; j < restaurantContainer.childNodes.length; j++) {
              var node = restaurantContainer.childNodes[j];
              // Stop before button elements
              if (node.nodeName === 'BUTTON') break;
              if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) textNodes.push(text);
              }
            }
            // The restaurant name is typically the last text node
            if (textNodes.length > 0) {
              restaurantName = textNodes[textNodes.length - 1];
            }
          }

          // Get title - now it's in a span with class "label" inside .posting-title
          const titleElement = item.querySelector(".posting-title .label") || item.querySelector(".posting-title");
          const title = titleElement ? titleElement.innerText : "N/A";
          if (title === "N/A") {
            console.warn(`⚠️ Craigslist scraper: Title not found for item ${i + 1}`);
          }
          
          // Get link
          const linkElement = item.querySelector(".posting-title");
          const link = linkElement ? linkElement.href : "N/A";
          if (link === "N/A") {
            console.warn(`⚠️ Craigslist scraper: Link not found for item ${i + 1}`);
          }
          
          // Get location - now it's the first div inside .result-info
          const resultInfo = item.querySelector(".result-info");
          const locationElement = resultInfo ? resultInfo.querySelector("div:first-child") : null;
          const location = locationElement ? locationElement.innerText : "N/A";
          if (location === "N/A") {
            console.warn(`⚠️ Craigslist scraper: Location not found for item ${i + 1}`);
          }

          // IMPORTANT: Output format must match the old version exactly
          // This object structure is used by findRestaurantName, getPlacesData, and index.js
          // Properties: title, link, location, restaurant, date (all strings)
          // Description is added later in the loop below
          const job = {
            title: title,
            link: link,
            location: location,
            restaurant: restaurantName,
            date: unformatteDate.toString(),
          };

          jobs.push(job);
        }
      }
      return jobs;
    });

    if (!data) {
      console.error("❌ Craigslist scraper: No data returned from page evaluation");
      await browser.close();
      return [];
    }

    console.log(`✅ Craigslist scraper: Extracted ${data.length} matching jobs before descriptions`);

    // Find the description for each job
    for (let i = 0; i < data.length; i++) {
      const job = data[i];
      console.log(`📄 Craigslist scraper: Fetching description ${i + 1}/${data.length} - ${job.title}`);
      try {
        job.description = await findDescription(browser, job.link);
        if (!job.description) {
          console.warn(`⚠️ Craigslist scraper: No description found for ${job.title}`);
        }
      } catch (error) {
        console.error(`❌ Craigslist scraper: Error fetching description for ${job.title}:`, error.message);
        job.description = ""; // Set empty string if description fetch fails
      }
    }

    console.log(`✅ Craigslist scraper: Completed. Returning ${data.length} jobs`);

    await browser.close();
    console.log(`✅ Craigslist scraper: Successfully completed. Returning ${data ? data.length : 0} jobs`);
    return data;
  } catch (err) {
    console.error("❌ Craigslist scraper: Fatal error:", err);
    console.error("❌ Craigslist scraper: Error stack:", err.stack);
    throw err; // Re-throw so the error can be caught by scrape.js
  }
}

module.exports = craigslist;