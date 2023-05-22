import prisma from '../../prisma/seed';


export default async function logout(sessionId: string): Promise<boolean> {
    try {
        const user = await prisma.user.update({
            where: {
                sessionId,
            },
            data: {
                sessionId: "",
            }
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}