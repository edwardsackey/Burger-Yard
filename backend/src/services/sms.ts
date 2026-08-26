const apiKey = process.env.ARKESEL_API_KEY;
const senderId = process.env.ARKESEL_SENDER_ID || 'BurgerYard';

/** National form ("0543927440") to the international form Arkesel expects. */
function toIntlGhana(nationalPhone: string): string {
  const digits = nationalPhone.replace(/\D/g, '');
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return `233${local}`;
}

export async function sendOtpSms(nationalPhone: string, otp: string): Promise<void> {
  const message = `Your Burger Yard code is ${otp}. It expires in 10 minutes.`;

  if (!apiKey) {
    console.log(`\n\n💬 SMS SIMULATION (no ARKESEL_API_KEY set): ${message} -> ${nationalPhone}\n\n`);
    return;
  }

  const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: senderId,
      message,
      recipients: [toIntlGhana(nationalPhone)],
    }),
  });

  const data = await response.json();

  if (!response.ok || data.status !== 'success') {
    console.error('Arkesel SMS send failed:', data);
    throw new Error('Failed to send verification code');
  }
}
