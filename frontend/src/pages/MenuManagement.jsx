import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const EMPTY_FORM = { name: "", description: "", price: "", image: "", categoryId: "", available: true };

function formatPrice(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

function MenuManagement() {
  const { token, user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/menu`, { headers }),
        fetch(`${API_URL}/api/admin/categories`, { headers }),
      ]);
      const [itemsResult, categoriesResult] = await Promise.all([itemsResponse.json(), categoriesResponse.json()]);
      if (!itemsResponse.ok) throw new Error(itemsResult.message || "Could not load menu items.");
      if (!categoriesResponse.ok) throw new Error(categoriesResult.message || "Could not load categories.");
      const nextCategories = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
      setItems(Array.isArray(itemsResult.data) ? itemsResult.data : []);
      setCategories(nextCategories);
      setForm((current) => current.categoryId || !nextCategories.length
        ? current
        : { ...current, categoryId: String(nextCategories[0].id) });
    } catch (err) {
      setError(err.message || "Could not load menu management.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedImage) { setImagePreview(""); return undefined; }
    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const isAvailable = item.available;
      const matchesStatus = filter === "ALL" || (filter === "AVAILABLE" ? isAvailable : !isAvailable);
      const matchesSearch = !query || [item.name, item.description, item.category?.name, String(item.id)]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, filter]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setSelectedImage(null);
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: String(Number(item.price)),
      image: item.image || "",
      categoryId: String(item.categoryId),
      available: Boolean(item.available),
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setSelectedImage(null);
    setForm({ ...EMPTY_FORM, categoryId: categories.length ? String(categories[0].id) : "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      let imageUrl = form.image.trim();
      if (selectedImage) {
        const uploadBody = new FormData();
        uploadBody.append("image", selectedImage);
        const uploadResponse = await fetch(`${API_URL}/api/admin/uploads/menu-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadBody,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadResult.message || "Could not upload the image.");
        imageUrl = uploadResult.data.url;
      }
      const payload = { name: form.name.trim(), description: form.description.trim(), price: Number(form.price), image: imageUrl, categoryId: Number(form.categoryId), available: Boolean(form.available) };
      const response = await fetch(`${API_URL}/api/admin/menu${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save this menu item.");
      setNotice(editingId ? `“${result.data.name}” updated successfully.` : `“${result.data.name}” added to the menu.`);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Could not save this menu item.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/admin/menu/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: item.name,
          description: item.description || "",
          price: Number(item.price),
          image: item.image || "",
          categoryId: item.categoryId,
          available: !item.available,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update availability.");
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...result.data, _count: item._count } : entry));
      setNotice(`${item.name} is now ${result.data.available ? "available" : "hidden from customers"}.`);
    } catch (err) {
      setError(err.message || "Could not update availability.");
    }
  }

  async function archiveItem(item) {
    if (!window.confirm(`Hide “${item.name}” from the customer menu? Past orders will remain intact.`)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/admin/menu/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not archive this item.");
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...result.data, _count: item._count } : entry));
      if (editingId === item.id) resetForm();
      setNotice(`${item.name} was hidden from the customer menu. Its order history was preserved.`);
    } catch (err) {
      setError(err.message || "Could not archive this item.");
    }
  }

  async function addCategory(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const name = categoryName.trim();
    if (!name) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not create category.");
      const nextCategories = [...categories, result.data].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(nextCategories);
      setForm((current) => ({ ...current, categoryId: String(result.data.id) }));
      setCategoryName("");
      setNotice(`Category “${result.data.name}” created.`);
    } catch (err) {
      setError(err.message || "Could not create category.");
    }
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: "/admin/menu" }} />;
  if (user?.role !== "ADMIN") {
    return (
      <main className="menu-management-page">
        <section className="admin-empty">
          <span className="menu-eyebrow">RESTRICTED AREA</span>
          <h1>Admin access <span>required.</span></h1>
          <p>This page is only available to CafeServe administrators.</p>
          <Link className="cart-primary-button" to="/">Return home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="menu-management-page">
      <section className="menu-management-intro">
        <div>
          <span className="menu-eyebrow">CAFESERVE · CATALOGUE</span>
          <h1>Your menu, <span>your call.</span></h1>
          <p>Add dishes, adjust prices, and control what customers can order.</p>
        </div>
        <Link className="menu-management-back" to="/admin">← Dashboard</Link>
      </section>

      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      {notice && <div className="admin-alert" role="status">{notice}</div>}

      <section className="menu-management-layout">
        <div className="menu-management-form-panel">
          <span className="menu-eyebrow">{editingId ? "EDIT EXISTING DISH" : "BUILD THE MENU"}</span>
          <h2>{editingId ? "Update dish" : "Add a dish"}</h2>
          <p className="menu-management-muted">Keep names, prices and availability up to date.</p>
          <form className="menu-management-form" onSubmit={handleSubmit}>
            <label>Food name<input name="name" value={form.name} onChange={updateField} minLength={2} maxLength={100} placeholder="e.g. Double Smash Burger" required /></label>
            <label>Description<textarea name="description" value={form.description} onChange={updateField} maxLength={1000} rows={3} placeholder="A short description of the dish" /></label>
            <div className="menu-management-form__row">
              <label>Price (PKR)<input name="price" type="number" min="0.01" max="9999999.99" step="0.01" value={form.price} onChange={updateField} placeholder="1290" required /></label>
              <label>Category<select name="categoryId" value={form.categoryId} onChange={updateField} required disabled={!categories.length}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </div>
            <div className="menu-image-upload">
              <span className="menu-image-upload__label">Food image <span className="menu-management-optional">(optional)</span></span>
              <label className="menu-image-upload__picker">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setError("");
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPG, PNG, or WebP image."); event.target.value = ""; return; }
                  if (file.size > 5 * 1024 * 1024) { setError("Image must be 5 MB or smaller."); event.target.value = ""; return; }
                  setSelectedImage(file);
                }} />
                <span aria-hidden="true">↑</span><strong>{selectedImage ? "Choose a different image" : "Choose image from device"}</strong>
                <small>JPG, PNG or WebP · Maximum 5 MB</small>
              </label>
              {(imagePreview || form.image) && <div className="menu-image-upload__preview">
                <img src={imagePreview || form.image} alt="Food image preview" />
                <div><strong>{selectedImage ? selectedImage.name : "Current menu image"}</strong><small>{selectedImage ? `${(selectedImage.size / (1024 * 1024)).toFixed(2)} MB · Uploads when you save` : "This image is already saved"}</small></div>
                <button type="button" onClick={() => { setSelectedImage(null); setForm((current) => ({ ...current, image: "" })); }} aria-label="Remove image">×</button>
              </div>}
            </div>
            <label className="menu-management-checkbox"><input type="checkbox" name="available" checked={form.available} onChange={updateField} /> Visible and available for customer orders</label>
            <div className="menu-management-form__actions">
              <button className="cart-primary-button" type="submit" disabled={saving || !categories.length}>{saving ? "Saving…" : editingId ? "Save changes" : "Add to menu"}</button>
              {editingId && <button className="menu-management-cancel" type="button" onClick={resetForm} disabled={saving}>Cancel edit</button>}
            </div>
            {!categories.length && <p className="menu-management-hint">Create a category below before adding your first dish.</p>}
          </form>
          <div className="menu-management-category">
            <h3>Add a category</h3>
            <form onSubmit={addCategory}>
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} minLength={2} maxLength={60} placeholder="e.g. Desserts" aria-label="New category name" required />
              <button type="submit" disabled={!categoryName.trim()}>Add</button>
            </form>
          </div>
        </div>

        <section className="menu-management-list-panel">
          <div className="menu-management-list-heading">
            <div><span className="menu-eyebrow">LIVE CATALOGUE</span><h2>Menu items <span>{visibleItems.length}</span></h2></div>
            <button className="admin-refresh" type="button" onClick={loadData} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>
          </div>
          <div className="menu-management-controls">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or category…" aria-label="Search menu items" />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter menu items">
              <option value="ALL">All items</option><option value="AVAILABLE">Available</option><option value="HIDDEN">Hidden</option>
            </select>
          </div>

          {loading && !items.length ? (
            <div className="admin-state"><span className="menu-spinner" /><h3>Loading your menu</h3><p>Fetching items and categories.</p></div>
          ) : !visibleItems.length ? (
            <div className="admin-state"><h3>No menu items found</h3><p>Try a different search or add a new dish using the form.</p></div>
          ) : (
            <div className="menu-management-items">
              {visibleItems.map((item) => (
                <article className={item.available ? "menu-management-item" : "menu-management-item menu-management-item--hidden"} key={item.id}>
                  <div className="menu-management-item__image">
                    {item.image ? <img src={item.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span>🍽️</span>}
                  </div>
                  <div className="menu-management-item__content">
                    <div className="menu-management-item__title"><h3>{item.name}</h3><span className={item.available ? "menu-management-status" : "menu-management-status menu-management-status--hidden"}>{item.available ? "Available" : "Hidden"}</span></div>
                    <p>{item.description || "No description added."}</p>
                    <div className="menu-management-item__meta"><span>{item.category?.name || "Uncategorised"}</span><strong>{formatPrice(item.price)}</strong></div>
                    <small>{item._count?.orderItems || 0} historical order line(s) · ID #{item.id}</small>
                    <div className="menu-management-item__actions">
                      <button type="button" onClick={() => startEdit(item)}>Edit</button>
                      <button type="button" onClick={() => toggleAvailability(item)}>{item.available ? "Hide" : "Make available"}</button>
                      {item.available && <button className="menu-management-item__archive" type="button" onClick={() => archiveItem(item)}>Archive</button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default MenuManagement;
