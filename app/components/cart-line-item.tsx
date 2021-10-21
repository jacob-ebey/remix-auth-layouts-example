import { useMemo, useRef } from "react";
import { Form, useSubmit, useTransition } from "remix";
import { Link } from "react-router-dom";

import type { ISelectedOption } from "commerce-provider";

export interface CartLineItemProps {
  image: string;
  price: string;
  productSlug: string;
  productVariantId: string;
  selectedOptions: ISelectedOption[];
  title: string;
  total: string;
  quantity: number;
}

export default function CartLineItem({
  image,
  price,
  productSlug,
  productVariantId,
  selectedOptions,
  title,
  total,
  quantity,
}: CartLineItemProps) {
  let transition = useTransition();
  let submitting = transition.state !== "idle";

  let quantityForm = useRef<HTMLFormElement>(null);
  let submit = useSubmit();

  let to = useMemo(() => {
    let searchParams = new URLSearchParams();
    for (let selected of selectedOptions) {
      searchParams.set(selected.name, selected.value);
    }
    let search = searchParams.toString();
    return { pathname: `/p/${productSlug}`, search };
  }, [selectedOptions]);

  let handleQuantityChanged = () => {
    submit(quantityForm.current);
  };

  return (
    <tr key={productVariantId}>
      <td className="w-20 hidden pb-4 md:table-cell">
        <Link tabIndex={-1} to={to} className="block aspect-w-4 aspect-h-5">
          <img src={image} className="rounded" alt="Thumbnail" />
        </Link>
      </td>
      <td>
        <Link to={to}>
          <p className="text-lg mb-2 md:ml-4">{title}</p>
          <ul className="mb-2 md:ml-4">
            {selectedOptions.map((option) => (
              <li key={option.name}>
                {option.name}: {option.value}
              </li>
            ))}
          </ul>
        </Link>
        <Form action="/cart/remove" method="post">
          <input
            name="productVariantId"
            type="hidden"
            value={productVariantId}
          />
          <button
            type="submit"
            className="text-secondary md:ml-4"
            disabled={submitting}
          >
            <small>(Remove item)</small>
          </button>
        </Form>
      </td>
      <td className="justify-center md:justify-end md:flex mt-6">
        <div className="w-20 h-10">
          <div className="relative flex flex-row w-full h-8">
            <Form action="/cart/update" method="post" ref={quantityForm}>
              <input
                name="productVariantId"
                type="hidden"
                value={productVariantId}
              />
              <select
                name="quantity"
                className="select select-bordered w-full"
                onChange={handleQuantityChanged}
                defaultValue={quantity}
                disabled={submitting}
              >
                {Array(10)
                  .fill(0)
                  .map((_, index) => (
                    <option key={index} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
              </select>
              <noscript>
                <button type="submit">Set quantity</button>
              </noscript>
            </Form>
          </div>
        </div>
      </td>
      <td className="hidden text-right md:table-cell">
        <span className="text-sm lg:text-base font-medium">{price}</span>
      </td>
      <td className="text-right">
        <span className="text-sm lg:text-base font-medium">{total}</span>
      </td>
    </tr>
  );
}
