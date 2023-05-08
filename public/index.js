async function fetchData() {
    try {
        const response = await fetch('https://us-central1-job-finder-kh.cloudfunctions.net/retrieveData');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jobs = JSON.stringify(data);

        if (jobs) {
            const jobsArray = JSON.parse(jobs);
            //  Sort by date
            jobsArray.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            // Add to HTML document
            jobsArray.forEach(entry => {
                const job = document.createElement('div');
                job.classList.add('job');

                // Format date
                const date = new Date(entry.date);
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
                    'October', 'November', 'December'
                ];
                let day = days[date.getDay()]
                let month = months[date.getMonth() + 1]

                const formattedDate = `${day} / ${month} ${date.getDate()}}`

                let body = `
                    <h2>${entry.title}</h2>
                    <a href="${entry.link}" target="_blank">Link</a>
                    <p>${entry.restaurant}</p>
                    <p>${entry.location}</p>
                    <p>${formattedDate}</p>
                `
                job.innerHTML = body;
                document.body.appendChild(job);
            });
        } else {
            console.error('Failed to fetch and parse jobs');
        }

    } catch (error) {
        console.log('Error fetching data:' + error);
    }
}
fetchData();