// Authorizer Implementation Addresses
export const AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0x99B2aC726f8e41a22f27e7e35D554888103b88E9";
export const ARBITRUM_ONE_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0x0438560b398eA874DEb29360aCda10735D9790C8";
export const BASE_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0x2B4A510c3619d5E888095BFE9f95902D32dA5556";
export const BASE_AUTHORIZER_IMPLEMENTATION_ADDRESS_ALT =
  "0x2EA0d35d0B1F57C42e6130f298930228bCbFDe9b";
export const BASE_PAYMENT_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0xfDd9F4Cd3Db08c2a8cCa9CE181710a69de7d6c87";
export const BASE_SEPOLIA_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0x667d2Ab75908c7d7983008aDbF558332F381a5f5";
export const BASE_SEPOLIA_PAYMENT_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0x72b2a394E129ede556b4024aCe939a964bA0a876";
export const POLYGON_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0xffffffffffffffffffffffffffffffffffffffff";
export const MAINNET_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0x2EA0d35d0B1F57C42e6130f298930228bCbFDe9b";
export const MAINNET_PAYMENT_AUTHORIZER_IMPLEMENTATION_ADDRESS =
  "0xeaD68E489Cb19453b294dc46a3A5710b0d46d17F";

/**
 * Known authorizer implementation addresses per network.
 * Vault clones are not created via CloneFactory — they come from StoxUnifiedDeployer.
 */
export class NetworkImplementation {
  public authorizerImplementations: string[];

  constructor(network: string) {
    this.authorizerImplementations = [];

    if (network == "mainnet") {
      this.authorizerImplementations = [
        MAINNET_AUTHORIZER_IMPLEMENTATION_ADDRESS,
        MAINNET_PAYMENT_AUTHORIZER_IMPLEMENTATION_ADDRESS,
      ];
    } else if (network == "polygon") {
      this.authorizerImplementations = [
        POLYGON_AUTHORIZER_IMPLEMENTATION_ADDRESS,
      ];
    } else if (network == "arbitrum-one") {
      this.authorizerImplementations = [
        ARBITRUM_ONE_AUTHORIZER_IMPLEMENTATION_ADDRESS,
      ];
    } else if (network == "polygon-amoy") {
      this.authorizerImplementations = [AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS];
    } else if (network == "base") {
      this.authorizerImplementations = [
        BASE_AUTHORIZER_IMPLEMENTATION_ADDRESS,
        BASE_AUTHORIZER_IMPLEMENTATION_ADDRESS_ALT,
        BASE_PAYMENT_AUTHORIZER_IMPLEMENTATION_ADDRESS,
      ];
    } else if (network == "base-sepolia") {
      this.authorizerImplementations = [
        BASE_SEPOLIA_AUTHORIZER_IMPLEMENTATION_ADDRESS,
        BASE_SEPOLIA_PAYMENT_AUTHORIZER_IMPLEMENTATION_ADDRESS,
      ];
    }
  }

  public isAuthorizerImplementation(address: string): boolean {
    for (let i = 0; i < this.authorizerImplementations.length; i++) {
      if (
        address.toLowerCase() == this.authorizerImplementations[i].toLowerCase()
      ) {
        return true;
      }
    }
    return address.includes("Authorizer") || address.includes("authorizer");
  }
}
