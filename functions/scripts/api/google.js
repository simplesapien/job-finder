const axios = require("axios");

// Use the restaurant string to find the place_id of the restaurant
async function getPlaceIdByName(name) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        name
      )}&inputtype=textquery&fields=place_id&key=${process.env.GOOGLE_API_KEY}`
    );
    return response.data.candidates[0].place_id;
  } catch (error) {
    console.error(`Error occurred when getting the Place ID by name: ${name}`);
  }
}

// Use that place_id to get the business details
async function getBusinessDetails(placeId) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${process.env.GOOGLE_API_KEY}`
    );
    return response.data.result;
  } catch (error) {
    console.error(`Error occurred when getting business details: ${error.message}`);
    throw error;
  }
}

// Extract the data we want from the business details, return it in an obj to be added to the job object
async function googleData(place) {
  try {
    let placeId = await getPlaceIdByName(place);
    let businessDetails = await getBusinessDetails(placeId);
    let obj = {};
    obj.rating = businessDetails.rating;
    obj.reviews = businessDetails.user_ratings_total;
    obj.photos = [];

    // Added this step to get the photo references, then use them to get the actual photos without the API key present in the URL
    for (let i = 0; i < 3; i++) {
      let smallphoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${businessDetails.photos[i].photo_reference}&key=${process.env.GOOGLE_API_KEY}`;
      let largephoto = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${businessDetails.photos[i].photo_reference}&key=${process.env.GOOGLE_API_KEY}`;
      try {
        let imgrefs = {};
        const response = await axios.get(smallphoto, {
          maxRedirects: 0,
          validateStatus: function (status) {
            return status === 302;
          },
        });
        imgrefs["small"] = response.headers.location;
        const response2 = await axios.get(largephoto, {
          maxRedirects: 0,
          validateStatus: function (status) {
            return status === 302;
          },
        });
        imgrefs["large"] = response2.headers.location;
        obj.photos.push(imgrefs);
      } catch (error) {
        console.error(`Error occurred when fetching photos: ${error.message}`);
      }
    }
    return obj;
  } catch (error) {
    throw error;
  }
}

module.exports = googleData;