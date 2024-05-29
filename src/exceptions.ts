export class PostWebhookFailedException extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'PostWebhookFailedException';
  }

  toString(): string {
    return `${this.name}: ${this.message} (${this.status})`;
  }
}