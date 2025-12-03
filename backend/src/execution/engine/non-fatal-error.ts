export class NonFatalError extends Error {
  constructor(
    message: string,
    public readonly data?: any,
  ) {
    super(message);
    this.name = 'NonFatalError';
    Object.setPrototypeOf(this, NonFatalError.prototype);
  }
}
