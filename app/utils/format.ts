import type { IMoney, IMoneyRange } from "commerce-provider";

let currencyMap: Map<string, [string, number]> = new Map([
  ["CAD", ["$", 2]],
  ["USD", ["$", 2]],
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
