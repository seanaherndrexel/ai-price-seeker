export async function searchProducts(query, maxPrice) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.error("Missing SERPAPI_KEY");
    return [];
  }
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("SerpApi error", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  const items = data.shopping_results || [];
  const products = items
    .map((r) => {
      const extracted =
        typeof r.extracted_price === "number"
          ? r.extracted_price
          : r.price
          ? parseFloat(String(r.price).replace(/[^0-9.]/g, ""))
          : null;
      if (!extracted || Number.isNaN(extracted)) return null;
      return {
        title: r.title,
        url: r.link,
        merchant: r.source,
        price: extracted,
        rating: r.rating ?? null,
        reviews: r.reviews ?? null,
      };
    })
    .filter(Boolean)
    .filter((p) => (!maxPrice ? true : p.price <= maxPrice));
  products.sort((a, b) => a.price - b.price);
  return products.slice(0, 10);
}
