import crypto from 'crypto';


export function hash(s: string): string {
    const h = crypto.createHash("sha256");
    h.update(s);
    return h.digest("hex");
}

export function genOrgCode(currentCodes: string[]): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    let code: string | undefined = undefined;
    while (!code || currentCodes.includes(code)) {
        let temp: string = "";
        for (let i = 0; i < 8; i++) {
            temp += characters[Math.floor(Math.random() * characters.length)];
        }
        code = temp;
    }
    return code;
}

