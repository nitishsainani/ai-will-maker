# Sequence Diagrams — AI Assisted Will Maker

Detailed interaction flows across layers. All use cases respect the dependency rule: **Presentation → Application → Domain → Ports ← Infrastructure**.

---

## 1. User Registration & Authentication

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js
    participant AuthCtrl as AuthController
    participant RegisterUC as RegisterUseCase
    participant LoginUC as LoginUseCase
    participant UserRepo as IUserRepository
    participant Hasher as IPasswordHasher
    participant JWT as ITokenService
    participant DB as PostgreSQL

    rect rgb(240, 248, 255)
        Note over User, DB: Registration
        User->>Web: Submit register form
        Web->>AuthCtrl: POST /auth/register
        AuthCtrl->>RegisterUC: execute(RegisterCommand)
        RegisterUC->>UserRepo: findByEmail(email)
        UserRepo->>DB: SELECT user
        alt email exists
            RegisterUC-->>AuthCtrl: ConflictError
            AuthCtrl-->>Web: 409
        else new user
            RegisterUC->>Hasher: hash(password)
            RegisterUC->>UserRepo: save(User)
            UserRepo->>DB: INSERT user
            RegisterUC-->>AuthCtrl: UserDto
            AuthCtrl-->>Web: 201
        end
    end

    rect rgb(255, 248, 240)
        Note over User, DB: Login
        User->>Web: Submit login form
        Web->>AuthCtrl: POST /auth/login
        AuthCtrl->>LoginUC: execute(LoginCommand)
        LoginUC->>UserRepo: findByEmail(email)
        UserRepo->>DB: SELECT
        LoginUC->>Hasher: compare(password, hash)
        alt invalid credentials
            LoginUC-->>AuthCtrl: UnauthorizedError
            AuthCtrl-->>Web: 401
        else valid
            LoginUC->>JWT: signAccessToken(user)
            LoginUC->>JWT: signRefreshToken(user)
            LoginUC->>UserRepo: saveRefreshToken(hash)
            UserRepo->>DB: INSERT refresh_token
            LoginUC-->>AuthCtrl: TokenPair
            AuthCtrl-->>Web: 200 { accessToken, refreshToken }
            Web->>Web: Store tokens (httpOnly cookie / memory)
        end
    end
```

---

## 2. Create Will (Aggregate Initialization)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js
    participant Ctrl as WillsController
    participant UC as CreateWillUseCase
    participant Will as Will (Entity)
    participant Repo as IWillRepository
    participant Events as IDomainEventPublisher
    participant DB as PostgreSQL

    User->>Web: Click "Create New Will"
    Web->>Ctrl: POST /wills { title, jurisdiction }
    Ctrl->>Ctrl: JwtAuthGuard.validate()
    Ctrl->>UC: execute(CreateWillCommand)
    UC->>Will: Will.create(userId, title, jurisdiction)
    Will-->>UC: Will instance
    UC->>Repo: save(will)
    Repo->>DB: BEGIN
    Repo->>DB: INSERT wills
    Repo->>DB: COMMIT
    UC->>Events: publish(WillCreated)
    UC-->>Ctrl: WillDto
    Ctrl-->>Web: 201 { id, status: DRAFT }
    Web-->>User: Redirect to /wills/:id
```

---

## 3. AI-Assisted Interview (Streaming)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js
    participant SSE as InterviewSseController
    participant SendUC as SendMessageUseCase
    participant SessionRepo as IInterviewSessionRepository
    participant WillRepo as IWillRepository
    participant AI as IAiProvider
    participant Prompt as InterviewPromptBuilder
    participant DB as PostgreSQL

    User->>Web: Type message in chat
    Web->>SSE: POST /wills/:id/interview/messages (Accept: text/event-stream)
    SSE->>SendUC: execute(SendMessageCommand)

    SendUC->>WillRepo: findById(willId)
    WillRepo->>DB: SELECT will
    SendUC->>SessionRepo: findActiveByWillId(willId)
    SessionRepo->>DB: SELECT session + messages

    SendUC->>SessionRepo: add user message
    SendUC->>Prompt: build(will, sessionHistory, jurisdiction)
    Prompt-->>SendUC: AiCompletionRequest

    SendUC->>AI: stream(request)

    loop each chunk
        AI-->>SendUC: AiStreamChunk { delta }
        SendUC-->>SSE: yield SSE event
        SSE-->>Web: data: { delta }
        Web-->>User: Append to chat UI
    end

    AI-->>SendUC: final content + extracted JSON
    SendUC->>SessionRepo: add assistant message + extractedFacts
    SessionRepo->>DB: INSERT interview_messages
    SendUC-->>SSE: event: done
    SSE-->>Web: stream close
```

### 3.1 AI Provider Selection (Strategy)

```mermaid
sequenceDiagram
    participant UC as SendMessageUseCase
    participant Factory as AiProviderFactory
    participant Strategy as AiProviderStrategy
    participant OpenAI as OpenAiAdapter
    participant Claude as ClaudeAdapter

    UC->>Factory: getProvider()
    Factory->>Strategy: resolve(env.AI_PROVIDER)
    alt AI_PROVIDER=openai
        Strategy-->>Factory: OpenAiAdapter
    else AI_PROVIDER=claude
        Strategy-->>Factory: ClaudeAdapter
    end
    Factory-->>UC: IAiProvider
    Note over UC,Claude: Use case only sees IAiProvider interface
```

---

## 4. Sync Interview Facts → Will Aggregate

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js
    participant Ctrl as InterviewController
    participant UC as SyncInterviewToWillUseCase
    participant Mapper as InterviewFactsMapper
    participant DomVal as WillValidationService
    participant Will as Will (Entity)
    participant UoW as IUnitOfWork
    participant DB as PostgreSQL

    User->>Web: Click "Apply to my will"
    Web->>Ctrl: POST /wills/:id/interview/sync
    Ctrl->>UC: execute(SyncCommand)

    UC->>UoW: execute(async () => {
    UoW->>DB: BEGIN
    UC->>UC: load will + session messages
    UC->>Mapper: merge(extractedFacts[], will)
    Mapper-->>UC: updated Will

    UC->>DomVal: validateForReview(will)
    alt validation errors
        DomVal-->>UC: ValidationResult(errors)
        UoW->>DB: ROLLBACK
        UC-->>Ctrl: 422 { errors }
        Ctrl-->>Web: Show validation panel
    else valid
        UC->>UC: will.incrementVersion()
        UC->>UC: repository.save(will)
        UC->>DB: UPDATE + UPSERT children
        UoW->>DB: COMMIT
        UC-->>Ctrl: WillDto
        Ctrl-->>Web: 200
        Web-->>User: Show updated will summary
    end
```

---

## 5. Finalize Will & Create Version Snapshot

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js
    participant Ctrl as WillsController
    participant UC as FinalizeWillUseCase
    participant DomVal as WillValidationService
    participant Will as Will (Entity)
    participant Snapshot as WillSnapshotFactory
    participant Repo as IWillRepository
    participant VerRepo as IWillVersionRepository
    participant Events as IDomainEventPublisher
    participant DB as PostgreSQL

    User->>Web: Click "Finalize Will"
    Web->>Ctrl: POST /wills/:id/finalize
    Ctrl->>UC: execute(FinalizeCommand)

    UC->>Repo: findById(willId)
    UC->>DomVal: validateForFinalize(will)

    alt validation fails
        UC-->>Ctrl: 422
    else passes
        UC->>Will: finalize()
        Note over Will: status → FINALIZED, immutable flag
        UC->>Snapshot: fromWill(will)
        Snapshot-->>UC: WillSnapshot
        UC->>Repo: save(will)
        UC->>VerRepo: save(version, snapshot)
        Repo->>DB: UPDATE wills
        VerRepo->>DB: INSERT will_versions
        UC->>Events: publish(WillFinalized)
        UC-->>Ctrl: WillDto
        Ctrl-->>Web: 200
        Web-->>User: Success + link to preview
    end
```

---

## 6. PDF Generation (Adapter + Strategy)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js
    participant Ctrl as DocumentsController
    participant UC as GeneratePdfUseCase
    participant WillRepo as IWillRepository
    participant VerRepo as IWillVersionRepository
    participant TplStrat as IJurisdictionTemplateStrategy
    participant PdfFactory as PdfGeneratorFactory
    participant Pdf as IPdfGenerator
    participant DB as PostgreSQL

    User->>Web: Download PDF
    Web->>Ctrl: GET /wills/:id/document.pdf
    Ctrl->>UC: execute(GeneratePdfQuery)

    UC->>WillRepo: findById(willId)
    alt status != FINALIZED
        UC-->>Ctrl: 400 WillNotFinalized
    else finalized
        UC->>VerRepo: findLatest(willId)
        VerRepo->>DB: SELECT will_versions ORDER BY version DESC LIMIT 1
        UC->>TplStrat: buildTemplate(jurisdiction)
        TplStrat-->>UC: WillDocumentTemplate

        UC->>PdfFactory: getGenerator(env.PDF_ENGINE)
        PdfFactory-->>UC: IPdfGenerator (Puppeteer | PdfKit)

        UC->>Pdf: render(template, snapshot)
        Note over Pdf: Adapter converts HTML→PDF or draws via PdfKit
        Pdf-->>UC: Buffer

        UC-->>Ctrl: PdfResult
        Ctrl-->>Web: 200 application/pdf
        Web-->>User: File download
    end
```

---

## 7. Manual Will Update (Non-AI Path)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js
    participant Ctrl as WillsController
    participant UC as UpdateWillUseCase
    participant AllocSvc as BeneficiaryAllocationService
    participant DomVal as WillValidationService
    participant Will as Will (Entity)
    participant Repo as IWillRepository
    participant DB as PostgreSQL

    User->>Web: Edit beneficiaries in form
    Web->>Ctrl: PATCH /wills/:id
    Ctrl->>UC: execute(UpdateWillCommand)

    UC->>Repo: findById(willId)
    alt status == FINALIZED
        UC-->>Ctrl: 409 WillImmutable
    else editable
        UC->>Will: applyChanges(dto)
        UC->>AllocSvc: applyExplicitAllocations(...)
        AllocSvc-->>UC: Result
        UC->>DomVal: validateForReview(will)
        UC->>Repo: save(will)
        Repo->>DB: UPDATE
        UC-->>Ctrl: WillDto
        Ctrl-->>Web: 200
    end
```

---

## 8. Docker Container Startup

```mermaid
sequenceDiagram
    autonumber
    participant Compose as docker-compose
    participant PG as postgres
    participant API as api (NestJS)
    participant Web as web (Next.js)
    participant Migrate as prisma migrate

    Compose->>PG: start + healthcheck
    PG-->>Compose: healthy
    Compose->>API: start (depends_on: postgres healthy)
    API->>Migrate: deploy migrations
    Migrate->>PG: APPLY migrations
    API->>API: bootstrap NestJS modules
    API-->>Compose: listening :4000
    Compose->>Web: start (depends_on: api)
    Web-->>Compose: listening :3000
```

---

## 9. Error Handling Flow

```mermaid
sequenceDiagram
    participant Ctrl as Controller
    participant UC as UseCase
    participant Filter as DomainExceptionFilter
    participant Client as Next.js

    Ctrl->>UC: execute(command)
    UC-->>Ctrl: Result.err(DomainError)
    Ctrl->>Filter: map error
    alt INVALID_ALLOCATION
        Filter-->>Client: 422 { code, details }
    else WILL_NOT_FOUND
        Filter-->>Client: 404
    else WILL_IMMUTABLE
        Filter-->>Client: 409
    else UNEXPECTED
        Filter-->>Client: 500 (no internal leak)
    end
```

---

## 10. Cross-Cutting: Audit Log (Infrastructure)

```mermaid
sequenceDiagram
    participant UC as FinalizeWillUseCase
    participant Events as IDomainEventPublisher
    participant Audit as AuditLogAdapter
    participant DB as PostgreSQL

    UC->>Events: publish(WillFinalized)
    Events->>Audit: handle(event)
    Audit->>DB: INSERT audit_logs (userId, action, payload, ip)
```

---

*Document version: 1.0*
