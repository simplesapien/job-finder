const craigslist = require('./sites/craigslist');
const eightysix = require('./sites/eightysix');

async function scrape() {
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
    return data;
}

module.exports = scrape;