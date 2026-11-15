import type { ProviderConnector } from './types';
import { providerById } from '../data/providers';

/** Live connectors, keyed by provider id. Empty in v1 – everything is "coming soon". */
const CONNECTORS: Record<string, ProviderConnector> = {
  // Example once built:
  // 'hsbc-uk': new OpenBankingConnector('hsbc-uk'),
};

export function connectorFor(providerId: string): ProviderConnector | undefined {
  return CONNECTORS[providerId];
}

export function isConnectable(providerId: string): boolean {
  return providerById(providerId)?.status === 'available' && !!CONNECTORS[providerId];
}
