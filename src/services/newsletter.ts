// TODO: Implementar backend — integração com Resend ou Mailchimp

export interface NewsletterSubscribeResult {
  success: boolean
  message: string
}

export async function subscribeNewsletter(
  email: string,
): Promise<NewsletterSubscribeResult> {
  // TODO: Implementar backend
  void email
  throw new Error('Not implemented - run /auto-flow execute')
}
