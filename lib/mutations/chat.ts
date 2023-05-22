import { Chat } from "@prisma/client";
import prisma from "../../prisma/seed";
import type { SingleMessageRequest } from "../types";
import e from "express";


export const addMessageToChat = async (message: [string, string], id: string): Promise<boolean> => {
    try {
        const chat = await prisma.chat.findFirst({ where: { id } });
        const newMessage = await prisma.message.create({
            data: {
                message: message[0],
                type: message[1],
                index: chat.maxIndex,
                chat: {
                    connect: {
                        id: chat.id
                    }
                }

            }
        });
        const updatedChat = await prisma.chat.updateMany({
            where: { id },
            data: {
                maxIndex: chat.maxIndex + 1
            }
        });
        //console.log("Message added: ", newMessage);
        return true;
    } catch (e) {
        return false;
    }
};
export const createChat = async (sessionId: string, orgId: string, title: string): Promise<string> => {
    try {
        const user = await prisma.user.findUnique({ where: { sessionId } });
        const orgUser = await prisma.usersOnOrganizations.findFirst({ where: { userId: user.id, organizationId: orgId } });
        const newChat = await prisma.chat.create({
            data: {
                title,
                userOrg: {
                    connect: {
                        id: orgUser.id,
                    }
                }
            }
        });
        return newChat.id;
    } catch (e) {
        return "";
    }
};
export const findChat = async (chatList: Chat[], id: string): Promise<Chat | null> => {
    for (const chat of chatList) {
        if (chat.id === id) {
            return chat;
        }
    }
    return null;
};

export const deleteChat = async (sessionId: string, orgId: string, id: string): Promise<boolean> => {
    try {
        //anyone can theoretically delete chats, this does not matter
        const deleteMessageStatus = await prisma.message.deleteMany({
            where: {
                chatId: id
            }
        });
        const deleteChatStatus = await prisma.chat.delete({
            where: {
                id
            }
        });
        return true;
    } catch (e) {
        return false;
    }
};
export const updateTitle = async (sessionId: string, orgId: string, id: string, title: string): Promise<boolean> => {
    try {
        //anyone can theoretically update chat titles, this does not matter either
        const updatedChat = await prisma.chat.update({
            where: {
                id,
            },
            data: {
                title,
            }
        });
        return true;
    } catch (e) {
        return false;
    }
};