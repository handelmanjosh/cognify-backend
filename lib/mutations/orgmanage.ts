import prisma from '../../prisma/seed';


export async function acceptPotential(sessionId: string, orgId: string, email: string): Promise<boolean> {
    try {
        const adminPromise = prisma.user.findUnique({ where: { sessionId } });
        const targetPromise = prisma.user.findUnique({ where: { email } });
        const [admin, target] = await Promise.all([adminPromise, targetPromise]);
        if (admin && target) {
            const adminorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: admin.id,
                    organizationId: orgId,
                }
            });
            const targetorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: target.id,
                    organizationId: orgId,
                }
            });
            const [adminorg, targetorg] = await Promise.all([adminorgPromise, targetorgPromise]);
            if (adminorg && targetorg && (adminorg.type == "ADMIN" || adminorg.type == "OWNER") && targetorg.type == "POTENTIAL") {
                const targetorgFinal = await prisma.usersOnOrganizations.updateMany({
                    where: {
                        userId: target.id,
                        organizationId: orgId
                    },
                    data: {
                        type: "MEMBER"
                    }
                });
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function rejectPotential(sessionId: string, orgId: string, email: string): Promise<boolean> {
    try {
        const adminPromise = prisma.user.findUnique({ where: { sessionId } });
        const targetPromise = prisma.user.findUnique({ where: { email } });
        const [admin, target] = await Promise.all([adminPromise, targetPromise]);
        if (admin && target) {
            const adminorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: admin.id,
                    organizationId: orgId,
                }
            });
            const targetorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: target.id,
                    organizationId: orgId,
                }
            });
            const [adminorg, targetorg] = await Promise.all([adminorgPromise, targetorgPromise]);
            if (adminorg && targetorg && (adminorg.type == "ADMIN" || adminorg.type == "OWNER") && targetorg.type == "POTENTIAL") {
                const targetorgFinal = await prisma.usersOnOrganizations.deleteMany({
                    where: {
                        userId: target.id,
                        organizationId: orgId
                    },
                });
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function leaveOrganization(sessionId: string, orgId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        if (user) {
            const userorg = await prisma.usersOnOrganizations.deleteMany({
                where: {
                    id: user.id,
                    organizationId: orgId
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
export async function promoteMember(sessionId: string, orgId: string, email: string): Promise<boolean> {
    try {
        const adminPromise = prisma.user.findUnique({ where: { sessionId } });
        const targetPromise = prisma.user.findUnique({ where: { email } });
        const [admin, target] = await Promise.all([adminPromise, targetPromise]);
        if (admin && target) {
            const adminorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: admin.id,
                    organizationId: orgId,
                }
            });
            const targetorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: target.id,
                    organizationId: orgId,
                }
            });
            const [adminorg, targetorg] = await Promise.all([adminorgPromise, targetorgPromise]);
            if (adminorg && targetorg && adminorg.type == "OWNER" && targetorg.type == "MEMBER") {
                const targetorgFinal = await prisma.usersOnOrganizations.updateMany({
                    where: {
                        userId: target.id,
                        organizationId: orgId
                    },
                    data: {
                        type: "ADMIN"
                    }
                });
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function removeMember(sessionId: string, orgId: string, email: string) {
    try {
        const adminPromise = prisma.user.findUnique({ where: { sessionId } });
        const targetPromise = prisma.user.findUnique({ where: { email } });
        const [admin, target] = await Promise.all([adminPromise, targetPromise]);
        if (admin && target) {
            const adminorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: admin.id,
                    organizationId: orgId,
                }
            });
            const targetorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: target.id,
                    organizationId: orgId,
                }
            });
            const [adminorg, targetorg] = await Promise.all([adminorgPromise, targetorgPromise]);
            if (adminorg && targetorg && (adminorg.type == "ADMIN" || adminorg.type == "OWNER") && targetorg.type == "MEMBER") {
                const targetorgFinal = await prisma.usersOnOrganizations.deleteMany({
                    where: {
                        userId: target.id,
                        organizationId: orgId
                    },
                });
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function transferOwnership(sessionId: string, orgId: string, email: string) {
    try {
        const adminPromise = prisma.user.findUnique({ where: { sessionId } });
        const targetPromise = prisma.user.findUnique({ where: { email } });
        const [admin, target] = await Promise.all([adminPromise, targetPromise]);
        if (admin && target) {
            const adminorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: admin.id,
                    organizationId: orgId,
                }
            });
            const targetorgPromise = prisma.usersOnOrganizations.findFirst({
                where: {
                    userId: target.id,
                    organizationId: orgId,
                }
            });
            const [adminorg, targetorg] = await Promise.all([adminorgPromise, targetorgPromise]);
            if (adminorg && targetorg && adminorg.type == "OWNER" && targetorg.type == "ADMIN") {
                const targetorgFinal = await prisma.usersOnOrganizations.updateMany({
                    where: {
                        userId: target.id,
                        organizationId: orgId
                    },
                    data: {
                        type: "OWNER"
                    }
                });
                const adminorgFinal = await prisma.usersOnOrganizations.updateMany({
                    where: {
                        userId: admin.id,
                        organizationId: orgId
                    },
                    data: {
                        type: "ADMIN"
                    }
                });
            }
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}
export async function requestJoin(sessionId: string, code: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                sessionId,
            }
        });
        if (user) {
            const org = await prisma.organization.findUnique({
                where: {
                    code: code,
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
                        type: "POTENTIAL",
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