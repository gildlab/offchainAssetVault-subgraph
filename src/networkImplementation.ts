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
    
    // Initialize with known values for each network
    const network = dataSource.network();
    
    if (network == 'mainnet') {
      // Ethereum Mainnet
      this.authorizerImplementations = [
        "0x1234567890123456789012345678901234567890" // Replace with actual address
      ];
      this.vaultImplementations = [
        "0x0987654321098765432109876543210987654321" // Replace with actual address
      ];
    } else if (network == 'polygon') {
      // Polygon Mainnet
      this.authorizerImplementations = [
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" // Replace with actual address
      ];
      this.vaultImplementations = [
        "0xfedcbafedcbafedcbafedcbafedcbafedcbafedcba" // Replace with actual address
      ];
    } else if (network == 'polygon-amoy') {
      // Polygon Amoy Testnet
      this.authorizerImplementations = [
        "0xB8a96Df657B8b921dfaaFFe44C9B47699e650945" // Replace with actual address
      ];
      this.vaultImplementations = [
        "0x7e9434d67F0e00cc9ac02822b5F600bF2Fb207E5" // Replace with actual address
      ];
    } else {
      // Default fallbacks - could be base addresses that might work on any network
      this.authorizerImplementations = [];
      this.vaultImplementations = [];
    }
  }
  
  // Helper to check if an address is an authorizer implementation
  public isAuthorizerImplementation(address: string): boolean {
    for (let i = 0; i < this.authorizerImplementations.length; i++) {
      if (address.toLowerCase() == this.authorizerImplementations[i].toLowerCase()) {
        return true;
      }
    }
    // If no exact match, fall back to a string pattern match
    return address.includes("Authorizer") || address.includes("authorizer");
  }
  
  // Helper to check if an address is a vault implementation
  public isVaultImplementation(address: string): boolean {
    for (let i = 0; i < this.vaultImplementations.length; i++) {
      if (address.toLowerCase() == this.vaultImplementations[i].toLowerCase()) {
        return true;
      }
    }
    // Fall back to a negative check - it's a vault if it's not an authorizer
    return !this.isAuthorizerImplementation(address);
  }
}

// Export a singleton instance
export const networkImplementation = new NetworkImplemenation(); 