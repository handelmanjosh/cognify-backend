import { S3 } from 'aws-sdk';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { File } from '@prisma/client';
import { parsePDF } from '../lib/parse';

const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION
});
export async function s3uploadSingle(file: any) {
    const s3 = new S3();
    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `uploads/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDispostion: 'inline',
    };
    const result = await s3.upload(param).promise();
    return result;
}

export async function s3uploadMultiple(files: any) {
    const promises = [];
    for (let i = 0; i < files.length; i++) {
        promises.push(s3uploadSingle(files[i]));
    }
    const result = await Promise.all(promises);
    return result;
}

export async function getFileUrl(key: string) {
    const s3 = new S3();
    const getObjectParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Expires: 60 * 5,
        ResponseContentDisposition: 'inline',
    };
    // const command = new GetObjectCommand(getObjectParams);
    // const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const url = await s3.getSignedUrlPromise('getObject', getObjectParams);
    return url;
}

export async function getFileText(file: File): Promise<string> {
    const s3 = new S3();
    const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.key
    };
    if (file.type.includes("pdf")) {
        const result = await s3.getObject(s3Params).promise();
        const text = await parsePDF(result);
        return text;
    } else {
        //todo: implement handling of different file types
    }
    return "";
}

export async function getTextFromEmbedding(embedding: any) {
    const metadata = embedding.metadata;
    const s3 = new S3();
    const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: metadata.key
    };
    const file = await s3.getObject(s3Params).promise();
    // temp fix for only one vector db for prod and dev
    // some files may be in the vector db but not in the selected bucket
    if (file) {
        const text = await parsePDF(file);
        //console.log("Metadata: ", metadata);
        const finalText = text.slice(metadata.low, metadata.high);
        //console.log("FinalText: ", finalText);
        return finalText;
    } else {
        return "";
    }
}