export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
        ? (body as { message: string }).message
        : response.statusText || 'Request failed';

    return new ApiError(message, response.status, body);
  }
}
