import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-PK", { dateStyle: "medium" });
}

function UserManagement() {
  const { token, user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not load users.");
      setUsers(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((item) => {
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? item.isActive : !item.isActive);
      const matchesSearch = !query || [item.name, item.email, String(item.id)].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, search, roleFilter, statusFilter]);

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createAccount(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not create account.");
      setUsers((current) => [result.data, ...current]);
      setNotice(result.message || "Account created successfully.");
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
    } catch (err) {
      setError(err.message || "Could not create account.");
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(target, role) {
    if (target.id === user?.id) {
      setError("You cannot change your own role.");
      return;
    }
    setUpdatingId(target.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${target.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update role.");
      setUsers((current) => current.map((item) => item.id === target.id ? result.data : item));
      setNotice(`${target.name}'s role changed to ${role}.`);
    } catch (err) {
      setError(err.message || "Could not update role.");
    } finally {
      setUpdatingId(null);
    }
  }


  async function toggleAccountStatus(target) {
    if (target.id === user?.id && target.isActive) {
      setError("You cannot disable your own account.");
      return;
    }

    const nextStatus = !target.isActive;
    const action = nextStatus ? "reactivate" : "disable";
    const confirmed = window.confirm(
      "Are you sure you want to " + action + " " + target.name + "'s account? " +
      (nextStatus
        ? "They will be able to sign in again."
        : "They will lose access immediately, but their order history will be preserved.")
    );
    if (!confirmed) return;

    setUpdatingId(target.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(API_URL + "/api/admin/users/" + target.id + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not update account status.");
      setUsers((current) => current.map((item) => item.id === target.id ? result.data : item));
      setNotice(result.message || "Account status updated.");
    } catch (err) {
      setError(err.message || "Could not update account status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteAccount(target) {
    if (target.id === user?.id) {
      setError("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      "Delete the " + (target.role === "ADMIN" ? "administrator" : "user") + " account for " + target.name + " (" + target.email + ")? This cannot be undone. Accounts with order history cannot be deleted."
    );
    if (!confirmed) return;

    setUpdatingId(target.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(API_URL + "/api/admin/users/" + target.id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not delete account.");
      setUsers((current) => current.filter((item) => item.id !== target.id));
      setNotice(result.message || "Account deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete account.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: "/admin/users" }} />;
  if (user?.role !== "ADMIN") return <main className="user-management-page"><section className="admin-empty"><span className="menu-eyebrow">RESTRICTED AREA</span><h1>Admin access <span>required.</span></h1><p>Only CafeServe administrators can manage user accounts.</p><Link className="cart-primary-button" to="/">Return home</Link></section></main>;

  const admins = users.filter((item) => item.role === "ADMIN").length;
  const customers = users.length - admins;

  return (
    <main className="user-management-page">
      <section className="user-management-intro">
        <div><span className="menu-eyebrow">CAFESERVE ACCESS CONTROL</span><h1>People & <span>permissions.</span></h1><p>Create accounts, promote trusted users to administrators, and manage who can access the operations panel.</p></div>
        <Link className="user-management-back" to="/admin">← Back to dashboard</Link>
      </section>

      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      {notice && <div className="admin-alert" role="status">{notice}</div>}

      <section className="user-management-stats" aria-label="User counts">
        <article className="admin-metric"><span>Total accounts</span><strong>{users.length}</strong><small>All CafeServe accounts</small></article>
        <article className="admin-metric"><span>Administrators</span><strong>{admins}</strong><small>Can access admin operations</small></article>
        <article className="admin-metric"><span>Customers</span><strong>{customers}</strong><small>Customer accounts</small></article>
        <article className="admin-metric"><span>Disabled accounts</span><strong>{users.filter((item) => !item.isActive).length}</strong><small>Access currently blocked</small></article>
      </section>

      <section className="user-management-layout">
        <section className="user-management-panel">
          <span className="menu-eyebrow">NEW ACCOUNT</span>
          <h2>Create an account</h2>
          <p>Create a customer account or issue credentials to another administrator.</p>
          <form className="user-management-form" onSubmit={createAccount}>
            <label>Full name<input name="name" value={form.name} onChange={updateForm} minLength={2} maxLength={80} autoComplete="name" required /></label>
            <label>Email address<input name="email" type="email" value={form.email} onChange={updateForm} maxLength={254} autoComplete="email" required /></label>
            <label>Temporary password<input name="password" type="password" value={form.password} onChange={updateForm} minLength={8} maxLength={72} autoComplete="new-password" required /><small>At least 8 characters. Share credentials securely, not in public chat.</small></label>
            <label>Account role<select name="role" value={form.role} onChange={updateForm}><option value="ADMIN">Administrator</option><option value="CUSTOMER">Customer</option></select></label>
            <button className="cart-primary-button" type="submit" disabled={saving}>{saving ? "Creating account…" : "Create account"}</button>
          </form>
        </section>

        <section className="user-management-panel user-management-list-panel">
          <div className="user-management-list-heading"><div><span className="menu-eyebrow">ACCOUNT DIRECTORY</span><h2>Manage users <span>{visibleUsers.length}</span></h2></div><button className="admin-refresh" type="button" onClick={loadUsers} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button></div>
          <div className="user-management-controls">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, ID…" aria-label="Search users" />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role"><option value="ALL">All roles</option><option value="ADMIN">Admins</option><option value="CUSTOMER">Customers</option></select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by account status"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option></select>
          </div>
          {loading && users.length === 0 ? <div className="admin-state"><span className="menu-spinner" /><h3>Loading accounts</h3><p>Retrieving the user directory.</p></div>
            : visibleUsers.length === 0 ? <div className="admin-state"><h3>No users found</h3><p>Try another search or role filter.</p></div>
              : <div className="user-management-list">{visibleUsers.map((item) => (
                <article className="user-management-card" key={item.id}>
                  <div className="user-management-avatar" aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</div>
                  <div className="user-management-card__identity"><h3>{item.name} {item.id === user.id && <span className="user-management-you">YOU</span>}</h3><p>{item.email}</p><small>Joined {formatDate(item.createdAt)} · ID #{item.id}</small></div>
                  <div className="user-management-card__actions"><span className={item.role === "ADMIN" ? "user-role-badge user-role-badge--admin" : "user-role-badge"}>{item.role === "ADMIN" ? "Administrator" : "Customer"}</span>
                    <span className={item.isActive ? "user-status-badge user-status-badge--active" : "user-status-badge user-status-badge--disabled"}>{item.isActive ? "Active" : "Disabled"}</span>
                    <label className="user-management-role-label">Change role<select value={item.role} disabled={updatingId === item.id || item.id === user.id} onChange={(event) => changeRole(item, event.target.value)} aria-label={`Change role for ${item.name}`}><option value="CUSTOMER">Customer</option><option value="ADMIN">Administrator</option></select></label>
                    {item.id === user.id && <small className="user-management-self-note">Your own role is locked here.</small>}
                    <button className={item.isActive ? "user-management-status-action user-management-status-action--disable" : "user-management-status-action"} type="button" disabled={updatingId === item.id || item.id === user.id} onClick={() => toggleAccountStatus(item)}>
                      {updatingId === item.id ? "Working…" : item.isActive ? "Disable account" : "Reactivate account"}
                    </button>
                    <button className="user-management-delete" type="button" disabled={updatingId === item.id || item.id === user.id} onClick={() => deleteAccount(item)}>
                      {updatingId === item.id ? "Working…" : "Delete account"}
                    </button>
                  </div>
                </article>
              ))}</div>}
        </section>
      </section>
      <p className="user-management-security-note">Security note: only administrators can use these controls. Passwords are hashed before storage. Disabled accounts lose access immediately, while their order history is preserved.</p>
    </main>
  );
}

export default UserManagement;
