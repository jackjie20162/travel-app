// Code generated manually for the initial Travel RPC contract.
package travel

import "context"

type Empty struct{}
type Product struct { Id int64; TenantId int64; MerchantId int64; Code string; Title string; Slug string; Destination string; Description string; Currency string; MinPrice int64; Status string }
type ProductIdRequest struct { Id int64 }
type ProductListRequest struct { Keyword string; Destination string; Page int32; PageSize int32; TenantId int64 }
type ProductListResponse struct { Items []*Product; Total int64 }
type InventoryRequest struct { PackageId int64; Date string; TimeSlot string; Quantity int32 }
type InventoryResponse struct { Available bool; Remaining int32; UnitPrice int64; Currency string }
type CreateOrderRequest struct { TenantId int64; MerchantId int64; ProductId int64; PackageId int64; Date string; TimeSlot string; Quantity int32; Currency string; TotalAmount int64; CustomerEmail string }
type Order struct { Id int64; OrderNo string; Status string; TotalAmount int64; Currency string }

type CatalogServiceServer interface { GetProduct(context.Context,*ProductIdRequest)(*Product,error); ListProducts(context.Context,*ProductListRequest)(*ProductListResponse,error) }
type InventoryServiceServer interface { Check(context.Context,*InventoryRequest)(*InventoryResponse,error) }
type OrderServiceServer interface { Create(context.Context,*CreateOrderRequest)(*Order,error) }
