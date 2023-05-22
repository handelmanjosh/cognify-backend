import { PineconeClient } from "@pinecone-database/pinecone";
import { generateEmbeddings } from "./ai";
import { v4 as uuid } from 'uuid';
import { getFileText } from "./aws";
import { parseRecentlyUploaded } from "../lib/parse";

const pinecone = new PineconeClient();
const init = async () => {
    await pinecone.init({
        environment: process.env.PINECONE_ENVIRONMENT,
        apiKey: process.env.PINECONE_API_KEY
    });
};
//metadata of orgId
export const getPineconeInfo = async () => {
    await init();
    const indexesList = await pinecone.listIndexes();
    console.log(indexesList);
};

export const getSimilarEmbeddings = async (embedding: any, n: number, orgId: string) => {
    await init();
    const index = pinecone.Index("test");
    const request = {
        queryRequest: {
            topK: n,
            vector: embedding,
            includeMetadata: true,
            filter: { orgId: { "$eq": orgId } }
        }
    };
    const queryResponse = await index.query(request);
    return queryResponse.matches ?? [];
};
const BUFFER_SIZE = 100; // in characters. Can't do words because of pdf encoding
export const uploadFileEmbeddings = async (file: any, key: string, orgId: string) => {
    console.log("called");
    const text = await parseRecentlyUploaded(file);
    const embeddings: [any, [number, number]][] = [];
    for (let i = 0; i < text.length; i += 1) {
        let words = "";
        for (let ii = 0; ii < BUFFER_SIZE && i < text.length; ii++, i++) {
            if (isAlphaNumeric(text[i])) {
                words += text[i];
            } else {
                ii--;
            }
        }
        if (words.length > 10) {
            const bounds = getBoundingPos(text, i, i + words.length, 0);
            //console.log(bounds);
            const embedding: [any, [number, number]] = [await generateEmbeddings(words), bounds];
            //const embedding: [any, [number, number]] = [await generateEmbeddings(sentence), [i, i + sentence.length]];
            embeddings.push(embedding);
        }
        console.log(`${i / text.length * 100}%`);
    }
    await init();
    const index = pinecone.Index('test');
    const vectors = [];
    for (const embedding_group of embeddings) {
        const id = uuid();
        const embedding = embedding_group[0];
        const vector = {
            id,
            values: embedding,
            metadata: { orgId, key, low: embedding_group[1][0], high: embedding_group[1][1] }
        };
        vectors.push(vector);
    }
    for (let i = 0; i < vectors.length; i += 100) {
        const currentVectors = errorBoundedSlice(vectors, i, 100);
        const request = {
            upsertRequest: {
                vectors: currentVectors
            }
        };
        console.log("uploading");
        const result = await index.upsert(request);
        console.log("uploaded");
    }
    return "done";
};

export function errorBoundedStringSlice(s: string, start: number, length: number): string {
    if (start + length >= s.length) {
        return s.slice(start, s.length);
    } else {
        return s.slice(start, start + length);
    }
}
export function errorBoundedSlice<T>(array: T[], start: number, length: number): T[] {
    if (start + length >= array.length) {
        return array.slice(start, array.length);
    } else {
        return array.slice(start, start + length);
    }
}
export function getBoundingPos(s: string, start: number, end: number, width: number): [number, number] {
    let result: [number, number] =
        [
            start - width < 0 ? 0 : start - width,
            end + width >= s.length ? s.length - 1 : end + width
        ];
    return result;
}

//s is a single character
const options = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxzy1234567890";
function isAlphaNumeric(s: string): boolean {
    return options.includes(s);
}



