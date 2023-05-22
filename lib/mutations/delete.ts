import prisma from '../../prisma/seed';

export async function deleteUser(sessionId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            const d = await prisma.user.delete({ where: { sessionId } });
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function deleteUserAsAdmin(username: string, password: string, sessionId: string): Promise<boolean> {
    const admin = await prisma.user.findUnique({
        where: {
            sessionId,
        }
    });
    if (admin) {
        if (admin.role === "ADMIN") {
            const result = await prisma.user.deleteMany({
                where: {
                    email: username,
                    password,
                }
            });
            return true;
        }
    }
    return false;
}
export async function deleteOrganization(name: string, sessionId: string) {

}