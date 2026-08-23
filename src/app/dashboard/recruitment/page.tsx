"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTheme } from "@/hooks/useTheme";
import { del, get, getErrorMessage, post } from "@/lib/api";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

interface Position {
  id: number;
  title: string;
  quota: number;
  status: string;
  applicant_count: number;
}
interface Recruitment {
  id: number;
  code: string;
  title: string;
  description: string;
  status: string;
  published_at: string | null;
  assessment_weight: number;
  positions?: Position[];
}

const statusColor = (s: string) => {
  if (s === "active")
    return { bg: "rgba(16,185,129,0.12)", color: "#10b981", icon: "lni-play" };
  if (s === "draft")
    return {
      bg: "rgba(100,116,139,0.1)",
      color: "#64748b",
      icon: "lni-pencil-1",
    };
  if (s === "closed")
    return {
      bg: "rgba(239,68,68,0.12)",
      color: "#ef4444",
      icon: "lni-locked-1",
    };
  return {
    bg: "rgba(100,116,139,0.1)",
    color: "#64748b",
    icon: "lni-clipboard",
  };
};

export default function RecruitmentPage() {
  const { isDark } = useTheme();
  const surface = isDark ? "#1A2332" : "#ffffff";
  const border = isDark ? "#2A3A4A" : "#E2E8F0";
  const textMain = isDark ? "#E2EAF0" : "#25343F";
  const textMut = isDark ? "#8BA3B5" : "#64748B";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC";

  const [items, setItems] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  // Bug #17: pagination + search state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 20;

  const fetchData = useCallback(
    async (pg = page, q = search, st = filterStatus) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pg),
          per_page: String(PER_PAGE),
          ...(q ? { search: q } : {}),
          ...(st ? { status: st } : {}),
        });
        // Bug #17 fix: response sekarang { items, total, page, per_page, total_pages }
        const res = await get<{
          items: Recruitment[];
          total: number;
          total_pages: number;
        }>(`/master/recruitments?${params}`);
        if (res.success && res.data) {
          setItems(res.data.items ?? []);
          setTotalPages(res.data.total_pages ?? 1);
          setTotal(res.data.total ?? 0);
          setPage(pg);
        }
      } catch (e) {
        console.error(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [page, search, filterStatus],
  );

  useEffect(() => {
    fetchData(1, search, filterStatus);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await post("/master/recruitments", form);
      setShowModal(false);
      setForm({ code: "", title: "", description: "" });
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: number) => {
    setActionLoading(id);
    try {
      await post(`/master/recruitments/${id}/publish`);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (id: number) => {
    if (!confirm("Tutup rekrutmen ini?")) return;
    setActionLoading(id);
    try {
      await post(`/master/recruitments/${id}/close`);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus rekrutmen ini?")) return;
    try {
      await del(`/master/recruitments/${id}`);
      fetchData(1, search, filterStatus);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

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
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: textMain }}>
            Rekrutmen
          </h1>
          <p style={{ color: textMut, fontSize: "0.875rem" }}>
            Kelola batch rekrutmen dan posisi ·{" "}
            <strong style={{ color: "#FF9B51" }}>{total}</strong> total
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
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
          <i className="lni lni-plus" /> Buat Rekrutmen
        </button>
      </div>

      {/* Search & filter toolbar */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <i
            className="lni lni-search"
            style={{
              position: "absolute",
              left: "0.875rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: textMut,
              fontSize: "0.875rem",
            }}
          />
          <input
            style={{ ...inputStyle, paddingLeft: "2.25rem" }}
            placeholder="Cari kode / judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && fetchData(1, search, filterStatus)
            }
            onBlur={() => fetchData(1, search, filterStatus)}
          />
        </div>
        <select
          style={{ ...inputStyle, width: "auto", minWidth: "130px" }}
          value={filterStatus}
          onChange={(e) => {
            setFilter(e.target.value);
            fetchData(1, search, e.target.value);
          }}
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: textMut }}>
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
      ) : items.length === 0 ? (
        <div
          style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: "16px",
            padding: "3rem",
            textAlign: "center",
            color: textMut,
          }}
        >
          <i
            className="lni lni-briefcase-1"
            style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}
          />
          Belum ada rekrutmen.
        </div>
      ) : (
        <>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {items.map((rec) => {
              const s = statusColor(rec.status);
              return (
                <div
                  key={rec.id}
                  style={{
                    background: surface,
                    border: `1px solid ${border}`,
                    borderRadius: "16px",
                    overflow: "hidden",
                    animation: "fadeInUp 0.4s ease",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                      borderBottom: `1px solid ${border}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          marginBottom: "0.375rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            background: "rgba(255,155,81,0.12)",
                            color: "#FF7A1F",
                            padding: "0.2rem 0.625rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {rec.code}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.2rem 0.625rem",
                            borderRadius: "999px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            background: s.bg,
                            color: s.color,
                          }}
                        >
                          <i className={`lni ${s.icon}`} />{" "}
                          {rec.status.charAt(0).toUpperCase() +
                            rec.status.slice(1)}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: textMut }}>
                          Bobot Asesmen:{" "}
                          <strong style={{ color: "#FF9B51" }}>
                            {rec.assessment_weight}%
                          </strong>
                        </span>
                      </div>
                      <h3
                        style={{
                          fontWeight: 700,
                          color: textMain,
                          fontSize: "1rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {rec.title}
                      </h3>
                      {rec.description && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: textMut,
                            lineHeight: 1.5,
                          }}
                        >
                          {rec.description}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        flexShrink: 0,
                      }}
                    >
                      <Link
                        href={`/dashboard/recruitment/${rec.id}`}
                        style={{
                          padding: "0.5rem 0.875rem",
                          background: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(37,52,63,0.06)",
                          border: `1px solid ${border}`,
                          borderRadius: "8px",
                          color: textMain,
                          fontSize: "0.8rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          fontWeight: 600,
                        }}
                      >
                        <i className="lni lni-eye" /> Detail
                      </Link>
                      {rec.status === "draft" && (
                        <>
                          <button
                            onClick={() => handlePublish(rec.id)}
                            disabled={actionLoading === rec.id}
                            style={{
                              padding: "0.5rem 0.875rem",
                              background: "rgba(16,185,129,0.1)",
                              border: "1px solid rgba(16,185,129,0.2)",
                              borderRadius: "8px",
                              color: "#10b981",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontFamily: "'Montserrat', sans-serif",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                            }}
                          >
                            <i
                              className={
                                actionLoading === rec.id
                                  ? "lni lni-spinner-3"
                                  : "lni lni-play"
                              }
                              style={
                                actionLoading === rec.id
                                  ? { animation: "spin 1s linear infinite" }
                                  : {}
                              }
                            />{" "}
                            Publish
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            style={{
                              padding: "0.5rem 0.875rem",
                              background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.2)",
                              borderRadius: "8px",
                              color: "#ef4444",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              fontFamily: "'Montserrat', sans-serif",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                            }}
                          >
                            <i className="lni lni-trash-3" /> Hapus
                          </button>
                        </>
                      )}
                      {rec.status === "active" && (
                        <button
                          onClick={() => handleClose(rec.id)}
                          disabled={actionLoading === rec.id}
                          style={{
                            padding: "0.5rem 0.875rem",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "8px",
                            color: "#ef4444",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                          }}
                        >
                          <i className="lni lni-locked-1" /> Tutup
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Positions summary */}
                  {rec.positions && rec.positions.length > 0 && (
                    <div
                      style={{
                        padding: "0.875rem 1.5rem",
                        display: "flex",
                        gap: "0.875rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {rec.positions.map((pos) => (
                        <div
                          key={pos.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                            color: textMut,
                            background: isDark
                              ? "rgba(255,255,255,0.04)"
                              : "#F8FAFC",
                            padding: "0.375rem 0.75rem",
                            borderRadius: "8px",
                            border: `1px solid ${border}`,
                          }}
                        >
                          <i
                            className="lni lni-briefcase-1"
                            style={{ color: "#FF9B51" }}
                          />
                          <span style={{ fontWeight: 600, color: textMain }}>
                            {pos.title}
                          </span>
                          <span>·</span>
                          <span>
                            {pos.applicant_count ?? 0}/{pos.quota} pelamar
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginTop: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => fetchData(page - 1, search, filterStatus)}
                disabled={page <= 1}
                style={{
                  padding: "0.5rem 0.875rem",
                  background: "none",
                  border: `1px solid ${border}`,
                  borderRadius: "8px",
                  color: page <= 1 ? textMut : textMain,
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.8rem",
                }}
              >
                <i className="lni lni-chevron-left" /> Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span style={{ color: textMut, fontSize: "0.8rem" }}>
                        …
                      </span>
                    )}
                    <button
                      onClick={() => fetchData(p, search, filterStatus)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        border: `1px solid ${p === page ? "#FF9B51" : border}`,
                        background:
                          p === page ? "rgba(255,155,81,0.12)" : "none",
                        color: p === page ? "#FF9B51" : textMain,
                        cursor: "pointer",
                        fontWeight: p === page ? 700 : 400,
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: "0.8rem",
                      }}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => fetchData(page + 1, search, filterStatus)}
                disabled={page >= totalPages}
                style={{
                  padding: "0.5rem 0.875rem",
                  background: "none",
                  border: `1px solid ${border}`,
                  borderRadius: "8px",
                  color: page >= totalPages ? textMut : textMain,
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "0.8rem",
                }}
              >
                Next <i className="lni lni-chevron-right" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Buat Rekrutmen */}
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
                Buat Rekrutmen Baru
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
                  <label style={labelStyle}>Kode Rekrutmen</label>
                  <input
                    style={inputStyle}
                    value={form.code}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, code: e.target.value }))
                    }
                    placeholder="REC-2025-001"
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Judul</label>
                  <input
                    style={inputStyle}
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Rekrutmen Teknologi Informasi Batch 2025"
                    required
                    onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Deskripsi</label>
                  <textarea
                    style={
                      {
                        ...inputStyle,
                        minHeight: "80px",
                        resize: "vertical",
                      } as React.CSSProperties
                    }
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Deskripsi rekrutmen..."
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
                        <i className="lni lni-floppy-disk-1" /> Buat
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
