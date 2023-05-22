import { Configuration, OpenAIApi } from "openai";


const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


export const generateEmbeddings = async (text: string) => {
    const model = 'text-embedding-ada-002';
    const response = await openai.createEmbedding({
        model,
        input: text,
    });
    return response.data.data[0].embedding;
};

export const generateResponse = async (query: string, history: string[], context: string): Promise<{ response: [string, string], cost: any; }> => {
    const messages: any = [{ role: 'system', content: `You are a helpful assistant. Using this information as context: ${context}, answer the following question.` },];

    for (const message of history) {
        messages.push({ role: message[1] == "user" ? "user" : "assistant", content: message[0] });
    }
    messages.push({ role: 'user', content: query });

    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 200,
        temperature: 0.6,
    });
    return { response: [completion.data.choices[0].message?.content, 'text'], cost: completion.data.usage?.prompt_tokens };
};
// plan:

// generate embeddings for text within documents
// given query, retrieve documents which are highest ranked in similarity to query
// prompt ai with these documents, ask question
// store previously used documents in chat to be comsistently queried
