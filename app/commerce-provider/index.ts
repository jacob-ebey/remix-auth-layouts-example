export interface IPageMeta {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  cursor: string;
}

export interface ICollection {
  id: string;
  slug: string;
  title: string;
}

export interface IMoney {
  currencyCode: string;
  amount: string;
}

export interface IMoneyRange {
  min?: string;
  max: string;
  currencyCode: string;
}

export interface IProduct {
  id: string;
  slug: string;
  title: string;
  image: string;
  priceRange: IMoneyRange;
}

export interface IProductVariant {
  id: string;
  price: IMoney;
}

export interface IProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface IProductDetails extends IProduct {
  images: string[];
  options: IProductOption[];
  selectedVariant?: IProductVariant;
}

export interface ICollectionPage extends ICollection, IPageMeta {
  products: IProduct[];
}

export interface ISelectedOption {
  name: string;
  value: string;
}

export interface IProductsPage extends IPageMeta {
  products: IProduct[];
}

export interface ILineItems extends Record<string, number> {}

export interface ICartLineItemSummary {
  productSlug: string;
  productVariantId: string;
  title: string;
  image: string;
  selectedOptions: ISelectedOption[];
}

export interface ICartLineItem {
  itemPrice: IMoney;
  quantity: number;
  total: IMoney;
  summary: ICartLineItemSummary;
}

export interface ICart {
  total: IMoney;
  lineItems: ICartLineItem[];
}

export interface ICommerceProvider {
  allCollections(): Promise<ICollection[]>;
  collectionPage(
    slug: string,
    perPage: number,
    cursor?: string | null
  ): Promise<ICollectionPage | null>;
  allProducts(perPage: number, cursor?: string | null): Promise<IProductsPage>;
  cartFromLineItems(lineItems: ILineItems): Promise<ICart>;
  productDetails(slug: string, selectedOptions?: ISelectedOption[]): Promise<IProductDetails>;
}
