# Development Log

## 2026-09-02 — M0 Foundation and Documentation

### Completed
- Established the tourism RPC repository baseline.
- Added `desc/travel.proto` as the RPC contract source of truth.
- Added RPC service bootstrap/configuration.
- Added initial Ent schemas for tenant, merchant, product, package, inventory, order, order item and voucher.
- Added traveler schema.
- Added Ent generation entry point.
- Established the travel-api REST contract.
- Added project requirements documentation.
- Added architecture documentation.
- Added feature checklist.
- Added documentation governance/index.

### Important correction
- A manually written fake protobuf generated file was removed. Generated protobuf code must be produced by the real protoc/Go toolchain and must not be hand-authored as a substitute.

### Verification status
- Repository/file structure: reviewed through GitHub.
- Local `go test ./...`: **not yet executed by this development workflow**.
- Local `go build ./...`: **not yet executed by this development workflow**.
- Generated protobuf code: pending actual generation.
- Generated Ent code: pending actual generation.

### Next
M1 — Executable RPC data layer:
- finalize Ent indexes/edges
- generate Ent code
- generate protobuf Go/grpc code
- implement repositories
- implement catalog service
- implement inventory check/reservation with transactional consistency
- implement order creation/query
- wire travel-api RPC clients
- add tests/CI
- update documentation
