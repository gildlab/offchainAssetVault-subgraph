import { dataSource } from '@graphprotocol/graph-ts';

// Network-specific configuration values
export class NetworkImplemenation {
  // Authorizer implementation addresses by network
  public authorizerImplementations: string[];
  
  // Vault implementation addresses by network
  public vaultImplementations: string[];
  
  constructor() {
    this.authorizerImplementations = [];
    this.vaultImplementations = [];
    
    const network = dataSource.network();
    
    if (network == 'mainnet') {
      this.authorizerImplementations = [
        "0x1234567890123456789012345678901234567890"
      ];
      this.vaultImplementations = [
        "0x0987654321098765432109876543210987654321"
      ];
    } else if (network == 'polygon') {
      this.authorizerImplementations = [
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      ];
      this.vaultImplementations = [
        "0xfedcbafedcbafedcbafedcbafedcbafedcbafedcba"
      ];
    } else if (network == 'polygon-amoy') {
      this.authorizerImplementations = [
        "0xB8a96Df657B8b921dfaaFFe44C9B47699e650945"
      ];
      this.vaultImplementations = [
        "0x7e9434d67F0e00cc9ac02822b5F600bF2Fb207E5"
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

export const networkImplementation = new NetworkImplemenation(); 