"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PUBLIC_PROPERTY_TYPE_LABELS } from "../lib/public-api";

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
];

function BrowseForm({ m }) {
  const router = useRouter();
  const sp = useSearchParams();
  const f = m.listings.filters;

  const initial = useMemo(() => {
    const o = {};
    for (const [k, v] of sp.entries()) {
      o[k] = v;
    }
    return o;
  }, [sp]);

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const [key, val] of fd.entries()) {
      if (typeof val === "string" && val.trim() !== "") next.set(key, val.trim());
    }
    next.set("page", "1");
    const qs = next.toString();
    router.push(qs ? `/listings?${qs}` : "/listings");
  }

  return (
    <form className="listings-filters" onSubmit={onSubmit}>
      <p className="listings-filters__title">{f.title}</p>
      <div className="listings-filters__grid">
        <label className="listings-filters__field listings-filters__field--keywords">
          <span>{f.q}</span>
          <input
            className="listings-filters__input"
            name="q"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            defaultValue={initial.q ?? ""}
            placeholder={f.placeholderQ ?? "City, title, area…"}
          />
        </label>
        <label className="listings-filters__field">
          <span>{f.listingType}</span>
          <select className="listings-filters__input" name="listingType" defaultValue={initial.listingType ?? ""}>
            <option value="">{f.all}</option>
            <option value="SALE">{f.buy}</option>
            <option value="RENT">{f.rent}</option>
          </select>
        </label>
        <label className="listings-filters__field">
          <span>{f.propertyType}</span>
          <select className="listings-filters__input" name="propertyType" defaultValue={initial.propertyType ?? ""}>
            <option value="">{f.all}</option>
            {Object.entries(PUBLIC_PROPERTY_TYPE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="listings-filters__field">
          <span>{f.city}</span>
          <input className="listings-filters__input" name="city" defaultValue={initial.city ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.area}</span>
          <input className="listings-filters__input" name="area" defaultValue={initial.area ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.minPrice}</span>
          <input className="listings-filters__input" name="minPrice" inputMode="decimal" defaultValue={initial.minPrice ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.maxPrice}</span>
          <input className="listings-filters__input" name="maxPrice" inputMode="decimal" defaultValue={initial.maxPrice ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.minBedrooms}</span>
          <input className="listings-filters__input" name="minBedrooms" inputMode="numeric" defaultValue={initial.minBedrooms ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.maxBedrooms}</span>
          <input className="listings-filters__input" name="maxBedrooms" inputMode="numeric" defaultValue={initial.maxBedrooms ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.minBathrooms}</span>
          <input className="listings-filters__input" name="minBathrooms" inputMode="numeric" defaultValue={initial.minBathrooms ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.maxBathrooms}</span>
          <input className="listings-filters__input" name="maxBathrooms" inputMode="numeric" defaultValue={initial.maxBathrooms ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.minSqm}</span>
          <input className="listings-filters__input" name="minSqm" inputMode="decimal" defaultValue={initial.minSqm ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.maxSqm}</span>
          <input className="listings-filters__input" name="maxSqm" inputMode="decimal" defaultValue={initial.maxSqm ?? ""} />
        </label>
        <label className="listings-filters__field">
          <span>{f.sort}</span>
          <select className="listings-filters__input" name="sort" defaultValue={initial.sort ?? "createdAt_desc"}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="listings-filters__actions">
        <button type="submit" className="mk-btn mk-btn--primary">
          {f.apply}
        </button>
        <button type="button" className="mk-btn mk-btn--ghost" onClick={() => router.push("/listings")}>
          {f.clear}
        </button>
      </div>
    </form>
  );
}

/**
 * @param {{ m: Record<string, unknown> }} props
 */
export function ListingsBrowseClient({ m }) {
  return (
    <Suspense
      fallback={
        <div className="listings-filters listings-filters--loading">
          <p className="listings-filters__title">{m?.listings?.filters?.title ?? "Search & filters"}</p>
        </div>
      }
    >
      <BrowseForm m={m} />
    </Suspense>
  );
}
