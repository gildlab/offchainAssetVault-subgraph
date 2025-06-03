// Authorizer Implementation Addresses
export const AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS = "0x99B2aC726f8e41a22f27e7e35D554888103b88E9";
export const ARBITRUM_ONE_AUTHORIZER_IMPLEMENTATION_ADDRESS = "0x0438560b398eA874DEb29360aCda10735D9790C8";
export const POLYGON_AUTHORIZER_IMPLEMENTATION_ADDRESS = "0xffffffffffffffffffffffffffffffffffffffff";
export const MAINNET_AUTHORIZER_IMPLEMENTATION_ADDRESS = "0xffffffffffffffffffffffffffffffffffffffff";

// Vault Implementation Addresses
export const AMOY_VAULT_IMPLEMENTATION_ADDRESS = "0x3eD9dA0268198aafFFDAa760e9cB0C6750dbb3Da";
export const ARBITRUM_ONE_VAULT_IMPLEMENTATION_ADDRESS = "0xA75040cc33bF4BE0c953e4617f66ff05798B4D1c";
export const POLYGON_VAULT_IMPLEMENTATION_ADDRESS = "0xffffffffffffffffffffffffffffffffffffffff";
export const MAINNET_VAULT_IMPLEMENTATION_ADDRESS = "0xffffffffffffffffffffffffffffffffffffffff";

export class NetworkImplementation {
  // Authorizer implementation addresses by network
  public authorizerImplementations: string[];
  
  // Vault implementation addresses by network
  public vaultImplementations: string[];
  
  constructor(network: string) {
    this.authorizerImplementations = [];
    this.vaultImplementations = [];
  
    if (network == 'mainnet') {
      this.authorizerImplementations = [
        MAINNET_AUTHORIZER_IMPLEMENTATION_ADDRESS 
      ];
      this.vaultImplementations = [
        MAINNET_VAULT_IMPLEMENTATION_ADDRESS
      ];
    } else if (network == 'polygon') {
      this.authorizerImplementations = [
        POLYGON_AUTHORIZER_IMPLEMENTATION_ADDRESS
      ];
      this.vaultImplementations = [
        POLYGON_VAULT_IMPLEMENTATION_ADDRESS
      ];
    } else if (network == 'arbitrum-one') {
      this.authorizerImplementations = [
        ARBITRUM_ONE_AUTHORIZER_IMPLEMENTATION_ADDRESS
      ];
      this.vaultImplementations = [
        ARBITRUM_ONE_VAULT_IMPLEMENTATION_ADDRESS
      ];
    } else if (network == 'polygon-amoy') {
      this.authorizerImplementations = [
        AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS
      ];
      this.vaultImplementations = [
        AMOY_VAULT_IMPLEMENTATION_ADDRESS
      ];
    } else {
      this.authorizerImplementations = [];
      this.vaultImplementations = [];
    }
  }
  
  public isAuthorizerImplementation(address: string): boolean {
    for (let i = 0; i < this.authorizerImplementations.length; i++) {
      if (address.toLowerCase() == this.authorizerImplementations[i].toLowerCase()) {
        return true;
      }
    }
    return address.includes("Authorizer") || address.includes("authorizer");
  }
  
  public isVaultImplementation(address: string): boolean {
    for (let i = 0; i < this.vaultImplementations.length; i++) {
      if (address.toLowerCase() == this.vaultImplementations[i].toLowerCase()) {
        return true;
      }
    }
    return !this.isAuthorizerImplementation(address);
  }
}
