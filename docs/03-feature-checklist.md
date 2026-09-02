# Global Dubai Tourism Platform — Feature Checklist

**Version:** 0.1.0  
**Last Updated:** 2026-09-02

Legend: `[x]` implemented in repository, `[~]` contract/design exists but implementation is incomplete, `[ ]` not implemented.

## A. Project Foundation

- [x] travel-rpc Go module
- [x] travel-rpc service configuration
- [x] RPC protobuf contract `desc/travel.proto`
- [x] RPC server bootstrap
- [x] Ent schema generation entry point
- [~] Generated protobuf Go code
- [ ] CI compile/test verification
- [ ] Docker build/deployment

## B. Tenant / Merchant

- [~] Tenant schema placeholder
- [x] Merchant schema
- [ ] Tenant repository/service
- [ ] Merchant repository/service
- [ ] Tenant authorization enforcement
- [ ] Merchant scope enforcement

## C. Product Catalog

- [x] Product schema
- [x] Product list RPC contract
- [x] Product detail RPC contract
- [ ] Product repository
- [ ] Product service implementation
- [ ] Package/SKU repository
- [ ] Package/SKU RPC contract
- [ ] Product publication workflow
- [ ] Media/content management

## D. Inventory / Pricing

- [x] Inventory schema
- [x] Inventory check RPC contract
- [ ] Inventory repository
- [ ] Inventory check implementation
- [ ] Atomic reservation
- [ ] Release inventory
- [ ] Confirm reservation
- [ ] Date/time-slot management
- [ ] Dynamic pricing rules

## E. Order / Booking

- [x] Order schema
- [x] OrderItem schema
- [x] CreateOrder RPC contract
- [ ] Order repository
- [ ] Order creation implementation
- [ ] Order number generator
- [ ] Booking validation
- [ ] Order state machine
- [ ] Cancellation/refund flow
- [ ] Order query API implementation

## F. Traveler

- [x] Traveler schema
- [ ] Traveler repository
- [ ] Traveler creation/update
- [ ] Traveler validation
- [ ] Traveler-order association

## G. Voucher / Redemption

- [x] Voucher schema
- [ ] Voucher repository
- [ ] Voucher generation
- [ ] Voucher verification
- [ ] Redemption API
- [ ] Redemption audit trail

## H. Travel API

- [x] Go module baseline
- [x] Go-Zero API contract
- [x] Product list API contract
- [x] Product detail API contract
- [x] Inventory check API contract
- [x] Create order API contract
- [x] Order query API contract
- [ ] Generated API handlers
- [ ] RPC client wiring
- [ ] Authentication/context propagation
- [ ] Error mapping
- [ ] API integration tests

## I. Payment

- [ ] Payment domain abstraction
- [ ] Payment transaction model
- [ ] Payment intent/order creation
- [ ] PayPal adapter
- [ ] PayPal webhook
- [ ] Webhook signature verification
- [ ] Webhook idempotency
- [ ] Payment state machine
- [ ] Refund
- [ ] Payment reconciliation

## J. Customer Web/H5

- [ ] Home
- [ ] Search
- [ ] Destination pages
- [ ] Product detail
- [ ] Package/date/time selection
- [ ] Cart
- [ ] Checkout
- [ ] Payment
- [ ] Order center
- [ ] Voucher
- [ ] Account
- [ ] AI Planner

## K. Mobile App

- [ ] App foundation
- [ ] Login/account
- [ ] Home/discovery
- [ ] Search
- [ ] Product detail
- [ ] Booking
- [ ] Payment
- [ ] Orders
- [ ] Voucher
- [ ] AI Planner

## L. AI Planner

- [ ] Travel intent schema
- [ ] Natural-language requirement parsing
- [ ] Destination/date/budget extraction
- [ ] Product retrieval from travel-rpc
- [ ] Inventory-aware filtering
- [ ] AI reranking
- [ ] Itinerary generation
- [ ] Bookable itinerary conversion
- [ ] AI guardrail against invented prices/availability

## M. Operations / Observability

- [ ] Structured logging
- [ ] Trace IDs
- [ ] Metrics
- [ ] RPC monitoring
- [ ] Payment monitoring
- [ ] Order audit logs
- [ ] Admin dashboards
- [ ] Alerting

## Current Milestone

**Milestone M0 — Foundation and contracts**

Completed/started:
- Requirements documentation
- Architecture documentation
- Feature checklist
- travel-rpc module/bootstrap
- tourism protobuf contract
- initial Ent schemas
- travel-api API contract

**Next milestone: M1 — Executable RPC data layer**

Target:
- complete Ent schema/index/edge design
- generate Ent code
- implement repositories
- implement catalog/inventory/order services
- implement transactional inventory reservation
- connect travel-api to travel-rpc
- add tests and CI verification
- update all documentation
