import prisma from '../../prisma/seed';
import { hash } from "../methods";


export default async function login(username: string, password: string): Promise<string> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: username
            }
        });
        if (user) {
            password = hash(password);
            if (user.password === password) {
                const id = hash(String(new Date()));
                const u = await prisma.user.update({
                    where: {
                        email: username,
                    },
                    data: {
                        sessionId: id
                    }
                });
                return id;
            }
        }
        return "";
    } catch (e) {
        console.error(e);
        return "";
    }
}