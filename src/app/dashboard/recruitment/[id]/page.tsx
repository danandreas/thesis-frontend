"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTheme } from "@/hooks/useTheme";
import { del, get, getErrorMessage, post, put } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface RequirementType {
  id: number;
  code: string;
  name: string;
}
interface Criteria {
  id: number;
  code: string;
  name: string;
}
interface PositionCriteria {
  id: number;
  criteria_id: number;
  criteria_code: string;
  criteria_name: string;
  weight_manual: number;
  fuzzy_low: number;
  fuzzy_mid: number;
  fuzzy_high: number;
  criteria_type: string;
}
interface Position {
  id: number;
  title: string;
  description: string;
  quota: number;
  status: string;
  position_criteria?: PositionCriteria[];
}
interface Requirement {
  id: number;
  requirement_type_id: number;
  requirement_type: { name: string };
  weight: number;
  is_mandatory: boolean;
}
interface Recruitment {
  id: number;
  code: string;
  title: string;
  description: string;
  status: string;
  assessment_weight: number;
  requirement_weight: number;
  positions: Position[];
  requirements: Requirement[];
}

export default function RecruitmentDetailPage() {
  const params = useParams();
  const recId = Number(params.id);
  const { isDark } = useTheme();

  const surface = isDark ? "#1A2332" : "#ffffff";
  const border = isDark ? "#2A3A4A" : "#E2E8F0";
  const textMain = isDark ? "#E2EAF0" : "#25343F";
  const textMut = isDark ? "#8BA3B5" : "#64748B";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC";

  const [rec, setRec] = useState<Recruitment | null>(null);
  const [loading, setLoading] = useState(true);
  const [reqTypes, setReqTypes] = useState<RequirementType[]>([]);
  const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);

  // Modal state
  const [modal, setModal] = useState<
    null | "position" | "requirement" | "criteria"
  >(null);
  const [editPos, setEditPos] = useState<Position | null>(null);
  const [editReq, setEditReq] = useState<Requirement | null>(null);
  const [editCrit, setEditCrit] = useState<PositionCriteria | null>(null);
  const [activePosId, setActivePosId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [posForm, setPosForm] = useState({
    title: "",
    description: "",
    quota: 1,
  });
  const [reqForm, setReqForm] = useState({
    requirement_type_id: "",
    weight: 0,
    is_mandatory: false,
  });
  const [critForm, setCritForm] = useState({
    criteria_id: "",
    weight_manual: 50,
    criteria_type: "benefit",
    fuzzy_low: 1,
    fuzzy_mid: 3,
    fuzzy_high: 5,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, rtRes, crRes] = await Promise.all([
        get<Recruitment>(`/master/recruitments/${recId}`),
        get<RequirementType[]>("/master/requirement-types"),
        get<Criteria[]>("/master/criteria"),
      ]);
      if (recRes.success && recRes.data) setRec(recRes.data);
      if (rtRes.success && rtRes.data) setReqTypes(rtRes.data);
      if (crRes.success && crRes.data) setCriteriaList(crRes.data);
    } catch (e) {
      console.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [recId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Position CRUD ───────────────────────────────────────────
  const openAddPos = () => {
    setEditPos(null);
    setPosForm({ title: "", description: "", quota: 1 });
    setError("");
    setModal("position");
  };
  const openEditPos = (p: Position) => {
    setEditPos(p);
    setPosForm({
      title: p.title,
      description: p.description || "",
      quota: p.quota,
    });
    setError("");
    setModal("position");
  };

  const savePos = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editPos)
        await put(
          `/master/recruitments/${recId}/positions/${editPos.id}`,
          posForm,
        );
      else await post(`/master/recruitments/${recId}/positions`, posForm);
      setModal(null);
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deletePos = async (pid: number) => {
    if (!confirm("Hapus posisi ini?")) return;
    try {
      await del(`/master/recruitments/${recId}/positions/${pid}`);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // ─── Requirement CRUD ────────────────────────────────────────
  const openAddReq = () => {
    setEditReq(null);
    setReqForm({ requirement_type_id: "", weight: 5, is_mandatory: false });
    setError("");
    setModal("requirement");
  };
  const openEditReq = (r: Requirement) => {
    setEditReq(r);
    setReqForm({
      requirement_type_id: r.requirement_type_id.toString(),
      weight: r.weight,
      is_mandatory: r.is_mandatory,
    });
    setError("");
    setModal("requirement");
  };

  const saveReq = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...reqForm,
        requirement_type_id: parseInt(reqForm.requirement_type_id),
        weight: Number(reqForm.weight),
      };
      if (editReq)
        await put(
          `/master/recruitments/${recId}/requirements/${editReq.id}`,
          payload,
        );
      else await post(`/master/recruitments/${recId}/requirements`, payload);
      setModal(null);
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteReq = async (rid: number) => {
    if (!confirm("Hapus syarat ini?")) return;
    try {
      await del(`/master/recruitments/${recId}/requirements/${rid}`);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // ─── Position Criteria CRUD ──────────────────────────────────
  const openAddCrit = (posId: number) => {
    setActivePosId(posId);
    setEditCrit(null);
    setCritForm({
      criteria_id: "",
      weight_manual: 50,
      criteria_type: "benefit",
      fuzzy_low: 1,
      fuzzy_mid: 3,
      fuzzy_high: 5,
    });
    setError("");
    setModal("criteria");
  };
  const openEditCrit = (posId: number, c: PositionCriteria) => {
    setActivePosId(posId);
    setEditCrit(c);
    setCritForm({
      criteria_id: c.criteria_id.toString(),
      weight_manual: c.weight_manual,
      criteria_type: c.criteria_type,
      fuzzy_low: c.fuzzy_low,
      fuzzy_mid: c.fuzzy_mid,
      fuzzy_high: c.fuzzy_high,
    });
    setError("");
    setModal("criteria");
  };

  const saveCrit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...critForm,
        criteria_id: parseInt(critForm.criteria_id),
        weight_manual: Number(critForm.weight_manual),
        fuzzy_low: Number(critForm.fuzzy_low),
        fuzzy_mid: Number(critForm.fuzzy_mid),
        fuzzy_high: Number(critForm.fuzzy_high),
      };
      if (editCrit)
        await put(`/master/position-criteria/${editCrit.id}`, payload);
      else
        await post(
          `/master/recruitments/${recId}/positions/${activePosId}/criteria`,
          payload,
        );
      setModal(null);
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCrit = async (pcId: number) => {
    if (!confirm("Hapus kriteria dari posisi ini?")) return;
    try {
      await del(`/master/position-criteria/${pcId}`);
      fetchData();
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

  if (loading)
    return (
      <DashboardLayout>
        <div style={{ padding: "3rem", textAlign: "center", color: textMut }}>
          <i
            className="lni lni-spinner-3"
            style={{
              fontSize: "2rem",
              animation: "spin 1s linear infinite",
              display: "block",
              marginBottom: "0.75rem",
            }}
          />
          Memuat data rekrutmen...
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </DashboardLayout>
    );

  if (!rec)
    return (
      <DashboardLayout>
        <div style={{ padding: "3rem", textAlign: "center", color: textMut }}>
          Data rekrutmen tidak ditemukan.
        </div>
      </DashboardLayout>
    );

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: "rgba(100,116,139,0.1)", color: "#64748b" },
    active: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
    closed: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  };
  const sc = statusColors[rec.status] || statusColors.draft;

  return (
    <DashboardLayout>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/dashboard/recruitment"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            color: textMut,
            textDecoration: "none",
            fontSize: "0.875rem",
            padding: "0.5rem",
            borderRadius: "8px",
            background: isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(37,52,63,0.04)",
            border: `1px solid ${border}`,
            flexShrink: 0,
          }}
        >
          <i className="lni lni-arrow-left" />
        </Link>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "0.25rem",
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
                background: sc.bg,
                color: sc.color,
              }}
            >
              {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
            </span>
          </div>
          <h1
            style={{ fontSize: "1.375rem", fontWeight: 800, color: textMain }}
          >
            {rec.title}
          </h1>
          {rec.description && (
            <p
              style={{
                color: textMut,
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {rec.description}
            </p>
          )}
          <p
            style={{
              color: textMut,
              fontSize: "0.8rem",
              marginTop: "0.375rem",
            }}
          >
            Bobot Asesmen:{" "}
            <strong style={{ color: "#FF9B51" }}>
              {rec.assessment_weight}%
            </strong>{" "}
            &nbsp;·&nbsp; Bobot Syarat:{" "}
            <strong style={{ color: "#FF9B51" }}>
              {rec.requirement_weight}%
            </strong>
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* ── POSISI ── */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontWeight: 700, color: textMain, fontSize: "1rem" }}>
              <i
                className="lni lni-briefcase-1"
                style={{ color: "#FF9B51", marginRight: "0.5rem" }}
              />
              Posisi ({rec.positions?.length || 0})
            </h2>
            {rec.status === "draft" && (
              <button
                onClick={openAddPos}
                style={{
                  padding: "0.375rem 0.875rem",
                  background: "#FF9B51",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <i className="lni lni-plus" /> Tambah
              </button>
            )}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {rec.positions?.map((pos) => (
              <div
                key={pos.id}
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    borderBottom: `1px solid ${border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontWeight: 700,
                        color: textMain,
                        fontSize: "0.9375rem",
                      }}
                    >
                      {pos.title}
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: textMut }}>
                      Kuota: <strong>{pos.quota}</strong>
                    </p>
                    {pos.description && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: textMut,
                          marginTop: "0.25rem",
                        }}
                      >
                        {pos.description}
                      </p>
                    )}
                  </div>
                  {rec.status === "draft" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.375rem",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => openEditPos(pos)}
                        style={{
                          padding: "0.3rem 0.625rem",
                          background: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(37,52,63,0.06)",
                          border: `1px solid ${border}`,
                          borderRadius: "6px",
                          color: textMain,
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        <i className="lni lni-pencil-1" />
                      </button>
                      <button
                        onClick={() => deletePos(pos.id)}
                        style={{
                          padding: "0.3rem 0.625rem",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: "6px",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        <i className="lni lni-trash-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Kriteria Posisi */}
                <div style={{ padding: "0.875rem 1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.625rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: textMut,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Kriteria Penilaian
                    </span>
                    {rec.status === "draft" && (
                      <button
                        onClick={() => openAddCrit(pos.id)}
                        style={{
                          padding: "0.2rem 0.5rem",
                          background: "rgba(255,155,81,0.1)",
                          border: "1px solid rgba(255,155,81,0.2)",
                          borderRadius: "6px",
                          color: "#FF7A1F",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          fontFamily: "'Montserrat', sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        + Tambah
                      </button>
                    )}
                  </div>
                  {!pos.position_criteria?.length ? (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: textMut,
                        fontStyle: "italic",
                      }}
                    >
                      Belum ada kriteria.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                      }}
                    >
                      {pos.position_criteria.map((pc) => (
                        <div
                          key={pc.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.5rem 0.75rem",
                            background: isDark
                              ? "rgba(255,255,255,0.03)"
                              : "#F8FAFC",
                            borderRadius: "8px",
                            border: `1px solid ${border}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                background: "rgba(255,155,81,0.12)",
                                color: "#FF7A1F",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "4px",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                              }}
                            >
                              {pc.criteria_code}
                            </span>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: textMain,
                                fontWeight: 500,
                              }}
                            >
                              {pc.criteria_name}
                            </span>
                            <span
                              style={{ fontSize: "0.7rem", color: textMut }}
                            >
                              ({pc.criteria_type})
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                color: "#FF9B51",
                              }}
                            >
                              {pc.weight_manual}
                            </span>
                            {rec.status === "draft" && (
                              <>
                                <button
                                  onClick={() => openEditCrit(pos.id, pc)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: textMut,
                                    padding: "0.15rem",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  <i className="lni lni-pencil-1" />
                                </button>
                                <button
                                  onClick={() => deleteCrit(pc.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                    padding: "0.15rem",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  <i className="lni lni-trash-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Link ke halaman questions */}
                <div
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderTop: `1px solid ${border}`,
                  }}
                >
                  <Link
                    href={`/dashboard/recruitment/${recId}/positions/${pos.id}`}
                    style={{
                      fontSize: "0.8rem",
                      color: "#FF9B51",
                      textDecoration: "none",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    <i className="lni lni-question-mark-circle" /> Kelola
                    Pertanyaan Asesmen →
                  </Link>
                </div>
              </div>
            ))}
            {!rec.positions?.length && (
              <div
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: "14px",
                  padding: "2rem",
                  textAlign: "center",
                  color: textMut,
                }}
              >
                <i
                  className="lni lni-briefcase-1"
                  style={{
                    fontSize: "2rem",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                />
                Belum ada posisi.
              </div>
            )}
          </div>
        </div>

        {/* ── SYARAT TAMBAHAN ── */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontWeight: 700, color: textMain, fontSize: "1rem" }}>
              <i
                className="lni lni-file-multiple"
                style={{ color: "#FF9B51", marginRight: "0.5rem" }}
              />
              Syarat Tambahan ({rec.requirements?.length || 0})
            </h2>
            {rec.status === "draft" && (
              <button
                onClick={openAddReq}
                style={{
                  padding: "0.375rem 0.875rem",
                  background: "#FF9B51",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <i className="lni lni-plus" /> Tambah
              </button>
            )}
          </div>
          <div
            style={{
              background: surface,
              border: `1px solid ${border}`,
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            {!rec.requirements?.length ? (
              <div
                style={{ padding: "2rem", textAlign: "center", color: textMut }}
              >
                <i
                  className="lni lni-file-multiple"
                  style={{
                    fontSize: "2rem",
                    display: "block",
                    marginBottom: "0.5rem",
                  }}
                />
                Belum ada syarat tambahan.
              </div>
            ) : (
              rec.requirements.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    padding: "0.875rem 1.25rem",
                    borderBottom:
                      i < rec.requirements.length - 1
                        ? `1px solid ${border}`
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: textMain,
                        fontSize: "0.875rem",
                      }}
                    >
                      {r.requirement_type?.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: textMut,
                        display: "flex",
                        gap: "0.625rem",
                        marginTop: "0.2rem",
                      }}
                    >
                      <span>
                        Bobot:{" "}
                        <strong style={{ color: "#FF9B51" }}>
                          {r.weight}%
                        </strong>
                      </span>
                      {r.is_mandatory && (
                        <span style={{ color: "#ef4444" }}>* Wajib</span>
                      )}
                    </div>
                  </div>
                  {rec.status === "draft" && (
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button
                        onClick={() => openEditReq(r)}
                        style={{
                          padding: "0.3rem 0.625rem",
                          background: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(37,52,63,0.06)",
                          border: `1px solid ${border}`,
                          borderRadius: "6px",
                          color: textMain,
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        <i className="lni lni-pencil-1" />
                      </button>
                      <button
                        onClick={() => deleteReq(r.id)}
                        style={{
                          padding: "0.3rem 0.625rem",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: "6px",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        <i className="lni lni-trash-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {modal && (
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
                {modal === "position"
                  ? editPos
                    ? "Edit Posisi"
                    : "Tambah Posisi"
                  : modal === "requirement"
                    ? editReq
                      ? "Edit Syarat"
                      : "Tambah Syarat"
                    : editCrit
                      ? "Edit Kriteria Posisi"
                      : "Tambah Kriteria ke Posisi"}
              </h2>
              <button
                onClick={() => setModal(null)}
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

            {/* Position form */}
            {modal === "position" && (
              <form onSubmit={savePos}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Judul Posisi</label>
                    <input
                      style={inputStyle}
                      value={posForm.title}
                      onChange={(e) =>
                        setPosForm((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="Backend Developer"
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
                          minHeight: "70px",
                          resize: "vertical",
                        } as React.CSSProperties
                      }
                      value={posForm.description}
                      onChange={(e) =>
                        setPosForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                      onBlur={(e) => (e.target.style.borderColor = border)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Kuota</label>
                    <input
                      type="number"
                      min={1}
                      style={inputStyle}
                      value={posForm.quota}
                      onChange={(e) =>
                        setPosForm((p) => ({
                          ...p,
                          quota: parseInt(e.target.value),
                        }))
                      }
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                      onBlur={(e) => (e.target.style.borderColor = border)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setModal(null)}
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
            )}

            {/* Requirement form */}
            {modal === "requirement" && (
              <form onSubmit={saveReq}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Jenis Syarat</label>
                    <select
                      style={inputStyle}
                      value={reqForm.requirement_type_id}
                      onChange={(e) =>
                        setReqForm((p) => ({
                          ...p,
                          requirement_type_id: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">-- Pilih --</option>
                      {reqTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Bobot (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      style={inputStyle}
                      value={reqForm.weight}
                      onChange={(e) =>
                        setReqForm((p) => ({
                          ...p,
                          weight: parseFloat(e.target.value),
                        }))
                      }
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                      onBlur={(e) => (e.target.style.borderColor = border)}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="is_mandatory"
                      checked={reqForm.is_mandatory}
                      onChange={(e) =>
                        setReqForm((p) => ({
                          ...p,
                          is_mandatory: e.target.checked,
                        }))
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#FF9B51",
                      }}
                    />
                    <label
                      htmlFor="is_mandatory"
                      style={{
                        fontSize: "0.875rem",
                        color: textMain,
                        cursor: "pointer",
                      }}
                    >
                      Wajib dipenuhi
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setModal(null)}
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
            )}

            {/* Criteria form */}
            {modal === "criteria" && (
              <form onSubmit={saveCrit}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Kriteria</label>
                    <select
                      style={inputStyle}
                      value={critForm.criteria_id}
                      onChange={(e) =>
                        setCritForm((p) => ({
                          ...p,
                          criteria_id: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">-- Pilih Kriteria --</option>
                      {criteriaList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tipe Kriteria</label>
                    <select
                      style={inputStyle}
                      value={critForm.criteria_type}
                      onChange={(e) =>
                        setCritForm((p) => ({
                          ...p,
                          criteria_type: e.target.value,
                        }))
                      }
                    >
                      <option value="benefit">
                        Benefit (makin tinggi makin baik)
                      </option>
                      <option value="cost">
                        Cost (makin rendah makin baik)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Bobot Manual (1-100)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      style={inputStyle}
                      value={critForm.weight_manual}
                      onChange={(e) =>
                        setCritForm((p) => ({
                          ...p,
                          weight_manual: parseInt(e.target.value),
                        }))
                      }
                      required
                      onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                      onBlur={(e) => (e.target.style.borderColor = border)}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Fuzzy Low</label>
                      <input
                        type="number"
                        step="0.1"
                        style={inputStyle}
                        value={critForm.fuzzy_low}
                        onChange={(e) =>
                          setCritForm((p) => ({
                            ...p,
                            fuzzy_low: parseFloat(e.target.value),
                          }))
                        }
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#FF9B51")
                        }
                        onBlur={(e) => (e.target.style.borderColor = border)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Fuzzy Mid</label>
                      <input
                        type="number"
                        step="0.1"
                        style={inputStyle}
                        value={critForm.fuzzy_mid}
                        onChange={(e) =>
                          setCritForm((p) => ({
                            ...p,
                            fuzzy_mid: parseFloat(e.target.value),
                          }))
                        }
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#FF9B51")
                        }
                        onBlur={(e) => (e.target.style.borderColor = border)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Fuzzy High</label>
                      <input
                        type="number"
                        step="0.1"
                        style={inputStyle}
                        value={critForm.fuzzy_high}
                        onChange={(e) =>
                          setCritForm((p) => ({
                            ...p,
                            fuzzy_high: parseFloat(e.target.value),
                          }))
                        }
                        onFocus={(e) =>
                          (e.target.style.borderColor = "#FF9B51")
                        }
                        onBlur={(e) => (e.target.style.borderColor = border)}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setModal(null)}
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
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </DashboardLayout>
  );
}
