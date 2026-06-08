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

export interface ApiClient {
  auth: {
    register(input: RegisterInput): Promise<AuthSession>;
    login(input: LoginInput): Promise<AuthSession>;
    refresh(refreshToken: string): Promise<AuthSession>;
    logout(refreshToken: string): Promise<void>;
    me(): Promise<UserProfile>;
  };
  wills: {
    list(): Promise<WillSummary[]>;
    create(input: CreateWillInput): Promise<WillDetail>;
    getById(willId: string): Promise<WillDetail>;
    update(willId: string, patch: UpdateWillInput): Promise<WillDetail>;
    submitForReview(willId: string): Promise<WillDetail>;
    finalize(willId: string): Promise<WillDetail>;
  };
  interview: {
    start(willId: string): Promise<StartInterviewResult>;
    status(willId: string): Promise<InterviewStatus>;
    sync(willId: string): Promise<void>;
    streamMessage(
      willId: string,
      message: string,
      handlers: StreamMessageHandlers,
    ): Promise<InterviewTurnResult>;
  };
  validation: {
    getReport(willId: string, profile: ValidationProfile): Promise<ValidationReport>;
  };
  documents: {
    download(willId: string, format: DocumentFormat): Promise<Blob>;
    getHtmlPreview(willId: string): Promise<string>;
  };
}
