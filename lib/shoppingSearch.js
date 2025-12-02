export async function searchProducts(query, maxPrice) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.error('Missing SERPAPI_KEY');
    return [];
  }
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('SerpApi error', res.status, await res.text());
    return [];
  }
  const data = await res.json();
  const items = data.shopping_results || [];
  const products = items
    .map(item => {
      const rawPrice =
        typeof item.extracted_price === 'number'
          ? item.extracted_price
          : item.price
          ? parseFloat(String(item.price).replace(/[^0-9.]/g, ''))
          : null;
      if (!rawPrice || Number.isNaN(rawPrice)) return null;
      return {
        title: item.title,
        url: item.link,
        merchant: item.source,
        price: rawPrice,
        rating: item.rating ?? null,
        reviews: item.reviews ?? null,
        image: item.thumbnail || item.thumbnail_url || item.image,
      };
    })
    .filter(Boolean)
    .filter(p => (!maxPrice || p.price <= maxPrice));
  products.sort((a, b) => a.price - b.price);
  return products.slice(0, 10);
}
