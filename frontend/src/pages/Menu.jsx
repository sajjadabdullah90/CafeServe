import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Menu() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu() {
      setStatus("loading");
      try {
        const response = await fetch(`${API_URL}/api/menu`, { signal: controller.signal });
        if (!response.ok) throw new Error("The menu could not be loaded.");
        const result = await response.json();
        setItems(Array.isArray(result.data) ? result.data : []);
        setStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") setStatus("error");
      }
    }

    loadMenu();
    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(items.map((item) => item.category?.name).filter(Boolean))],
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category?.name === activeCategory;
      const matchesQuery = !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        (item.description || "").toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [items, query, activeCategory]);

  return (
    <main className="menu-page">
      <section className="menu-intro">
        <span className="menu-eyebrow">FRESHLY MADE · ALWAYS WORTH IT</span>
        <h1>Good taste.<br /><span>No compromises.</span></h1>
        <p>From first bite to last, find something worth slowing down for.</p>
      </section>

      <section className="menu-controls" aria-label="Menu filters">
        <label className="menu-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search dishes..."
            aria-label="Search dishes"
          />
        </label>
        <div className="menu-categories" aria-label="Filter by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? "menu-chip menu-chip--active" : "menu-chip"}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {status === "loading" && (
        <div className="menu-state" role="status">
          <span className="menu-spinner" />
          <h2>Preparing the menu</h2>
          <p>Just a moment while we bring everything together.</p>
        </div>
      )}

      {status === "error" && (
        <div className="menu-state menu-state--error" role="alert">
          <span className="menu-state__icon">!</span>
          <h2>We couldn't load the menu</h2>
          <p>Make sure the CafeServe backend is running, then refresh this page.</p>
          <button className="menu-retry" onClick={() => window.location.reload()} type="button">Try again</button>
        </div>
      )}

      {status === "success" && filteredItems.length > 0 && (
        <section className="menu-grid" aria-label="Available food items">
          {filteredItems.map((item) => (
            <article className="food-card" key={item.id}>
              <div className="food-card__image-wrap">
                {item.image ? (
                  <img
                    className="food-card__image"
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.parentElement.classList.add("food-card__image-wrap--missing");
                    }}
                  />
                ) : (
                  <div className="food-card__image-placeholder" aria-label="No image available">🍽️</div>
                )}
                {item.category?.name && <span className="food-card__category">{item.category.name}</span>}
              </div>
              <div className="food-card__body">
                <div className="food-card__heading">
                  <h2>{item.name}</h2>
                  <span className="food-card__price">Rs. {Number(item.price).toLocaleString("en-PK")}</span>
                </div>
                <p>{item.description || "Made fresh to order with quality ingredients."}</p>
                <button className="food-card__button" type="button" disabled title="Ordering will be enabled in the next step">
                  <span>+</span> Add to order <small>Coming next</small>
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {status === "success" && filteredItems.length === 0 && (
        <div className="menu-state">
          <span className="menu-state__icon">⌕</span>
          <h2>{items.length ? "No dishes found" : "Our kitchen is getting ready"}</h2>
          <p>{items.length ? "Try another search or choose a different category." : "There are no available menu items yet. Seed the database to add the demo menu."}</p>
          {items.length > 0 && (
            <button className="menu-retry" type="button" onClick={() => { setQuery(""); setActiveCategory("All"); }}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default Menu;
