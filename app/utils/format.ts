import { IMoney, IMoneyRange } from "~/commerce-provider";
import { CurrencyCode } from "~/graphql/shopify";

let currencyMap: Map<CurrencyCode | string, [string, number]> = new Map([
  [CurrencyCode.Cad, ["$", 2]],
  [CurrencyCode.Usd, ["$", 2]],
]);

export function formatPrice(price: IMoney, symbol: boolean = true) {
  let num =
    typeof price.amount === "number"
      ? price.amount
      : Number.parseFloat(price.amount);

  if (!currencyMap.has(price.currencyCode)) {
    throw new Error(
      `failed to format price for currency code ${price.currencyCode}`
    );
  }

  let [currencySymbol, fractionDigits] = currencyMap.get(price.currencyCode)!;

  return `${symbol ? currencySymbol : ""}${num.toFixed(fractionDigits)}`;
}

export function formatPriceRange(prices: IMoneyRange) {
  if (!prices.min) {
    return formatPrice({
      amount: prices.max,
      currencyCode: prices.currencyCode,
    });
  }

  return `${formatPrice({
    amount: prices.min,
    currencyCode: prices.currencyCode,
  })} - ${formatPrice(
    {
      amount: prices.max,
      currencyCode: prices.currencyCode,
    },
    false
  )}`;
}
