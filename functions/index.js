// Import required modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Import scripts
const scrape = require("./scripts/webscraping/scrape");
const cleanDB = require("./scripts/cleanDB");
const getPlacesData = require("./scripts/getPlacesData");
const checkForRestaurantName = require("./scripts/findRestaurantName");
const findRestaurantName = require("./scripts/findRestaurantName");

// Initialize the Firebase App + DB + CORS Middleware for retrieveData function
admin.initializeApp();
const db = admin.database();

// CORS middleware
const corsOptions = {
  origin: ["https://job-finder-kh.web.app", "https://job-finder-kh.web.app/"],
  optionsSuccessStatus: 200,
};

const corsMiddleware = cors(corsOptions);

// Export a Firebase Function with increased memory
exports.scrapeJobs = functions
  .runWith({ memory: "4GB", timeoutSeconds: 300 })
  .pubsub.schedule("every 10 minutes")
  .onRun(async (context) => {
    try {

      let data = await scrape();

      // Connect to DB + loop through each entry
      const snapshot = await db.ref("jobs").get();
      snapshot.forEach((el) => {
        const entry = el.val();

        // If any entries in the db are over a month old, delete them
        cleanDB(entry, db, el);

        // If jobs data already exists in the db, remove it from the array and continue
        data.forEach((job, index) => {
          if (job.description.normalize() === entry.description.normalize()) {
            data.splice(index, 1);
          }
        });
      });

      // Checks for missing restaurant name, fills it in if it can be found in the job description
      data = await findRestaurantName(data);

      // If googleData returns an error, log it, but continue with the rest of the data
      data = await getPlacesData(data);

      // Add the data to the DB, package as a single promise for efficiency
      const promises = data.map((job) => {
        return db.ref("jobs").push(job);
      });
      await Promise.all(promises);

      // Log the number of jobs scraped + job posts for debugging
      console.log(`Scraped ${data.length} jobs`);
      for (let i = 0; i < data.length; i++) {
        console.log(`Job #${i + 1} -> ${data[i].link}`);
      }

      return null;

    } catch (error) {
      console.error("Error:", error);
    }
  });


// HTTP Req Firebase Function that returns all jobs in the DB
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