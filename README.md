# travel-rpc

Dubai/global tourism platform RPC foundation.

## Scope of v0.1
- Product catalog domain
- Package/SKU domain
- Inventory and pricing domain
- Order domain
- Traveler and voucher domain
- Tenant/merchant isolation fields
- gRPC service contract under `desc/travel.proto`

The protobuf contract is the source of truth. Generated Go code should be produced with the same Go-Zero/protoc toolchain used by the existing merchant system.

## Domain flow
Product -> Package/SKU -> Date -> Time Slot -> Inventory/Pricing -> Traveler -> Booking/Order -> Voucher -> Redemption

## Next
1. Generate protobuf Go/grpc code.
2. Add Ent schemas and repositories.
3. Implement catalog/inventory/order services.
4. Connect `travel-api` to this RPC.
5. Add payment abstraction and PayPal adapter.
