import crypto from 'crypto';

export function verifyWebhookSignature(body: unknown, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  
  const payload = JSON.stringify(body);
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}
