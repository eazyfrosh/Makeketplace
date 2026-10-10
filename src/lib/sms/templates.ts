export const SMS_TEMPLATES = [
  {
    id: "appointment-reminder",
    title: "Appointment reminder",
    category: "Reminder",
    description: "Remind a customer about an upcoming appointment.",
    message:
      "Hello [Name], this is a reminder for your appointment with [Business name] on [Date] at [Time]. Reply if you need to reschedule.",
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
    id: "event-invitation",
    title: "Event invitation",
    category: "Invitation",
    description: "Invite a customer to an event and request a reply.",
    message:
      "Hello [Name], you are invited to [Event name] on [Date] at [Time]. Venue: [Location]. Reply YES to confirm your attendance.",
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
