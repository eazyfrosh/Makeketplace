export const SMS_TEMPLATES = [
  {
    id: "banking-template",
    title: "Banking template",
    category: "Banking",
    description: "Share a concise transaction notification with a customer.",
    message:
      "Txn:CREDIT\nAc:2XX..37X\nAmt:USD 2,048.00\nDes:Atlas\nDate:16-09-2026 20:13\nBal:USD *******",
  },
  {
    id: "order-update",
    title: "Order update",
    category: "Orders",
    description: "Share a clear delivery or order-status update.",
    message:
      "Hello [Name], your order [Order number] is now [Status]. View the latest update here: [Secure link]. Thank you, [Business name].",
  },
  {
    id: "otp-code",
    title: "OTP code",
    category: "Verification",
    description: "Send a short one-time verification code message.",
    message:
      "Your MyCompany verification code is: 870207. Do not share this code with anyone.",
  },
  {
    id: "support-update",
    title: "Support update",
    category: "Support",
    description: "Let a customer know their support request has changed.",
    message:
      "Hello [Name], your support request [Ticket number] has been updated: [Short update]. Contact [Business name] if you still need help.",
  },
] as const;

export type SmsTemplateId = (typeof SMS_TEMPLATES)[number]["id"];
