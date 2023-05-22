

export type SingleMessageRequest = {
    id: string;
    title: string;
    messages: ChatMessage[];
};
export type ChatMessage = [string, string];