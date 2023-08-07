import { dayString, monthString } from "./date.js";
import { addData, removeData } from "./modal.js";

const loader = document.querySelector(".loader-container");
const modalContainer = document.querySelector(".modal");
const modalClose = document.querySelector(".modal-close");
const jobsContainer = document.querySelector(".jobs-container");

async function fetchData() {
  try {
    // Start preloader animation while data is being fetched
    loader.classList.add("fadeIn");

    const response = await fetch(
      "https://us-central1-job-finder-kh.cloudfunctions.net/retrieveData"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobs = await response.json();

    if (jobs) {
      // Sort by newest
      jobs.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      // Add to HTML document
      jobs.forEach((entry) => {
        const job = document.createElement("div");
        job.classList.add("job", "fadeIn");

        // Format date
        const date = new Date(entry.date);
        let day = dayString[date.getDay()];
        let month = monthString[date.getMonth()];
        const formattedDate = `${day}, ${month} ${date.getDate()}`;

        // Format the body of the job's HTML
        let body = `
          <p class="job-date">${formattedDate}</p>
          <h1 class="job-title">${entry.title}</h1>
          <p class="job-company">${entry.restaurant}</p>
          <p class="job-location">${entry.location}</p>
          <div class="job-description button">Info <img src='assets/info.svg'></div>     
          <a href="${entry.link}" target="_blank">
            <div class="job-link button">Apply <img src='assets/arrow.svg'></div>
          </a>
        `;

        // Add it to the DOM
        job.innerHTML = body;
        jobsContainer.appendChild(job);

        // Send modal obj to modal.js when the modal is either opened or closed. Enable/disable scroll if modal is closed/open.
        let jobButton = job.querySelector(".job-description");
        jobButton.addEventListener("click", () => addData(entry));
        modalClose.addEventListener("click", () => removeData());
      });

      // Hide the preloader once everything is loaded
      loader.classList.remove('fadeIn');
      loader.classList.add('fadeOut');
    } else {
      console.error("Failed to fetch and parse jobs");
    }
  } catch (error) {
    console.log("Error fetching data:" + error);
    loader.classList.remove('fadeIn');
    loader.classList.add('fadeOut');
  }
}

await fetchData();
