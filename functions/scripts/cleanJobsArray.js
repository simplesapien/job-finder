function cleanJobsArray(data, entry) {
    data.forEach((job, index) => {
        if (job.description == entry.description) {
            data.splice(index, 1);
        }
    });
    return data;
}

module.exports = cleanJobsArray;