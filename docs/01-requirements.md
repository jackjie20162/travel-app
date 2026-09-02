# Global Dubai Tourism Platform — Current Requirements

**Version:** 0.1.0  
**Status:** Baseline / continuously updated  
**Last Updated:** 2026-09-02

## 1. Project Goal

Build a global Dubai tourism and travel-experience platform for worldwide customers, including China. The system must support tourism products, packages/SKUs, date/time-slot inventory, pricing, booking/orders, vouchers/redemption, multi-tenant merchants, payment, customer-facing Web/H5/App, AI itinerary planning, and supplier/merchant operations.

## 2. Development Order

The project follows this implementation sequence:

1. travel-rpc + travel-api
2. Payment abstraction + PayPal integration
3. Customer Web/H5
4. Mobile App
5. AI Planner and subsequent optimization/operations features

## 3. Core Business Flow

Product → Package/SKU → Date → Time Slot → Inventory/Pricing → Traveler → Booking/Order → Payment → Voucher → Redemption

## 4. Multi-Tenant Requirement

All business data that belongs to a merchant/tenant must carry tenant isolation information. Merchant users must only access data permitted by their tenant and merchant scope. The tourism domain must remain compatible with the existing simple-admin merchant system.

## 5. Product Requirements

- Product catalog
- Destination information
- Product description/media extension points
- Package/SKU
- Product status and publication lifecycle
- Currency and minimum price

## 6. Inventory and Pricing Requirements

- Inventory by package/SKU
- Service date
- Optional time slot
- Capacity and reserved quantity
- Unit price and currency
- Availability check
- Transactional/atomic reservation to prevent overselling

## 7. Order Requirements

- Customer order creation
- Order number
- Product/package snapshot relationship
- Quantity
- Service date/time slot
- Total amount/currency
- Order lifecycle
- Payment status
- Idempotency should be supported before production payment integration

Expected initial lifecycle:
`PENDING_PAYMENT → PAYMENT_PROCESSING → PAID → CONFIRMED → COMPLETED`

## 8. Traveler / Voucher Requirements

- Traveler information associated with an order
- Voucher generation after successful confirmation
- Voucher status
- Redemption timestamp
- Redemption must be auditable

## 9. Payment Requirements

Payment must be provider-agnostic at the domain layer.

Initial provider: PayPal.

Future providers may include card/acquirer and other regional payment methods.

Payment webhook processing must be idempotent and must not directly trust client-side payment status.

## 10. AI Planner Requirements

The AI Planner accepts natural-language travel requirements and produces structured travel intent and bookable itinerary recommendations.

AI must not invent product price or inventory. Availability, price, package and booking facts must come from travel-rpc as the source of truth. AI may rank/recommend real returned products.

## 11. Customer Channels

- Global Web/H5
- Mobile App
- Customer account/order center
- Search/product detail
- Cart/checkout/payment
- AI itinerary planner

## 12. Merchant/Supplier Channel

The existing simple-admin-based merchant system is the operational foundation. Tourism capabilities should integrate with it instead of creating an unrelated second merchant administration architecture.

## 13. Engineering Requirements

- Go-Zero
- gRPC/RPC
- Ent
- Protobuf as RPC contract source of truth
- REST API gateway
- CI/build verification before declaring a milestone complete
- Every development milestone must update project documentation
- Requirements, architecture, function inventory, API contracts, database model, payment design and change history must remain versioned in GitHub

## 14. Documentation Rule

Every implementation step must produce or update documentation. At minimum:

- Requirements document
- Architecture document
- Function/feature checklist
- API/RPC contract documentation when interfaces change
- Database/domain model documentation when schemas change
- Payment documentation when payment changes
- Development/change log

Documentation must describe what is planned, what is implemented, what is pending, and any known verification limitations.
