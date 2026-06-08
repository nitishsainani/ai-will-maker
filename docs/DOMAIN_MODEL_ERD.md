# Domain Model ERD — AI Assisted Will Maker

Physical data model aligned with [packages/will-domain](../packages/will-domain) and [schema.prisma](../apps/api/src/infrastructure/persistence/prisma/schema.prisma).

---

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ wills : owns
    wills ||--|{ beneficiaries : has
    wills ||--|{ assets : has
    wills ||--|{ asset_allocations : contains
    wills ||--|{ residuary_allocations : contains
    wills ||--|{ executors : appoints
    wills ||--|{ guardians : names
    wills ||--|{ witnesses : requires
    wills ||--o{ conversations : guides
    conversations ||--|{ conversation_memories : distills
    assets ||--o{ asset_allocations : "split via"
    beneficiaries ||--o{ asset_allocations : receives
    beneficiaries ||--o{ residuary_allocations : receives
    beneficiaries ||--o{ guardians : "ward of"
    wills ||--o{ will_versions : snapshots
    wills ||--o{ audit_logs : history
    users ||--o{ audit_logs : performs

    users {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        timestamptz created_at
        timestamptz updated_at
    }

    wills {
        uuid id PK
        uuid user_id FK
        string title
        enum status
        string jurisdiction_code
        int revision
        string testator_name
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    beneficiaries {
        uuid id PK
        uuid will_id FK
        string full_name
        string relationship
        int priority_order
        date date_of_birth
    }

    assets {
        uuid id PK
        uuid will_id FK
        enum type
        string description
        decimal estimated_value
        string currency
    }

    asset_allocations {
        uuid id PK
        uuid will_id FK
        uuid asset_id FK
        uuid beneficiary_id FK
        decimal share_pct
    }

    residuary_allocations {
        uuid id PK
        uuid will_id FK
        uuid beneficiary_id FK
        decimal share_pct
        int priority_order
    }

    executors {
        uuid id PK
        uuid will_id FK
        string full_name
        string email
        boolean is_primary
        int order
    }

    guardians {
        uuid id PK
        uuid will_id FK
        uuid ward_beneficiary_id FK
        string full_name
        string relationship
    }

    witnesses {
        uuid id PK
        uuid will_id FK
        string full_name
        string address_line1
        string city
        string state
        int witness_order
    }

    conversations {
        uuid id PK
        uuid will_id FK
        enum status
        string ai_provider
        timestamptz started_at
        timestamptz ended_at
    }

    conversation_memories {
        uuid id PK
        uuid conversation_id FK
        string fact_key
        jsonb fact_value
        float confidence
        string source
        timestamptz extracted_at
    }

    will_versions {
        uuid id PK
        uuid will_id FK
        int version_number
        jsonb snapshot
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        uuid will_id FK
        uuid actor_user_id FK
        string action
        jsonb payload
        timestamptz occurred_at
    }
```

---

## Aggregate Boundaries

```mermaid
flowchart TB
    subgraph IdentityAggregate["Identity Aggregate"]
        User
    end

    subgraph WillAggregate["Will Aggregate Root"]
        Will
        Beneficiary
        Asset
        AssetAllocation
        ResiduaryAllocation
        Executor
        Guardian
        Witness
        Conversation
        ConversationMemory
    end

    User -->|"userId ref only"| Will
```

### Why Will is the aggregate root

| Criterion | Explanation |
|-----------|-------------|
| Transactional consistency | Removing a beneficiary must atomically remove its asset and residuary allocations and guardians. Only the root coordinates this. |
| Cross-entity invariants | Asset share sums, residuary totals, and executor primary designation span multiple entities. |
| Lifecycle coupling | Executors, guardians, witnesses, and allocations have no meaning outside a specific will. |
| Draft gating | `WillStatus` controls mutability for all children via `ensureEditable()`. |

### Why User is separate

- Independent lifecycle (account exists before any will).
- Password changes do not affect will legal content.
- Referenced by `will.userId` only.

### Conversation ownership (hybrid)

`Conversation` and `ConversationMemory` are **compositionally owned** by `Will`:

- FK `will_id` with `ON DELETE CASCADE`.
- Mutations via `Will.startConversation()` and `Will.recordMemory()`.
- Persisted through `IWillRepository.save(will)` — no separate conversation repository.
- **Lazy-loaded** by default (`includeConversation: false`) to avoid loading AI history on every will read.

---

## Orphan Prevention

| Mechanism | Layer |
|-----------|-------|
| `asset_allocations` CASCADE on `assets` and `beneficiaries` delete | Database |
| `residuary_allocations` CASCADE on `beneficiaries` delete | Database |
| `guardians` CASCADE on `ward_beneficiary_id` delete | Database |
| `@@unique([assetId, beneficiaryId])` | Database |
| `@@unique([willId, beneficiaryId])` on residuary | Database |
| `Will.removeBeneficiary()` cascades allocations + guardians | Domain |
| `Will.removeAsset()` cascades asset allocations | Domain |
| `Will.assignAssetShare()` validates same `willId` | Domain |

---

## Invariants

| ID | Rule | Enforced by |
|----|------|-------------|
| INV-01 | Mutations blocked when `status = FINALIZED` | `Will.ensureEditable()` |
| INV-02 | Asset allocation refs belong to same will | `Will.assignAssetShare()` |
| INV-03 | Asset share sum per asset ≤ 100% | `Will.validateAssetShares()` |
| INV-04 | Residuary sum = 100% at finalize | `WillValidationService` |
| INV-05 | Remove beneficiary cascades allocations + guardians | `Will.removeBeneficiary()` |
| INV-06 | Remove asset cascades asset allocations | `Will.removeAsset()` |
| INV-07 | Exactly one primary executor at finalize | `WillValidationService` |
| INV-08 | ≥2 witnesses at finalize | `WillValidationService` |
| INV-09 | Guardian references existing minor ward | `Guardian.forWard()` |
| INV-10 | `revision` incremented on save | `IWillRepository` (infrastructure) |

---

## Future Hooks

| Table | Purpose | When populated |
|-------|---------|----------------|
| `will_versions` | Immutable JSONB snapshots | On `Will.finalize()` |
| `audit_logs` | Append-only change history | From `Will.pullDomainEvents()` handler |

---

*Document version: 2.0*
