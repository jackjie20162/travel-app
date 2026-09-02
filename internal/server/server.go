package server

import "github.com/zeromicro/go-zero/zrpc"

// Register reserves the RPC registration point for generated protobuf services.
// The initial repository keeps the contract and service boundary explicit;
// generated registration code will be added after protoc/gen-rpc is wired into CI.
func Register(_ *zrpc.RpcServer) {}
