# Global Dubai Tourism Platform — Documentation Index

**Last Updated:** 2026-09-02

This directory is the long-term project knowledge base. Every development milestone must update the relevant documents.

| Document | Purpose |
|---|---|
| `01-requirements.md` | Current business and engineering requirements |
| `02-architecture.md` | System architecture, service boundaries and data flow |
| `03-feature-checklist.md` | Implemented / partial / pending function inventory |
| `04-development-log.md` | Chronological development and verification history |
| `05-api-rpc-contract.md` | REST/RPC interface tracking |
| `06-database-model.md` | Ent/database model and consistency rules |
| `07-payment.md` | Payment architecture, PayPal and webhook design |

## Documentation Governance

For every implementation step:

1. Update the feature checklist.
2. Update the development log.
3. Update architecture if service/data flow changes.
4. Update API/RPC contract if interfaces change.
5. Update database model if schemas/indexes/transactions change.
6. Update payment document for payment-related work.
7. Record verification status honestly: not verified, locally verified, CI verified, etc.

Never mark a feature `[x]` merely because an interface or placeholder has been created. `[x]` means the implementation exists; verification status is tracked separately in the development log.
