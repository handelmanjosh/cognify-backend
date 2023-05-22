import prisma from "../../prisma/seed";


export async function updateUserProfile(sessionId: string, bio: string, name: string, location: string, team: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            const profile = await prisma.profile.update({
                where: { id: user.profileId! },
                data: {
                    bio,
                    name,
                    location,
                    team
                }
            });
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function updateUserPreferences(sessionId: string, emailUpdates: boolean, fileUploadNotifications: boolean): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            const preferences = await prisma.userPreferences.update({
                where: { id: user.preferenceId! },
                data: {
                    emailUpdates,
                    fileUploadNotifications,
                }
            });
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}