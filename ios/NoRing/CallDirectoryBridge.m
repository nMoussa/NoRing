#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CallDirectoryBridge, NSObject)

RCT_EXTERN_METHOD(
  syncAndReload:(NSArray<NSString *> *)blockedNumbers
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  getEnabledStatus:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  openSettings:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

@end
