import type { ICommerceProvider } from "./commerce-provider";

export interface RequestContext {
  commerce: ICommerceProvider;
}
