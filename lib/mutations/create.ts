import prisma from '../../prisma/seed';
import { genOrgCode, hash } from "../methods";



export async function createUser(username: string, password: string, orgCode?: string): Promise<boolean> {
    try {
        password = hash(password);
        let p1 = prisma.profile.create({ data: {} });
        let p2 = prisma.userPreferences.create({ data: {} });
        const [profile, preferences] = await Promise.all([p1, p2]);
        const user = await prisma.user.create({
            data: {
                email: username,
                password,
                role: "USER",
                profile: {
                    connect: {
                        id: profile.id
                    }
                },
                preferences: {
                    connect: {
                        id: preferences.id
                    }
                }
            }
        });
        if (orgCode) {
            const org = await prisma.organization.findUnique({
                where: {
                    code: orgCode
                }
            });
            if (org) {
                const orguser = await prisma.usersOnOrganizations.create({
                    data: {
                        user: {
                            connect: {
                                id: user.id
                            }
                        },
                        organization: {
                            connect: {
                                id: org.id,
                            }
                        },
                        type: "POTENTIAL",
                    }
                });
            }

        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function createOrganization(name: string, sessionId: string): Promise<boolean> {
    try {
        let codes: any[] = await prisma.orgCodes.findMany();
        codes = codes.map((code) => code.code) as string[];
        const newCode: string = genOrgCode(codes);
        const user = await prisma.user.findUnique({
            where: {
                sessionId,
            }
        });
        if (user) {
            const codePromise = prisma.orgCodes.create({ data: { code: newCode } });
            const settingsPromise = prisma.organizationSettings.create({ data: {} });
            const [code, settings] = await Promise.all([codePromise, settingsPromise]);
            const org = await prisma.organization.create({
                data: {
                    name,
                    code: newCode,
                    settings: {
                        connect: {
                            id: settings.id
                        }
                    }

                },
            });
            if (org) {
                const orguser = await prisma.usersOnOrganizations.create({
                    data: {
                        user: {
                            connect: {
                                id: user.id
                            }
                        },
                        organization: {
                            connect: {
                                id: org.id
                            }
                        },
                        type: "OWNER",
                    }
                });
                return true;
            }
            return false;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function createAdmin(username: string, password: string): Promise<boolean> {
    try {
        password = hash(password);
        let p1 = prisma.profile.create({ data: {} });
        let p2 = prisma.userPreferences.create({ data: {} });
        const [profile, preferences] = await Promise.all([p1, p2]);
        const user = await prisma.user.create({
            data: {
                email: username,
                password,
                role: "ADMIN",
                profile: {
                    connect: {
                        id: profile.id
                    }
                },
                preferences: {
                    connect: {
                        id: preferences.id
                    }
                }
            }
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
