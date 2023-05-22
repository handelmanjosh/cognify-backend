import pdfParse from 'pdf-parse';


// Set a custom worker loader
export async function parse(file: any) {
    if (file.mimetype == "application/pdf") {
        return await parsePDF(file);
    } else {
        throw new Error("Filetype not supported");
    }
}
export async function parsePDF(file: any): Promise<string> {
    const result = await pdfParse(file.Body);
    return result.text;
}

export async function parsePDFRecentlyUploaded(file: any): Promise<string> {
    const result = await pdfParse(file.buffer);
    return result.text;
}

export async function parseRecentlyUploaded(file: any): Promise<string> {
    if (file.mimetype == "application/pdf") {
        return await parsePDFRecentlyUploaded(file);
    } else {
        throw new Error("Filetype not supported");
    }
}
