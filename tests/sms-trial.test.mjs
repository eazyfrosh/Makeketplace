import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("Twilio Messaging Service is optional and phone number is the fallback",()=>{const source=read("src/lib/sms/twilio-provider.ts");assert.match(source,/messagingServiceSid/);assert.match(source,/from:c\.phoneNumber/);assert.match(source,/SMS sender has not been configured/)});
test("send endpoint authenticates and requires consent",()=>{const source=read("src/app/api/sms/send/route.ts");assert.match(source,/verifyCaller/);assert.match(source,/body\.consent!==true/)});
test("Twilio webhook validates its signature",()=>{const source=read("src/app/api/webhooks/twilio/sms-status/route.ts");assert.match(source,/x-twilio-signature/);assert.match(source,/validateRequest/)});
test("Firestore prevents direct SMS access",()=>{const rules=read("firestore.rules");for(const name of["sms_messages","sms_requests","sms_rate_limits","sms_settings"])assert.match(rules,new RegExp(`match /${name}`));assert.match(rules,/match \/sms_messages\/\{messageId\} \{ allow read, write: if false; \}/)});
test("trial SMS pricing is zero and rate limiting is configurable",()=>{assert.match(read("src/lib/sms/pricing.ts"),/trial\?0/);assert.match(read("src/lib/sms/config.ts"),/SMS_RATE_LIMIT_PER_MINUTE/)});
test("client cannot submit sender controls",()=>{const route=read("src/app/api/sms/send/route.ts");assert.doesNotMatch(route,/body\.(from|sender|messagingServiceSid)/)});
test("SMS composer offers four editable one-click templates",()=>{const page=read("src/app/sms/page.tsx"),templates=read("src/lib/sms/templates.ts");assert.match(page,/SMS_TEMPLATES\.map/);assert.match(page,/setMessage\(template\.message\)/);for(const name of["Banking template","Order update","Event invitation","Support update"])assert.match(templates,new RegExp(name));assert.equal((templates.match(/id: "/g)??[]).length,4)});
