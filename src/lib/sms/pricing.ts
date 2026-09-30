import "server-only";import{getSmsConfig}from"./config";
export function calculateSmsPrice(_country:string,segments:number){const trial=getSmsConfig().trialMode;return{currency:"NGN" as const,amountMinor:trial?0:Number(process.env.SMS_PRICE_PER_SEGMENT_MINOR??0)*segments,segments,trial}}
