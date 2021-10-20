import { Link } from "react-router-dom";

export type ProductCardProps = {
  lazy?: boolean;
  image: string;
  title: string;
  price: string;
  currencyCode: string;
  to: string;
  new?: boolean;
};

export default function ProductCard({
  lazy,
  image,
  title,
  price,
  currencyCode,
  to,
  new: _new,
}: ProductCardProps) {
  return (
    <div className="card">
      <Link to={to} className="card-body">
        <div className="block aspect-w-4 aspect-h-5">
          <img
            loading={lazy ? "lazy" : undefined}
            className="object-cover"
            alt=""
            src={image}
          />
        </div>
        <h2 className="card-title my-4">
          {title}
          {_new ? (
            <div className="badge mx-2 badge-secondary">NEW</div>
          ) : undefined}
        </h2>
        <div className="text-md">
          {price} <span className="text-2xs font-semibold">{currencyCode}</span>
        </div>
      </Link>
    </div>
  );
}
