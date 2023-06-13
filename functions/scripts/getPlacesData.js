// Import data script for Places API
const google = require("./api/google");

async function getPlacesData(data) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].restaurant != "N/A") {
            const place = `${data[i].restaurant} Vancouver`;
            try {
                let placeData = await google(place);
                if (placeData) {
                    data[i].rating = placeData.rating;
                    data[i].reviews = placeData.reviews;
                    data[i].photos = placeData.photos;
                }
            } catch (error) {
                console.error(JSON.stringify(data[i]));
            }
        }
    }
    return data;
}

module.exports = getPlacesData;