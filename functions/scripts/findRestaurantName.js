const gpt = require("./api/gpt");

// If the restaurant name is missing, pass the description to the OpenAI API to get the restaurant name
// The '3' in the gptCheck function call is the number of retries in case of network congestion
async function findRestaurantName(data) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].restaurant == "N/A") {
            try {
                const restaurant = await gpt(data[i].description, data[i].title, 3);
                if (restaurant) data[i].restaurant = restaurant;
            } catch (error) {
                console.log(`Error while fetching restaurant name from OpenAI for job title: ${data[i].title}, description: ${data[i].description}`, error);
            }
        }
    }
    return data;
}

module.exports = findRestaurantName;