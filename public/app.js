import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-database.js";
import * as dotenv from dotenv;
dotenv.config();

// Your Firebase project configuration
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MSG_SENDER_ID,
    appId: process.env.APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const db = ref(getDatabase());

get(child(db, 'jobs')).then((snapshot) => {
    if (snapshot.exists()) {
        const jobs = snapshot.val();
        Object.keys(jobs).forEach((key) => {
            const entry = jobs[key];
            const job = document.createElement('div');
            job.classList.add('job');
            job.innerHTML = `
                <h3 class="job__title">${entry.title}</h3>
                <a href=${entry.link}>Job posting</a>
                <div class="job__location">${entry.restaurant}</div>
                <div class="job__type">${entry.location}</div>
                <div class="job__description">${entry.date}</div>
            `;
            document.body.appendChild(job);
        });
    } else {
        console.log("No data available");
    }
}).catch((error) => {
    console.error(error);
});

