"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTheme } from "@/hooks/useTheme";
import { del, get, getErrorMessage, post, put } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

interface Role {
  id: number;
  code: string;
  name: string;
}
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  created_at: string;
}

export default function UsersPage() {
  const { isDark } = useTheme();
  const surface = isDark ? "#1A2332" : "#ffffff";
  const border = isDark ? "#2A3A4A" : "#E2E8F0";
  const textMain = isDark ? "#E2EAF0" : "#25343F";
  const textMut = isDark ? "#8BA3B5" : "#64748B";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC";

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        get<User[]>("/master/users"),
        get<Role[]>("/master/roles"),
      ]);
      if (uRes.success && uRes.data) setUsers(uRes.data);
      if (rRes.success && rRes.data) setRoles(rRes.data);
    } catch (e) {
      console.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role_id: roles.find((r) => r.code === "candidate")?.id.toString() || "",
    });
    setError("");
    setShowModal(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      password: "",
      role_id: u.role.id.toString(),
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone,
        role_id: parseInt(form.role_id),
      };
      if (!editing) {
        payload.email = form.email;
        payload.password = form.password;
      } else if (form.password) {
        payload.password = form.password;
      }

      if (editing) {
        await put(`/master/users/${editing.id}`, payload);
      } else {
        await post("/master/users", payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus user ini?")) return;
    try {
      await del(`/master/users/${id}`);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: inputBg,
    border: `1.5px solid ${border}`,
    borderRadius: "10px",
    color: textMain,
    fontSize: "0.875rem",
    fontFamily: "'Montserrat', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: textMut,
    marginBottom: "0.375rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: textMain }}>
            Manajemen Pengguna
          </h1>
          <p style={{ color: textMut, fontSize: "0.875rem" }}>
            Kelola akun admin dan kandidat
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: "0.625rem 1.25rem",
            background: "#FF9B51",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: "pointer",
            fontFamily: "'Montserrat', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <i className="lni lni-plus" /> Tambah User
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ position: "relative", maxWidth: "360px" }}>
          <i
            className="lni lni-search-1"
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: textMut,
            }}
          />
          <input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "2.5rem" }}
            onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
            onBlur={(e) => (e.target.style.borderColor = border)}
          />
        </div>
      </div>

      <div
        style={{
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: textMut }}>
            <i
              className="lni lni-spinner-3"
              style={{
                fontSize: "2rem",
                animation: "spin 1s linear infinite",
                display: "block",
                marginBottom: "0.75rem",
              }}
            />{" "}
            Memuat...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "#",
                    "Nama",
                    "Email",
                    "Telepon",
                    "Role",
                    "Bergabung",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.875rem 1rem",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: textMut,
                        background: isDark ? "#0F1419" : "#F8FAFC",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderTop: `1px solid ${border}` }}>
                    <td
                      style={{
                        padding: "0.875rem 1rem",
                        color: textMut,
                        fontSize: "0.8rem",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.625rem",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #FF9B51, #25343F)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            flexShrink: 0,
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: textMain,
                            fontSize: "0.875rem",
                          }}
                        >
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 1rem",
                        color: textMut,
                        fontSize: "0.875rem",
                      }}
                    >
                      {u.email}
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 1rem",
                        color: textMut,
                        fontSize: "0.875rem",
                      }}
                    >
                      {u.phone || "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.2rem 0.625rem",
                          borderRadius: "999px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background:
                            u.role.code === "admin"
                              ? "rgba(255,155,81,0.15)"
                              : "rgba(59,130,246,0.12)",
                          color:
                            u.role.code === "admin" ? "#FF7A1F" : "#2563eb",
                        }}
                      >
                        <i
                          className={
                            u.role.code === "admin"
                              ? "lni lni-shield-2"
                              : "lni lni-user-4"
                          }
                        />
                        {u.role.name}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.875rem 1rem",
                        color: textMut,
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => openEdit(u)}
                          style={{
                            padding: "0.375rem 0.625rem",
                            background: isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(37,52,63,0.06)",
                            border: `1px solid ${border}`,
                            borderRadius: "8px",
                            color: textMain,
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontFamily: "'Montserrat', sans-serif",
                          }}
                        >
                          <i className="lni lni-pencil-1" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{
                            padding: "0.375rem 0.625rem",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "8px",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontFamily: "'Montserrat', sans-serif",
                          }}
                        >
                          <i className="lni lni-trash-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: textMut,
                      }}
                    >
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: surface,
              border: `1px solid ${border}`,
              borderRadius: "20px",
              padding: "2rem",
              width: "100%",
              maxWidth: "480px",
              animation: "fadeInUp 0.25s ease",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: "1.125rem",
                  color: textMain,
                }}
              >
                {editing ? "Edit User" : "Tambah User"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: textMut,
                  fontSize: "1.25rem",
                }}
              >
                <i className="lni lni-xmark-circle" />
              </button>
            </div>
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <i className="lni lni-question-mark-circle" /> {error}
              </div>
            )}
            <form onSubmit={handleSave}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  <label style={labelStyle}>Nama Lengkap</label>
                  <input
                    style={inputStyle}
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                </div>
                {!editing && (
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      style={inputStyle}
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                      onBlur={(e) => (e.target.style.borderColor = border)}
                    />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>No. Telepon</label>
                  <input
                    style={inputStyle}
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    style={inputStyle}
                    value={form.role_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, role_id: e.target.value }))
                    }
                    required
                  >
                    <option value="">-- Pilih Role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    {editing
                      ? "Password Baru (kosongkan jika tidak diubah)"
                      : "Password"}
                  </label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    required={!editing}
                    minLength={8}
                    placeholder={
                      editing
                        ? "Biarkan kosong jika tidak diubah"
                        : "Min. 8 karakter"
                    }
                    onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "none",
                      border: `1.5px solid ${border}`,
                      borderRadius: "10px",
                      color: textMain,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: saving ? "#94a3b8" : "#FF9B51",
                      border: "none",
                      borderRadius: "10px",
                      color: "white",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      fontFamily: "'Montserrat', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {saving ? (
                      <>
                        <i
                          className="lni lni-spinner-3"
                          style={{ animation: "spin 1s linear infinite" }}
                        />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="lni lni-floppy-disk-1" /> Simpan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </DashboardLayout>
  );
}
