import AfricasTalking from "africastalking";

const client = AfricasTalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
});

const sms = client.SMS;

export async function sendSMS(to: string, message: string): Promise<void> {
  try {
    await sms.send({
      to: [to.startsWith("+") ? to : `+254${to.replace(/^0/, "")}`],
      message,
      from: process.env.AT_SENDER_ID || "EduFlow",
    });
  } catch (error) {
    console.error("SMS send error:", error);
  }
}

export function formatUSSDResponse(
  text: string,
  end: boolean = false
): string {
  return `${end ? "END" : "CON"} ${text}`;
}

export function parseUSSDInput(text: string): string[] {
  return text ? text.split("*") : [];
}