export default function gql(strings: TemplateStringsArray, ...values: any[]) {
  let str = strings[0];
  strings.slice(1).forEach((string, i) => {
    str += string + values[i];
  });
  return str.replace(/\s{0,}\n\s{0,}/g, " ").trim();
}

export function gqlFetch(
  url: string,
  query: string,
  variables?: Record<string, any>,
  init?: RequestInit
) {
  let headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  return fetch(url, {
    ...init,
    method: "POST",
    body: JSON.stringify({ query, variables }),
    headers,
  });
}
