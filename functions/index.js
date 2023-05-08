// Import required modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const craigslist = require("./scrape/craigslist");
const eightysix = require("./scrape/eightysix");

// CORS fix
const cors = require("cors");

// Conifgure CORS middleware
const corsOptions = {
    origin: ["https://job-finder-kh.web.app", "https://job-finder-kh.web.app/"],
    optionsSuccessStatus: 200
};
const corsMiddleware = cors(corsOptions);

// Initialize the Firebase App + DB
admin.initializeApp();
const db = admin.database();

// Export a Firebase Function with increased memory
exports.scrapeJobs = functions.runWith({ memory: "2GB" }).pubsub.schedule('every 30 minutes')
    .onRun(async (context) => {
        try {
            // Scrape job postings, combine them into a single array
            const website1 = await craigslist();
            const website2 = await eightysix();
            const data = [...website1, ...website2]

            const snapshot = await db.ref("jobs").get();
            snapshot.forEach(el => {
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
                    if (job.restaurant == entry.restaurant &&
                        job.title == entry.title &&
                        job.location == entry.location) {
                        data.splice(index, 1);
                    }
                })
            });

            // Add the extracted data to the Firebase Realtime Database
            const promises = data.map((job) => {
                return db.ref("jobs").push(job);
            });
            await Promise.all(promises);
        }

        catch (error) {
            console.error("Error:", error);
        }
    })


exports.retrieveData = functions.https.onRequest((req, res) => {
    corsMiddleware(req, res, async () => {
        const jobs = []
        const snapshot = await db.ref("jobs").get();
        snapshot.forEach(el => {
            const entry = el.val();
            const job = {
                title: entry.title,
                link: entry.link,
                location: entry.location,
                restaurant: entry.restaurant,
                date: entry.date
            };
            jobs.push(job)
        })
        res.status(200).json(jobs);
    });
});
