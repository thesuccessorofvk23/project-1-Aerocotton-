"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export type PlpProduct = {
  id: string;
  name: string;
  department: string;
  category: string;
  productType: string;
  collection: string;
  collectionSlug: string;
  productSlug: string;
  image: string;
  /** Pattern / colourway line, indexed by search. */
  tagline: string;
  spec: string;
  gsm: number | null;
  weaveTag: string;
  materialTag: string;
  featured: boolean;
  model: boolean;
  variants: string[];
};

export type PlpCategory = {
  name: string;
  department: string;
  count: number;
  image: string;
};

export type PlpSeries = {
  name: string;
  count: number;
};

/** Variant names → swatch hex (matches the site's collection palettes). */
const COLOUR_HEX: Record<string, string> = {
  White: "#f4f1ea",
  Ivory: "#eae3d4",
  Natural: "#d9cbb3",
  Sage: "#8aa08b",
  Moss: "#4d5f52",
  Forest: "#354a42",
  Slate: "#5d6b7a",
  Fog: "#97a6b4",
  Charcoal: "#4b4a48",
  Stone: "#8e8a84",
  Sand: "#dcc9a5",
  Brass: "#b08d57",
  Ochre: "#a4743f",
  Rust: "#9a5433",
  Cocoa: "#7a5a3a",
  Lake: "#43626f",
  Mist: "#c3d2da",
  Seafoam: "#88b0a8",
  Storm: "#5b6b63",
  Aurora: "#5b6b63",
  Navy: "#2b3a55",
  Cobalt: "#32508c",
  Scarlet: "#b8392f",
  Cranberry: "#8e2a3a",
  Blush: "#e2b6ad",
  Tangerine: "#d97a35",
  Multicolour: "#c2a1d4",
};

const GSM_RANGES = [
  { label: "< 400 GSM", test: (g: number) => g < 400 },
  { label: "400 – 600 GSM", test: (g: number) => g >= 400 && g < 600 },
  { label: "600 – 800 GSM", test: (g: number) => g >= 600 && g < 800 },
  { label: "> 800 GSM", test: (g: number) => g >= 800 },
];

const PER_PAGE = 8;

function paginationRange(current: number, total: number): (number | "gap")[] {
  const wanted = new Set<number>([1, total, current - 1, current, current + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const n of pages) {
    if (n - prev > 1) out.push("gap");
    out.push(n);
    prev = n;
  }
  return out;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 250ms ease" }}
    >
      <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CatalogueExplorer({
  products,
  departmentCategories,
  typeCategories,
  seriesCategories,
}: {
  products: PlpProduct[];
  departmentCategories: Omit<PlpCategory, "department">[];
  typeCategories: PlpCategory[];
  seriesCategories: PlpSeries[];
}) {
  const [query, setQuery] = useState("");
  /** Debounced mirror of `query` — filtering stays off the critical path while typing. */
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>(typeCategories.map((c) => c.name));
  const [activeSeries, setActiveSeries] = useState<string[]>(seriesCategories.map((c) => c.name));
  const [materials, setMaterials] = useState<string[]>([]);
  const [weaves, setWeaves] = useState<string[]>([]);
  const [gsmFilters, setGsmFilters] = useState<string[]>([]);
  const [colour, setColour] = useState<string | null>(null);
  const [sort, setSort] = useState("Featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const explorerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  const typeNames = typeCategories.map((c) => c.name);
  const visibleTypeCategories = activeDepartment
    ? typeCategories.filter((category) => category.department === activeDepartment)
    : typeCategories.filter((category) => category.count > 0);
  const visibleTypeNames = visibleTypeCategories.map((category) => category.name);
  const seriesNames = seriesCategories.map((c) => c.name);
  const allTypesSelected = visibleTypeNames.every((name) => activeTypes.includes(name));
  const allSeriesSelected = activeSeries.length === seriesNames.length;

  const materialFacets = useMemo(
    () => [...new Set(products.map((p) => p.materialTag))],
    [products]
  );
  const weaveFacets = useMemo(
    () => [...new Set(products.map((p) => p.weaveTag))],
    [products]
  );
  /** Facet groups with a single value (or nothing to filter) are hidden. */
  const hasMaterialFacet = materialFacets.length > 1;
  const hasWeaveFacet = weaveFacets.length > 1;
  const hasSeriesFacet = seriesNames.length > 1;
  const hasGsmFacet = products.some((p) => p.gsm !== null);
  const hasColourFacet = products.some((p) => p.variants.length > 0);
  const colourFacets = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      for (const v of p.variants) {
        const hex = COLOUR_HEX[v] ?? "#b7ae9d";
        if (!seen.has(hex)) seen.set(hex, v);
      }
    }
    return [...seen.entries()].map(([hex, name]) => ({ hex, name }));
  }, [products]);

  /** One haystack per product — matched once, checked for every token. */
  const haystacks = useMemo(
    () =>
      new Map(
        products.map((p) => [
          p.id,
          [
            p.name,
            p.department,
            p.collection,
            p.materialTag,
            p.weaveTag,
            p.productType,
            p.category,
            p.tagline,
            ...p.variants,
          ]
            .join(" ")
            .toLowerCase(),
        ])
      ),
    [products]
  );

  const countBy = (fn: (p: PlpProduct) => boolean) =>
    products.filter(fn).length;

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const resetAll = () => {
    setQuery("");
    setDebouncedQuery("");
    setActiveDepartment(null);
    setActiveTypes(typeNames);
    setActiveSeries(seriesNames);
    setMaterials([]);
    setWeaves([]);
    setGsmFilters([]);
    setColour(null);
    setPage(1);
  };

  const selectDepartment = (name: string | null) => {
    setActiveDepartment(name);
    setActiveTypes(name
      ? typeCategories.filter((category) => category.department === name).map((category) => category.name)
      : typeNames);
    setPage(1);
    explorerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const filtered = useMemo(() => {
    const tokens = debouncedQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let list = products.filter((p) => {
      if (activeDepartment && p.department !== activeDepartment) return false;
      if (!activeTypes.includes(p.productType)) return false;
      if (!activeSeries.includes(p.category)) return false;
      if (materials.length && !materials.includes(p.materialTag)) return false;
      if (weaves.length && !weaves.includes(p.weaveTag)) return false;
      if (
        gsmFilters.length &&
        !(p.gsm !== null && GSM_RANGES.some((r) => gsmFilters.includes(r.label) && r.test(p.gsm as number)))
      )
        return false;
      if (colour && !p.variants.some((v) => (COLOUR_HEX[v] ?? "") === colour)) return false;
      if (tokens.length) {
        const hay = haystacks.get(p.id) ?? "";
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const byGsm = (a: PlpProduct, b: PlpProduct) => (a.gsm ?? 0) - (b.gsm ?? 0);
    if (sort === "Name A–Z") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "Name Z–A") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "GSM: Low to High") list = [...list].sort(byGsm);
    else if (sort === "GSM: High to Low") list = [...list].sort((a, b) => byGsm(b, a));
    else list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [products, activeDepartment, activeTypes, activeSeries, materials, weaves, gsmFilters, colour, debouncedQuery, sort, haystacks]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const anyFilterActive =
    query !== "" ||
    activeDepartment !== null ||
    !allTypesSelected ||
    !allSeriesSelected ||
    materials.length > 0 ||
    weaves.length > 0 ||
    gsmFilters.length > 0 ||
    colour !== null;

  return (
    <section className="aero-plp bg-ivory" ref={explorerRef}>
      {/* Product-type strip */}
      <div className="aero-plp__strip-wrap border-y border-hairline bg-linen">
        <div className="mx-auto w-full max-w-[2520px] px-6 md:px-10 lg:px-16">
          <div className="aero-plp__strip" role="tablist" aria-label="Product departments">
            {departmentCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                role="tab"
                aria-selected={activeDepartment === cat.name}
                className="aero-plp__cat"
                onClick={() => selectDepartment(cat.name)}
              >
                <span className="aero-plp__cat-thumb">
                  <img src={cat.image} alt="" loading="lazy" />
                </span>
                <span className="aero-plp__cat-name">{cat.name}</span>
                <span className="aero-plp__cat-count">
                  {cat.count} Product{cat.count === 1 ? "" : "s"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Explorer */}
      <div className="mx-auto w-full max-w-[2520px] px-6 md:px-10 lg:px-16 aero-plp__layout">
        <aside className="aero-plp__sidebar" aria-label="Catalogue filters">
          <div className="aero-plp__filters-head">
            <h2>Filters</h2>
            <button type="button" className="aero-plp__clear" onClick={resetAll} disabled={!anyFilterActive}>
              Clear all
            </button>
          </div>

          <details className="aero-plp__group" open>
            <summary>
              Search <Chevron open />
            </summary>
            <div className="aero-plp__search">
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search towels, cushion, jacquard…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                aria-label="Search products by name, type, series, material, weave or colour"
              />
              {query ? (
                <button
                  type="button"
                  className="aero-plp__search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    searchInputRef.current?.focus();
                  }}
                >
                  <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
                    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <p className="aero-plp__search-hint">
              Name, type, series, material, weave or colour.
            </p>
          </details>

          <details className="aero-plp__group" open>
            <summary>
              Product Category <Chevron open />
            </summary>
            <ul className="aero-plp__checks">
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={allTypesSelected}
                    onChange={() => {
                      setActiveTypes(allTypesSelected ? [] : visibleTypeNames);
                      setPage(1);
                    }}
                  />
                  <span>All Categories</span>
                  <small>({products.filter((p) => !activeDepartment || p.department === activeDepartment).length})</small>
                </label>
              </li>
              {visibleTypeCategories.map((cat) => (
                <li key={cat.name}>
                  <label>
                    <input
                      type="checkbox"
                      checked={activeTypes.includes(cat.name)}
                      disabled={cat.count === 0}
                      onChange={() => {
                        setActiveTypes((list) => toggle(list, cat.name));
                        setPage(1);
                      }}
                    />
                    <span>{cat.name}</span>
                    <small>({cat.count})</small>
                  </label>
                </li>
              ))}
            </ul>
          </details>

          {hasSeriesFacet && (
          <details className="aero-plp__group" open>
            <summary>
              Series <Chevron open />
            </summary>
            <ul className="aero-plp__checks">
              {seriesCategories.map((cat) => (
                <li key={cat.name}>
                  <label>
                    <input
                      type="checkbox"
                      checked={activeSeries.includes(cat.name)}
                      onChange={() => {
                        setActiveSeries((list) => toggle(list, cat.name));
                        setPage(1);
                      }}
                    />
                    <span>{cat.name}</span>
                    <small>({cat.count})</small>
                  </label>
                </li>
              ))}
            </ul>
          </details>
          )}

          {hasMaterialFacet && (
          <details className="aero-plp__group" open>
            <summary>
              Material <Chevron open />
            </summary>
            <ul className="aero-plp__checks">
              {materialFacets.map((m) => (
                <li key={m}>
                  <label>
                    <input
                      type="checkbox"
                      checked={materials.includes(m)}
                      onChange={() => {
                        setMaterials((list) => toggle(list, m));
                        setPage(1);
                      }}
                    />
                    <span>{m}</span>
                    <small>({countBy((p) => p.materialTag === m)})</small>
                  </label>
                </li>
              ))}
            </ul>
          </details>
          )}

          {hasWeaveFacet && (
          <details className="aero-plp__group">
            <summary>
              Weave / Finish <Chevron open={false} />
            </summary>
            <ul className="aero-plp__checks">
              {weaveFacets.map((w) => (
                <li key={w}>
                  <label>
                    <input
                      type="checkbox"
                      checked={weaves.includes(w)}
                      onChange={() => {
                        setWeaves((list) => toggle(list, w));
                        setPage(1);
                      }}
                    />
                    <span>{w}</span>
                    <small>({countBy((p) => p.weaveTag === w)})</small>
                  </label>
                </li>
              ))}
            </ul>
          </details>
          )}

          {hasGsmFacet && (
          <details className="aero-plp__group">
            <summary>
              GSM (towels) <Chevron open={false} />
            </summary>
            <ul className="aero-plp__checks">
              {GSM_RANGES.map((r) => (
                <li key={r.label}>
                  <label>
                    <input
                      type="checkbox"
                      checked={gsmFilters.includes(r.label)}
                      onChange={() => {
                        setGsmFilters((list) => toggle(list, r.label));
                        setPage(1);
                      }}
                    />
                    <span>{r.label}</span>
                    <small>({countBy((p) => p.gsm !== null && r.test(p.gsm))})</small>
                  </label>
                </li>
              ))}
            </ul>
          </details>
          )}

          {hasColourFacet && (
          <details className="aero-plp__group">
            <summary>
              Colour <Chevron open={false} />
            </summary>
            <div className="aero-plp__colours">
              {colourFacets.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  aria-label={`Filter by colour: ${c.name}`}
                  aria-pressed={colour === c.hex}
                  className={`aero-plp__swatch ${colour === c.hex ? "is-active" : ""}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => {
                    setColour(colour === c.hex ? null : c.hex);
                    setPage(1);
                  }}
                />
              ))}
            </div>
          </details>
          )}
        </aside>

        <div className="aero-plp__main">
          <div className="aero-plp__toolbar">
            <p className="aero-plp__count" aria-live="polite">
              {filtered.length} Product{filtered.length === 1 ? "" : "s"}
            </p>
            <div className="aero-plp__controls">
              <label className="aero-plp__sort">
                <span>Sort by</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option>Featured</option>
                  <option>Name A–Z</option>
                  <option>Name Z–A</option>
                  {hasGsmFacet && <option>GSM: Low to High</option>}
                  {hasGsmFacet && <option>GSM: High to Low</option>}
                </select>
              </label>
              <div className="aero-plp__views" role="group" aria-label="View">
                <button
                  type="button"
                  aria-pressed={view === "grid"}
                  aria-label="Grid view"
                  className={view === "grid" ? "is-active" : ""}
                  onClick={() => setView("grid")}
                >
                  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                    <rect x="1" y="1" width="6" height="6" fill="currentColor" />
                    <rect x="9" y="1" width="6" height="6" fill="currentColor" />
                    <rect x="1" y="9" width="6" height="6" fill="currentColor" />
                    <rect x="9" y="9" width="6" height="6" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-pressed={view === "list"}
                  aria-label="List view"
                  className={view === "list" ? "is-active" : ""}
                  onClick={() => setView("list")}
                >
                  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                    <path d="M1 3h14M1 8h14M1 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="aero-plp__empty">
              <p className="font-display text-2xl text-ink">No products match these filters.</p>
              <button type="button" className="aero-plp__clear" onClick={resetAll}>
                Clear all filters
              </button>
            </div>
          ) : (
            <ul className={`aero-plp__grid ${view === "list" ? "aero-plp__grid--list" : ""}`}>
              {visible.map((p) => (
                <li key={p.id} className="aero-plp__cell">
                  <Link href={`/products/${p.collectionSlug}/${p.productSlug}`} className="aero-plp__card">
                    <span className="aero-plp__media">
                      <img src={p.image} alt={p.name} loading="lazy" />
                    </span>
                    <span className="aero-plp__body">
                      <span className="aero-plp__eyebrow">
                        {p.productType}
                      </span>
                      <span className="aero-plp__name-row">
                        <span className="aero-plp__name">{p.name}</span>
                        <span className="aero-plp__arrow" aria-hidden="true">
                          <svg viewBox="0 0 16 16" width="12" height="12">
                            <path d="M2 8h11M9 3.5L13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </span>
                      <span className="aero-plp__series">{p.department}</span>
                      <span className="aero-plp__spec">{p.spec}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <nav className="aero-plp__pagination" aria-label="Catalogue pages">
              <button
                type="button"
                aria-label="Previous page"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
              >
                ←
              </button>
              {paginationRange(safePage, pageCount).map((item, i) =>
                item === "gap" ? (
                  <span key={`gap-${i}`} className="aero-plp__pag-gap" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    aria-current={item === safePage ? "page" : undefined}
                    className={item === safePage ? "is-active" : ""}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label="Next page"
                disabled={safePage === pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                →
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
