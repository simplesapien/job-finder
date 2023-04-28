// Import required modules
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const craigslist = require("./craigslist");
const eightysix = require("./eightysix");

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.database();

// Export a Firebase Function with increased memory

// Export a Firebase Function with increased memory
exports.testFunction = functions.runWith({ memory: "2GB" }).pubsub.schedule('every 1 hours')
    .onRun(async (context) => {
        try {
            const website1 = await craigslist();
            const website2 = await eightysix();
            const data = [...website1, ...website2]

            data.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            // Delete the 'jobs' node in the Firebase Realtime Database
            await db.ref("jobs").remove();

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