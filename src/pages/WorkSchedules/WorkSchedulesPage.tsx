/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useWorkSchedules, DAYS_OF_WEEK } from '../../hooks/useWorkSchedules';
import { toast } from 'react-toastify';
import './workSchedules.css';

interface DayRow {
  day_of_week: number;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';

const emptyDays = (): DayRow[] =>
  DAYS_OF_WEEK.map((d) => ({
    day_of_week: d.value,
    label: d.label,
    start_time: DEFAULT_START,
    end_time: DEFAULT_END,
    is_active: d.value <= 4, // Lunes-Viernes activos por defecto
  }));

const WorkSchedulesPage: React.FC = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [rows, setRows] = useState<DayRow[]>(emptyDays());
  const [saving, setSaving] = useState(false);

  const { users, fetchUsers } = useUsers();
  const { schedules, fetchSchedules, saveEmployeeSchedules } = useWorkSchedules();

  const employees = users.filter((u) => u.is_active);

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    fetchSchedules(selectedEmployeeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId]);

  // Sincronizar rows cuando llegan los horarios del backend
  useEffect(() => {
    const base = emptyDays();
    const merged = base.map((row) => {
      const found = schedules.find((s) => s.day_of_week === row.day_of_week);
      if (found) {
        return {
          ...row,
          start_time: found.start_time.slice(0, 5),
          end_time: found.end_time.slice(0, 5),
          is_active: found.is_active,
        };
      }
      return row;
    });
    setRows(merged);
  }, [schedules]);

  const handleEmployeeChange = (id: number) => {
    setSelectedEmployeeId(id);
    setRows(emptyDays());
  };

  const updateRow = (index: number, field: keyof DayRow, value: any) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    if (!selectedEmployeeId) return;

    // Validar horas en días activos
    for (const row of rows) {
      if (row.is_active && row.start_time >= row.end_time) {
        toast.error(`${row.label}: la hora de entrada debe ser anterior a la de salida.`);
        return;
      }
    }

    setSaving(true);
    try {
      await saveEmployeeSchedules(selectedEmployeeId, rows);
      toast.success('Horarios guardados correctamente');
    } catch {
      toast.error('Error al guardar los horarios');
    } finally {
      setSaving(false);
    }
  };

  const selectedEmployee = employees.find((u) => u.id === selectedEmployeeId);

  return (
    <div className="ws-page">
      <div className="ws-header">
        <h2>Horarios de Trabajo</h2>
        <p className="ws-subtitle">
          Configura los días y horarios de atención de cada trabajador/a.
        </p>
      </div>

      {/* Selector de empleado */}
      <div className="ws-employee-selector">
        <label>Trabajador/a</label>
        <div className="ws-employee-list">
          {employees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              className={`ws-employee-btn${selectedEmployeeId === emp.id ? ' active' : ''}`}
              onClick={() => handleEmployeeChange(emp.id)}
            >
              <div className="ws-employee-avatar">
                {(emp.first_name?.[0] || '?').toUpperCase()}
                {(emp.last_name?.[0] || '').toUpperCase()}
              </div>
              <span>{emp.first_name} {emp.last_name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor de horarios */}
      {selectedEmployeeId ? (
        <div className="ws-card">
          <div className="ws-card-header">
            <h3>Horario de {selectedEmployee?.first_name} {selectedEmployee?.last_name}</h3>
            <p className="ws-card-hint">Activa los días que trabaja e indica el rango horario.</p>
          </div>

          <div className="ws-table">
            {/* Encabezado */}
            <div className="ws-table-head">
              <span>Día</span>
              <span>Trabaja</span>
              <span>Entrada</span>
              <span>Salida</span>
            </div>

            {/* Filas */}
            {rows.map((row, i) => (
              <div key={row.day_of_week} className={`ws-table-row${!row.is_active ? ' ws-row-inactive' : ''}`}>
                <span className="ws-day-label">{row.label}</span>

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
            ))}
          </div>

          <div className="ws-actions">
            <button
              type="button"
              className="ws-btn-secondary"
              onClick={() => setRows(emptyDays())}
            >
              Restablecer
            </button>
            <button
              type="button"
              className="ws-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar horarios'}
            </button>
          </div>
        </div>
      ) : (
        <div className="ws-empty">
          <span className="ws-empty-icon">📅</span>
          <p>Selecciona un trabajador/a para configurar su horario.</p>
        </div>
      )}
    </div>
  );
};

export default WorkSchedulesPage;
