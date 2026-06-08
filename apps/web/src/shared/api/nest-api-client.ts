import type { ApiClient } from './api-client.interface';
import { HttpTransport } from './http-transport';
import { streamInterviewMessage } from './sse-transport';
import type { TokenStore } from './token-store';
import type {
  AuthSession,
  LoginInput,
  RegisterInput,
  UserProfile,
} from './types/auth';
import type { DocumentFormat } from './types/documents';
import type {
  InterviewStatus,
  InterviewTurnResult,
  StartInterviewResult,
  StreamMessageHandlers,
} from './types/interview';
import type { ValidationProfile, ValidationReport } from './types/validation';
import type {
  CreateWillInput,
  UpdateWillInput,
  WillDetail,
  WillSummary,
} from './types/wills';

export interface NestApiClientOptions {
  baseUrl: string;
  tokenStore: TokenStore;
}

export class NestApiClient implements ApiClient {
  private readonly http: HttpTransport;
  private readonly baseUrl: string;
  private readonly tokenStore: TokenStore;

  readonly auth: ApiClient['auth'];
  readonly wills: ApiClient['wills'];
  readonly interview: ApiClient['interview'];
  readonly validation: ApiClient['validation'];
  readonly documents: ApiClient['documents'];

  constructor(options: NestApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.tokenStore = options.tokenStore;
    this.http = new HttpTransport({
      baseUrl: options.baseUrl,
      tokenStore: options.tokenStore,
      onUnauthorized: () => this.tryRefresh(),
    });

    this.auth = {
      register: (input) => this.register(input),
      login: (input) => this.login(input),
      refresh: (refreshToken) => this.refresh(refreshToken),
      logout: (refreshToken) => this.logout(refreshToken),
      me: () => this.me(),
    };

    this.wills = {
      list: () => this.listWills(),
      create: (input) => this.createWill(input),
      getById: (willId) => this.getWill(willId),
      update: (willId, patch) => this.updateWill(willId, patch),
      submitForReview: (willId) => this.submitForReview(willId),
      finalize: (willId) => this.finalizeWill(willId),
    };

    this.interview = {
      start: (willId) => this.startInterview(willId),
      status: (willId) => this.interviewStatus(willId),
      sync: (willId) => this.syncInterview(willId),
      streamMessage: (willId, message, handlers) =>
        this.streamMessage(willId, message, handlers),
    };

    this.validation = {
      getReport: (willId, profile) => this.getValidationReport(willId, profile),
    };

    this.documents = {
      download: (willId, format) => this.downloadDocument(willId, format),
      getHtmlPreview: (willId) => this.getHtmlPreview(willId),
    };
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.tokenStore.getRefreshToken();
    if (!refreshToken) return false;
    try {
      await this.refresh(refreshToken);
      return true;
    } catch {
      this.tokenStore.clear();
      return false;
    }
  }

  private async register(input: RegisterInput): Promise<AuthSession> {
    const session = await this.http.request<AuthSession & { user: AuthSession['user'] }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(input) },
      false,
    );
    this.tokenStore.setSession(session.accessToken, session.refreshToken);
    return session;
  }

  private async login(input: LoginInput): Promise<AuthSession> {
    const session = await this.http.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }, false);
    this.tokenStore.setSession(session.accessToken, session.refreshToken);
    return session;
  }

  private async refresh(refreshToken: string): Promise<AuthSession> {
    const session = await this.http.request<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false);
    this.tokenStore.setSession(session.accessToken, session.refreshToken);
    return session;
  }

  private async logout(refreshToken: string): Promise<void> {
    await this.http.request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    this.tokenStore.clear();
  }

  private async me(): Promise<UserProfile> {
    return this.http.request<UserProfile>('/auth/me');
  }

  private async listWills(): Promise<WillSummary[]> {
    return this.http.request<WillSummary[]>('/wills');
  }

  private async createWill(input: CreateWillInput): Promise<WillDetail> {
    return this.http.request<WillDetail>('/wills', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  private async getWill(willId: string): Promise<WillDetail> {
    return this.http.request<WillDetail>(`/wills/${willId}`);
  }

  private async updateWill(willId: string, patch: UpdateWillInput): Promise<WillDetail> {
    return this.http.request<WillDetail>(`/wills/${willId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  private async submitForReview(willId: string): Promise<WillDetail> {
    return this.http.request<WillDetail>(`/wills/${willId}/submit-for-review`, {
      method: 'POST',
    });
  }

  private async finalizeWill(willId: string): Promise<WillDetail> {
    return this.http.request<WillDetail>(`/wills/${willId}/finalize`, {
      method: 'POST',
    });
  }

  private async startInterview(willId: string): Promise<StartInterviewResult> {
    return this.http.request<StartInterviewResult>(`/wills/${willId}/interview`, {
      method: 'POST',
    });
  }

  private async interviewStatus(willId: string): Promise<InterviewStatus> {
    return this.http.request<InterviewStatus>(`/wills/${willId}/interview/status`);
  }

  private async syncInterview(willId: string): Promise<void> {
    await this.http.request<void>(`/wills/${willId}/interview/sync`, { method: 'POST' });
  }

  private async streamMessage(
    willId: string,
    message: string,
    handlers: StreamMessageHandlers,
  ): Promise<InterviewTurnResult> {
    let turnResult: InterviewTurnResult | undefined;

    await streamInterviewMessage(
      this.baseUrl,
      willId,
      message,
      this.tokenStore,
      (event) => {
        if (event.type === 'assistant_delta' && handlers.onChunk) {
          handlers.onChunk(event.delta);
        }
        if (event.type === 'done') {
          turnResult = event.data;
        }
        if (event.type === 'error') {
          throw new Error(event.message);
        }
      },
    );

    if (!turnResult) {
      throw new Error(
        'Interview stream ended without a result. Check that the API has a valid OPENAI_API_KEY (Docker: apps/api/.env via env_file).',
      );
    }

    return turnResult;
  }

  private async getValidationReport(
    willId: string,
    profile: ValidationProfile,
  ): Promise<ValidationReport> {
    return this.http.request<ValidationReport>(
      `/wills/${willId}/validation?profile=${profile}`,
    );
  }

  private async downloadDocument(willId: string, format: DocumentFormat): Promise<Blob> {
    return this.http.requestBlob(`/wills/${willId}/document?format=${format}`);
  }

  private async getHtmlPreview(willId: string): Promise<string> {
    return this.http.requestText(`/wills/${willId}/document?format=html`);
  }
}
