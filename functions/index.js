// Import required modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Import scripts
const craigslist = require("./scripts/scrape/craigslist");
const eightysix = require("./scripts/scrape/eightysix");
const gptCheck = require("./scripts/gptCheck");

// Import data script for Places API
const googleData = require("./scripts/googleData");

// Conifgure CORS middleware
const corsOptions = {
  origin: ["https://job-finder-kh.web.app", "https://job-finder-kh.web.app/"],
  optionsSuccessStatus: 200,
};
const corsMiddleware = cors(corsOptions);

// Initialize the Firebase App + DB
admin.initializeApp();
const db = admin.database();

// Export a Firebase Function with increased memory
exports.scrapeJobs = functions
  .runWith({ memory: "4GB", timeoutSeconds: 300 })
  .pubsub.schedule("every 10 minutes")
  .onRun(async (context) => {
    try {
      // Scrape job postings, combine them into a single array
      let website1, website2;
      try {
        website1 = await craigslist();
      } catch (error) {
        throw new Error(`Error while scraping Craigslist: ${error.message}`);
      }
      try {
        website2 = await eightysix();
      } catch (error) {
        throw new Error(`Error while scraping 86network: ${error.message}`);
      }
      const data = [...website1, ...website2];

      const snapshot = await db.ref("jobs").get();
      snapshot.forEach((el) => {
        const entry = el.val();

        // If any entries in the db are over a month old, delete them
        const today = new Date();
        const date = new Date(entry.date);
        const diffTime = Math.abs(today - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          db.ref("jobs").child(el.key).remove();
        }

        // If data already exists in the db, remove it from the array and continue
        data.forEach((job, index) => {
          if (
            job.restaurant == entry.restaurant &&
            job.title == entry.title &&
            job.location == entry.location
          ) {
            data.splice(index, 1);
          }
        });
      });

      // If the restaurant name is missing, pass the description to the OpenAI API to get the restaurant name
      for (let i = 0; i < data.length; i++) {
        if (data[i].restaurant == "N/A") {
          try {
            const restaurant = await gptCheck(data[i].description, data[i].title);
            if (restaurant) data[i].restaurant = restaurant;
          } catch (error) {
            console.error(`Error while fetching restaurant name from OpenAI for job title: ${data[i].title}, description: ${data[i].description}`, error);
          }
        }
      }

      // If googleData returns an error, log it, but continue with the rest of the data
      for (let i = 0; i < data.length; i++) {
        if (data[i].restaurant != "N/A") {
          const place = `${data[i].restaurant} Vancouver`;
          try {
            let placeData = await googleData(place);
            if (placeData) {
              data[i].rating = placeData.rating;
              data[i].reviews = placeData.reviews;
              data[i].photos = placeData.photos;
            }
          } catch (error) {
            console.error(`Error while fetching Google Places data for place: ${place}, job: ${JSON.stringify(data[i])}`, error);
          }
        }
      }

      // Add the extracted data to the Firebase Realtime Database
      const promises = data.map((job) => {
        return db.ref("jobs").push(job);
      });
      await Promise.all(promises);

    } catch (error) {
      console.error("Error:", error);
    }
  });

exports.retrieveData = functions.https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    const jobs = [];
    const snapshot = await db.ref("jobs").get();
    snapshot.forEach((el) => {
      const entry = el.val();
      const job = {
        title: entry.title,
        link: entry.link,
        location: entry.location,
        restaurant: entry.restaurant,
        date: entry.date,
        description: entry.description,
        rating: entry.rating,
        reviews: entry.reviews,
        photos: entry.photos,
      };
      jobs.push(job);
    });
    res.status(200).json(jobs);
  });
});
