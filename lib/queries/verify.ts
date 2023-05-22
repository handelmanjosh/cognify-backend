import { User } from "@prisma/client";
import prisma from "../../prisma/seed";

export async function verifyUserAccessToFile(sessionId: string, orgId: string, key: string): Promise<boolean> {
    try {
        const filePromise = prisma.file.findUnique({ where: { key } });
        const orgPromise = prisma.organization.findUnique({ where: { id: orgId } });
        const userPromise = prisma.user.findUnique({ where: { sessionId } });
        const [file, org, user] = await Promise.all([filePromise, orgPromise, userPromise]);
        if (!file || !user || !org) return false;
        const userOrg = await prisma.usersOnOrganizations.findFirst({ where: { userId: user.id, organizationId: org.id } });
        if (file.organizationId == org.id && userOrg && userOrg.type !== "POTENTIAL") {
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function verifyUser(sessionId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        return user ? true : false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function verifyAdmin(sessionId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            if (user.role == 'ADMIN') {
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function verifyUserInOrgBySessionId(sessionId: string, orgId: string): Promise<boolean> {
    try {
        if (!sessionId || !orgId) return false;
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            return verifyUserInOrg(user, orgId);
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function verifyAdminInOrgBySessionId(sessionId: string, orgId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            return verifyAdminInOrg(user, orgId);
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function verifyOwnerInOrgBySessionId(sessionId: string, orgId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            return verifyOwnerInOrg(user, orgId);
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function verifyUserInOrg(user: User, orgId: string) {
    try {
        const orgUser = await prisma.usersOnOrganizations.findFirst({ where: { userId: user.id, organizationId: orgId } });
        if (orgUser && orgUser.type != "POTENTIAL") {
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function verifyAdminInOrg(user: User, orgId: string) {
    try {
        const orgUser = await prisma.usersOnOrganizations.findFirst({ where: { userId: user.id, organizationId: orgId } });
        if (orgUser && (orgUser.type == "ADMIN" || orgUser.type == "OWNER")) {
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function verifyOwnerInOrg(user: User, orgId: string) {
    try {
        const orgUser = await prisma.usersOnOrganizations.findFirst({ where: { userId: user.id, organizationId: orgId } });
        if (orgUser && orgUser.type == "OWNER") {
            return true;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
}