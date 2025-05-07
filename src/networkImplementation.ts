// Authorizer Implementation Addresses
export const AMOY_AUTHORIZER_IMPLEMENTATION_ADDRESS = "0xe580e077De0485f6298e5bE8734F71b4AAA0365a";
export const POLYGON_AUTHORIZER_IMPLEMENTATION_ADDRESS = "0xffffffffffffffffffffffffffffffffffffffff";
export const MAINNET_AUTHORIZER_IMPLEMENTATION_ADDRESS = "0xffffffffffffffffffffffffffffffffffffffff";

// Vault Implementation Addresses
export const AMOY_VAULT_IMPLEMENTATION_ADDRESS = "0x9F4cDc54Ce4640F3a10c048DeB93f1cc91b7CdD6";
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
