const openai = require('openai');

const Configuration = openai.Configuration;
const OpenAIApi = openai.OpenAIApi;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openaiInstance = new OpenAIApi(configuration);

const example = [
    {
        role: 'system',
        content: `Find the company name in any of the job postings the user submits. Return only the company name with no punctuation. If one is not found, return only 'N/A'`
    },
    {
        role: 'user',
        content: 'Vietnamese restaurant in Coquitlam hiring for Server positions, both full and part time.\n\nPositions available immediately, please reply to the ad with your contact information.\n\n-No experience required, training provided for positions.\n-MUST be able to work in Canada.\n-Location close to Coquitlam Centre Mall and is close to bus and skytrain.\n\nServer Job Duties:\n• Greet and seat patrons, and present menus.\n• Take and serve orders from customers accurately and with a positive attitude.\n• Engage with customers in a friendly manner.\n• Help with small front of house food preparation when necessary.\n• Package takeout orders and ensure orders are complete.'
    },
    {
        role: 'assistant',
        content: 'N/A'
    }];

async function gptCheck(description, jobTitle) {
    try {
        const completion = await openaiInstance.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [...example, { role: "user", content: description }],
            max_tokens: 2000,
        });
        return completion.data.choices[0].message.content;
    } catch (err) {
        console.log(`Error while fetching restaurant name from OpenAI for job title: ${jobTitle}, description: ${description}`, err);
    }
}

module.exports = gptCheck;