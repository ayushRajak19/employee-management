export interface Message { recipient: string; subject: string; body: string }
export interface MessageChannel { send(message: Message): Promise<void> }
export class DisabledEmailChannel implements MessageChannel { async send(): Promise<void> { /* SMTP can be enabled without changing notification business logic. */ } }
export const emailChannel: MessageChannel = new DisabledEmailChannel();
