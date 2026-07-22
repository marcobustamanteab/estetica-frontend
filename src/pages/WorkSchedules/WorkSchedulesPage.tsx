/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useWorkSchedules, DAYS_OF_WEEK, WorkSchedule } from '../../hooks/useWorkSchedules';
import { useAuth } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { toast } from 'react-toastify';
import Avatar from '../../components/common/Avatar';
import './workSchedules.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayRow {
  day_of_week: number;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

type ActiveView = 'overview' | 'editor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';

const emptyDays = (): DayRow[] =>
  DAYS_OF_WEEK.map((d) => ({
    day_of_week: d.value,
    label: d.label,
    start_time: DEFAULT_START,
    end_time: DEFAULT_END,
    is_active: d.value <= 4,
  }));

const buildRowsFromSchedules = (empSchedules: WorkSchedule[]): DayRow[] =>
  DAYS_OF_WEEK.map((d) => {
    const found = empSchedules.find((s) => s.day_of_week === d.value);
    return {
      day_of_week: d.value,
      label: d.label,
      start_time: found ? found.start_time.slice(0, 5) : DEFAULT_START,
      end_time: found ? found.end_time.slice(0, 5) : DEFAULT_END,
      is_active: found ? found.is_active : d.value <= 4,
    };
  });

const rowsEqual = (a: DayRow[], b: DayRow[]): boolean =>
  a.length === b.length &&
  a.every(
    (r, i) =>
      r.is_active === b[i].is_active &&
      r.start_time === b[i].start_time &&
      r.end_time === b[i].end_time
  );

const calcWeeklyHours = (rows: DayRow[]): number => {
  let totalMinutes = 0;
  for (const row of rows) {
    if (!row.is_active) continue;
    const [sh, sm] = row.start_time.split(':').map(Number);
    const [eh, em] = row.end_time.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff > 0) totalMinutes += diff;
  }
  return Math.round((totalMinutes / 60) * 10) / 10;
};

// ─── Component ────────────────────────────────────────────────────────────────

const WorkSchedulesPage: React.FC = () => {
  // ── View & selection ──
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  // ── Schedule data ──
  const [allSchedules, setAllSchedules] = useState<WorkSchedule[]>([]);
  const [rows, setRows] = useState<DayRow[]>(emptyDays());
  const [savedRows, setSavedRows] = useState<DayRow[]>(emptyDays());
  const [saving, setSaving] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // ── Business working days (for conflict warnings) ──
  const [businessWorkingDays, setBusinessWorkingDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  // ── Contexts & hooks ──
  const { currentUser } = useAuth();
  const { selectedBusiness, setSelectedBusiness, businesses } = useBusinessContext();
  const { users, fetchUsers } = useUsers();
  const { fetchSchedules, saveEmployeeSchedules } = useWorkSchedules();

  const isSuperAdmin = (currentUser as any)?.is_superuser === true;

  // ── Derived: employees list filtered by role/business ──
  const employees = useMemo(
    () =>
      users.filter((u) => {
        if (!(u as any).is_active) return false;
        if ((u as any).is_superuser) return false;
        if (isSuperAdmin) return (u as any).business === selectedBusiness;
        return true;
      }),
    [users, isSuperAdmin, selectedBusiness]
  );

  // ── Derived: dirty state (unsaved changes) ──
  const isDirty = useMemo(() => !rowsEqual(rows, savedRows), [rows, savedRows]);

  // ── Derived: weekly hours for the currently edited employee ──
  const weeklyHours = useMemo(() => calcWeeklyHours(rows), [rows]);

  // ── Derived: rows that conflict with business working days ──
  const conflictDays = useMemo(
    () =>
      rows
        .filter((r) => r.is_active && !businessWorkingDays.includes(r.day_of_week))
        .map((r) => r.day_of_week),
    [rows, businessWorkingDays]
  );

  // ── Initial fetch ──
  useEffect(() => {
    fetchUsers();
    loadAllSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── When selected business changes: fetch its working_days, reset editor if superadmin ──
  useEffect(() => {
    if (!selectedBusiness) return;
    fetchBusinessWorkingDays(selectedBusiness);
    if (isSuperAdmin) {
      setSelectedEmployeeId(null);
      setRows(emptyDays());
      setSavedRows(emptyDays());
      setActiveView('overview');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusiness, isSuperAdmin]);

  // ── Fetch helpers ──

  const loadAllSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const data = await fetchSchedules();
      setAllSchedules(data);
    } finally {
      setLoadingSchedules(false);
    }
  }, [fetchSchedules]);

  const fetchBusinessWorkingDays = useCallback(
    async (businessId: number) => {
      try {
        const token = localStorage.getItem('access');
        const apiUrl = import.meta.env.PROD
          ? import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app'
          : 'http://localhost:8000';
        const endpoint = isSuperAdmin
          ? `${apiUrl}/api/auth/businesses/${businessId}/`
          : `${apiUrl}/api/auth/businesses/me/`;
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.working_days)) {
            setBusinessWorkingDays(data.working_days);
          }
        }
      } catch {
        // Silently fail — conflict warnings won't appear
      }
    },
    [isSuperAdmin]
  );

  // ── Employee selection: builds rows from allSchedules (no extra request) ──
  const handleEmployeeChange = useCallback(
    (id: number) => {
      const empSchedules = allSchedules.filter((s) => s.employee === id);
      const built = buildRowsFromSchedules(empSchedules);
      setSelectedEmployeeId(id);
      setRows(built);
      setSavedRows(built);
      setActiveView('editor');
    },
    [allSchedules]
  );

  // ── Row editing ──
  const updateRow = useCallback((index: number, field: keyof DayRow, value: any) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }, []);

  // Discard changes — restore last saved state
  const handleReset = useCallback(() => {
    setRows(savedRows.map((r) => ({ ...r })));
  }, [savedRows]);

  // ── Save ──
  const handleSave = async () => {
    if (!selectedEmployeeId) return;

    for (const row of rows) {
      if (row.is_active && row.start_time >= row.end_time) {
        toast.error(`${row.label}: la hora de entrada debe ser anterior a la de salida.`);
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await saveEmployeeSchedules(selectedEmployeeId, rows);
      setAllSchedules((prev) => [
        ...prev.filter((s) => s.employee !== selectedEmployeeId),
        ...updated,
      ]);
      setSavedRows(rows.map((r) => ({ ...r })));
      toast.success('Horarios guardados correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los horarios');
    } finally {
      setSaving(false);
    }
  };

  // ── Grid helpers (stable per allSchedules) ──
  const hasSchedule = useCallback(
    (empId: number) => allSchedules.some((s) => s.employee === empId),
    [allSchedules]
  );

  const getEmpActiveDaySchedule = useCallback(
    (empId: number, day: number): WorkSchedule | undefined =>
      allSchedules.find((s) => s.employee === empId && s.day_of_week === day && s.is_active),
    [allSchedules]
  );

  const getEmpWeeklyHours = useCallback(
    (empId: number): number => {
      const empSchedules = allSchedules.filter((s) => s.employee === empId);
      return calcWeeklyHours(buildRowsFromSchedules(empSchedules));
    },
    [allSchedules]
  );

  const selectedEmployee = employees.find((u) => u.id === selectedEmployeeId);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ws-page">
      <div className="ws-header">
        <h2>Horarios de Trabajo</h2>
        <p className="ws-subtitle">
          Configura los días y horarios de atención de cada trabajador/a.
        </p>
      </div>

      {/* Selector de negocio — solo superadmin */}
      {isSuperAdmin && businesses.length > 0 && (
        <div className="ws-business-selector">
          <label>Negocio</label>
          <div className="ws-business-list">
            {businesses.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`ws-business-btn${selectedBusiness === b.id ? ' active' : ''}`}
                onClick={() => setSelectedBusiness(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="ws-tabs">
        <button
          type="button"
          className={`ws-tab${activeView === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          Vista general
        </button>
        <button
          type="button"
          className={`ws-tab${activeView === 'editor' ? ' active' : ''}`}
          onClick={() => {
            if (!selectedEmployeeId) {
              toast.info('Selecciona un empleado en la vista general primero.');
            } else {
              setActiveView('editor');
            }
          }}
        >
          Editor
          {isDirty && <span className="ws-dirty-dot" title="Cambios sin guardar" />}
        </button>
      </div>

      {/* ══ OVERVIEW TAB ═══════════════════════════════════════════════════════ */}
      {activeView === 'overview' && (
        <div className="ws-overview">
          {employees.length === 0 ? (
            <p className="ws-empty-hint">
              {isSuperAdmin && !selectedBusiness
                ? 'Selecciona un negocio primero.'
                : 'No hay trabajadores disponibles.'}
            </p>
          ) : loadingSchedules ? (
            <div className="ws-grid-loading">Cargando horarios...</div>
          ) : (
            <div className="ws-grid-wrap">
              <table className="ws-grid">
                <thead>
                  <tr>
                    <th className="ws-grid-th ws-grid-emp-col">Empleado/a</th>
                    {DAYS_OF_WEEK.map((d) => {
                      const businessClosed = !businessWorkingDays.includes(d.value);
                      return (
                        <th
                          key={d.value}
                          className={`ws-grid-th ws-grid-day-col${businessClosed ? ' ws-grid-closed-day' : ''}`}
                          title={businessClosed ? 'Negocio cerrado este día' : d.label}
                        >
                          {d.label.slice(0, 3)}
                          {businessClosed && <span className="ws-grid-closed-badge">C</span>}
                        </th>
                      );
                    })}
                    <th className="ws-grid-th ws-grid-hours-col">Hs/sem</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const configured = hasSchedule(emp.id);
                    const empHours = getEmpWeeklyHours(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className={`ws-grid-row${selectedEmployeeId === emp.id ? ' ws-grid-row--selected' : ''}`}
                        onClick={() => handleEmployeeChange(emp.id)}
                        title="Click para editar horario"
                      >
                        {/* Employee name cell */}
                        <td className="ws-grid-td ws-grid-emp-cell">
                          <div className="ws-grid-emp-info">
                            <Avatar
                              firstName={emp.first_name}
                              lastName={emp.last_name}
                              profileImage={(emp as any).profile_image}
                              size="small"
                            />
                            <div className="ws-grid-emp-text">
                              <span className="ws-grid-emp-name">
                                {emp.first_name} {emp.last_name}
                              </span>
                              {!configured && (
                                <span className="ws-grid-no-schedule">Sin horario</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Day cells */}
                        {DAYS_OF_WEEK.map((d) => {
                          const sch = getEmpActiveDaySchedule(emp.id, d.value);
                          const conflict = sch && !businessWorkingDays.includes(d.value);
                          return (
                            <td
                              key={d.value}
                              className={[
                                'ws-grid-td',
                                'ws-grid-day-cell',
                                sch ? 'ws-grid-day-cell--active' : '',
                                conflict ? 'ws-grid-day-cell--conflict' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            >
                              {sch && (
                                <span className="ws-grid-time">
                                  {sch.start_time.slice(0, 5).replace(':', 'h')}
                                  {conflict && (
                                    <span className="ws-grid-conflict-icon" title="Negocio cerrado">
                                      !
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Hours cell */}
                        <td className="ws-grid-td ws-grid-hours-cell">
                          {configured ? (
                            <span className="ws-grid-hours">{empHours}h</span>
                          ) : (
                            <span className="ws-grid-hours ws-grid-hours--empty">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ EDITOR TAB ════════════════════════════════════════════════════════ */}
      {activeView === 'editor' && (
        <>
          {selectedEmployeeId && selectedEmployee ? (
            <div className="ws-card">
              <div className="ws-card-header">
                <div className="ws-card-header-top">
                  <h3>
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  <span className="ws-weekly-hours" title="Horas semanales estimadas">
                    {weeklyHours}h semanales
                  </span>
                </div>
                <p className="ws-card-hint">
                  Activa los días que trabaja e indica el rango horario.
                  {conflictDays.length > 0 && (
                    <span className="ws-conflict-warning">
                      {' '}
                      Atención: {conflictDays.length} día(s) activos fuera del horario del negocio.
                    </span>
                  )}
                </p>
              </div>

              <div className="ws-table">
                <div className="ws-table-head">
                  <span>Día</span>
                  <span>Trabaja</span>
                  <span>Entrada</span>
                  <span>Salida</span>
                </div>

                {rows.map((row, i) => {
                  const isConflict = row.is_active && !businessWorkingDays.includes(row.day_of_week);
                  return (
                    <div
                      key={row.day_of_week}
                      className={[
                        'ws-table-row',
                        !row.is_active ? 'ws-row-inactive' : '',
                        isConflict ? 'ws-row-conflict' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="ws-day-label">
                        {row.label}
                        {isConflict && (
                          <span
                            className="ws-day-conflict-icon"
                            title="El negocio está cerrado este día"
                          >
                            !
                          </span>
                        )}
                      </span>

                      <label className="ws-toggle-wrap">
                        <input
                          type="checkbox"
                          checked={row.is_active}
                          onChange={(e) => updateRow(i, 'is_active', e.target.checked)}
                        />
                        <span className="ws-toggle-slider" />
                      </label>

                      <input
                        type="time"
                        value={row.start_time}
                        disabled={!row.is_active}
                        onChange={(e) => updateRow(i, 'start_time', e.target.value)}
                        className="ws-time-input"
                      />

                      <input
                        type="time"
                        value={row.end_time}
                        disabled={!row.is_active}
                        onChange={(e) => updateRow(i, 'end_time', e.target.value)}
                        className="ws-time-input"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="ws-actions">
                <button
                  type="button"
                  className="ws-btn-ghost"
                  onClick={() => setActiveView('overview')}
                >
                  ← Vista general
                </button>
                <div className="ws-actions-right">
                  <button
                    type="button"
                    className="ws-btn-secondary"
                    onClick={handleReset}
                    disabled={!isDirty}
                  >
                    Descartar cambios
                  </button>
                  <button
                    type="button"
                    className="ws-btn-primary"
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                  >
                    {saving ? 'Guardando...' : 'Guardar horarios'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ws-empty">
              <span className="ws-empty-icon">📅</span>
              <p>Selecciona un trabajador/a en la Vista General para configurar su horario.</p>
              <button
                type="button"
                className="ws-btn-secondary"
                onClick={() => setActiveView('overview')}
              >
                Ir a Vista General
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkSchedulesPage;
