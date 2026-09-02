# Global Dubai Tourism Platform — Architecture

**Version:** 0.1.0  
**Status:** Baseline / implementation architecture  
**Last Updated:** 2026-09-02

## 1. Architecture Principles

1. Reuse the existing simple-admin merchant/tenant foundation.
2. Separate tourism domain services from the merchant administration UI.
3. Use Go-Zero REST API + gRPC/RPC + Ent.
4. Protobuf is the source of truth for RPC contracts.
5. Keep payment providers behind an abstraction.
6. Inventory and order writes must be transactional.
7. AI is an orchestration/recommendation layer, never the source of truth for price or inventory.
8. Every milestone is documented and tracked in Git.

## 2. High-Level Architecture

```text
                        Customer Web/H5
                              │
                        Mobile App
                              │
                              ▼
                       ┌─────────────┐
                       │ travel-api  │
                       │ REST Gateway│
                       └──────┬──────┘
                              │ gRPC
                              ▼
                       ┌─────────────┐
                       │ travel-rpc  │
                       │ Domain Core │
                       └──────┬──────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
             Catalog       Inventory       Order
                │             │             │
                └─────────────┼─────────────┘
                              ▼
                           Ent/DB
                              │
                              ▼
                       Payment Service
                         │           │
                         ▼           ▼
                      PayPal      Future PSPs
```

## 3. Existing Platform Integration

```text
simple-admin-core
       │
       ├── tenant / authorization foundation
       │
       └── merchant administration
                 │
                 ▼
          tourism domain
       travel-rpc / travel-api
```

The tourism services should not duplicate merchant identity/tenant concepts unnecessarily. Tourism business records carry `tenant_id` and `merchant_id` where applicable.

## 4. Tourism Domain Model

```text
Tenant
  └── Merchant
        └── Product
              └── Package/SKU
                    └── Inventory
                         ├── service date
                         ├── time slot
                         ├── capacity
                         ├── reserved
                         └── price

Order
  ├── OrderItem
  ├── Traveler
  └── Voucher
```

## 5. RPC Services

### CatalogService
- GetProduct
- ListProducts

### InventoryService
- Check
- Future: reserve/release/confirm as needed

### OrderService
- Create
- Future: Get, Cancel, Confirm, Complete

## 6. API Gateway

Initial public API contract is maintained under `travel-api/desc/travel.api`.

Current endpoints:

- `GET /api/travel/products`
- `GET /api/travel/products/:id`
- `POST /api/travel/inventory/check`
- `POST /api/travel/orders`
- `GET /api/travel/orders/:orderNo`

The API gateway should perform request validation, authentication/context extraction and RPC orchestration; domain rules remain in RPC/domain services.

## 7. Inventory Consistency

Inventory must not be implemented as a simple read-then-write sequence.

Required production pattern:

```text
BEGIN TRANSACTION
  SELECT inventory FOR UPDATE
  validate status/date/time slot
  validate remaining >= requested quantity
  increment reserved
  create order/item
COMMIT
```

Alternative atomic SQL update may be used where it provides equivalent correctness.

## 8. Order and Payment Boundary

```text
Order Service
     │
     ├── PENDING_PAYMENT
     │
     ▼
Payment Service
     │
     ├── PayPal Adapter
     └── Future Adapter(s)
     │
     ▼
Webhook/Event
     │
     ▼
Order payment state transition
```

The browser/client must never be the authoritative source for `PAID`.

## 9. AI Planner Boundary

```text
Natural language requirements
            │
            ▼
        AI Planner
            │
            ▼
    Structured travel intent
            │
            ▼
       travel-rpc query
            │
            ├── real products
            ├── real packages
            ├── real prices
            └── real availability
            │
            ▼
       AI reranking
            │
            ▼
      bookable itinerary
```

## 10. Repository Responsibilities

### travel-rpc
Owns:
- tourism domain model
- Ent schemas
- repositories
- inventory consistency
- order domain logic
- RPC contracts and implementations

### travel-api
Owns:
- REST routes
- request/response DTOs
- authentication/context forwarding
- RPC client orchestration
- public API boundary

### Web/H5
Owns:
- customer UX
- search/discovery
- product detail
- cart
- checkout
- payment UI
- orders
- AI planner UI

### App
Owns mobile-specific customer experience while reusing the same API contracts.

## 11. Deployment Direction

Initial services:

- simple-admin services
- merchant services
- travel-rpc
- travel-api
- database
- payment provider integration

Docker/CI deployment should be added after the first compile/testable service milestone.

## 12. Architecture Change Rule

Any change to service boundaries, database ownership, RPC contracts, payment flow, tenant isolation or client architecture must update this document and the change log before the implementation milestone is considered complete.
