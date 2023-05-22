import prisma from "../../prisma/seed";
import type { File, Organization, Profile, User, UserPreferences } from "@prisma/client";
import { verifyUserAccessToFile, verifyUserInOrgBySessionId } from "./verify";
import { getFileUrl } from "../../src/aws";
import { findChat } from "../mutations/chat";

export async function getUserProfile(sessionId: string): Promise<Profile | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { sessionId }
        });
        if (user) {
            const profile = await prisma.profile.findUnique({
                where: {
                    id: user.profileId!
                }
            });
            return profile;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}
export async function getUserPreferences(sessionId: string): Promise<UserPreferences | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { sessionId }
        });
        if (user) {
            const preferences = await prisma.userPreferences.findUnique({
                where: {
                    id: user.preferenceId!
                }
            });
            return preferences;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}
export async function getUser(sessionId: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                sessionId,
            }
        });
        return user;
    } catch (e) {
        console.error(e);
        return null;
    }
}
export async function getOrganization(sessionId: string): Promise<Organization[] | null> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            const orgusers = await prisma.usersOnOrganizations.findMany({
                where: {
                    userId: user.id
                }
            });
            const orgs: Organization[] = [];
            for await (const orguser of orgusers) {
                const org = await prisma.organization.findUnique({ where: { id: orguser.organizationId } });
                if (org) {
                    orgs.push(org);
                }
            }

            return orgs.length > 0 ? orgs : null;
        }
        return null;

    } catch (e) {
        console.error(e);
        return null;
    }
}
export async function getFile(sessionId: string, orgId: string, key: string): Promise<any> {
    const status = verifyUserAccessToFile(sessionId, orgId, key);
    if (status) {
        const file = await prisma.file.findUnique({ where: { key } });
        const tempUrl = await getFileUrl(key);
        return { ...file, tempUrl };
    } else {
        return null;
    }
}

export async function getOrgFiles(orgId: string): Promise<any> {
    try {
        if (!orgId) return [];
        const fileList = await prisma.file.findMany({ where: { organizationId: orgId } });
        return fileList;
    } catch (e) {
        console.error(e);
        return [];
    }
}
type UserResponse = {
    admins: string[];
    members: string[];
    potential: string[];
};
export async function getOrgUsers(sessionId: string, organizationId: string): Promise<UserResponse> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            const mePromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: user.id,
                    organizationId: organizationId
                }
            });
            const orgusersPromise = prisma.usersOnOrganizations.findMany({
                where: {
                    organizationId: organizationId,
                }
            });
            const [me, orgusers] = await Promise.all([mePromise, orgusersPromise]);
            const isAdmin = (me && (me.type == "ADMIN" || me.type == "OWNER"));
            const potential: string[] = [];
            const members: string[] = [];
            const admins: string[] = [];
            for await (const orguser of orgusers) {
                const user = await prisma.user.findUnique({ where: { id: orguser.userId } });
                if (user) {
                    if (orguser.type == "MEMBER") {
                        members.push(user.email);
                    } else if (orguser.type == "POTENTIAL") {
                        potential.push(user.email);
                    } else {
                        admins.push(user.email);
                    }
                }
            }
            if (isAdmin) {
                return { potential, members, admins };
            } else {
                return { potential: [], members, admins };
            }
        }
        return { admins: [], members: [], potential: [] };
    } catch (e) {
        console.error(e);
        return { admins: [], members: [], potential: [] };
    }
}

export async function getChats(sessionId: string, orgId: string) {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        const userOrg = await prisma.usersOnOrganizations.findFirst({ where: { userId: user.id, organizationId: orgId } });
        const chats = await prisma.chat.findMany({ where: { userId: userOrg.id } });
        return chats;
    } catch (e) {
        console.error(e);
    }
}
export async function getSingleChat(sessionId: string, orgId: string, id: string) {
    try {
        const chats = await getChats(sessionId, orgId);
        if (chats) {
            const chat = await findChat(chats, id);
            const messages = await getMessagesFromChat(chat.id);
            return { metadata: chat, history: messages };
        }
    } catch (e) {
        console.error(e);
    }
}

export async function getMessagesFromChat(chatId: string) {
    const messages = await prisma.message.findMany({ where: { chatId } });
    const result: [string, string, number][] = [];
    for (const message of messages) {
        result.push([message.message, message.type, message.index]);
    }
    result.sort((a: [string, string, number], b: [string, string, number]) => a[2] - b[2]);
    // console.log(result);
    return result;
}

