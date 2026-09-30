export const SMS_STATUSES = ["queued", "accepted", "sending", "sent", "delivered", "undelivered", "failed"] as const;
export type SmsStatus = (typeof SMS_STATUSES)[number];
export interface SmsRecord { id:string; reference:string; userId:string; destination:string; country:string; messagePreview:string; provider:"twilio"; providerMessageId:string; status:SmsStatus; segments:number; createdAt:string; updatedAt:string; errorCode?:string }
export interface SmsProvider { send(input:{to:string;message:string;statusCallback:string}):Promise<{providerMessageId:string;status:SmsStatus}> }
export class SmsError extends Error { constructor(public code:string,message:string,public status=400){super(message)} }
