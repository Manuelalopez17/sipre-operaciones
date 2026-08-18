import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Clock, 
  MapPin, 
  UserCheck, 
  Building,
  CheckCircle,
  AlertTriangle,
  HardHat
} from 'lucide-react';
import { VisitRecord } from '../types';
import { getVisits } from '../lib/storage';

interface AgendaViewProps {
  onOpenScheduleVisitModal: () => void;
  visits?: VisitRecord[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  onOpenScheduleVisitModal,
  visits: propVisits,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [visitsList, setVisitsList] = useState<VisitRecord[]>([]);

  useEffect(() => {
    if (propVisits && propVisits.length > 0) {
      setVisitsList(propVisits);
    } else {
      setVisitsList(getVisits());
    }
  }, [propVisits]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days for month view
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false, dateStr: '' });
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const dayStr = i.toString().padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({ dayNumber: i, isCurrentMonth: true, dateStr });
    }
    return days;
  };

  return (
    <div id="sipre-agenda-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & View Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              Planificación Operativa
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
            <CalendarIcon className="w-6 h-6 text-cyan-400" />
            <span>Agenda de Visitas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Programación, asignación y seguimiento de visitas técnicas en campo
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1 text-xs">
            <button
              id="btn-agenda-month-view"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mes
            </button>
            <button
              id="btn-agenda-week-view"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'week'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              id="btn-agenda-day-view"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'day'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Día
            </button>
          </div>

          <button
            id="btn-agenda-schedule-visit"
            onClick={onOpenScheduleVisitModal}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ PROGRAMAR VISITA</span>
          </button>
        </div>
      </div>

      {/* Calendar Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-base sm:text-lg font-bold text-white">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={handleToday}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handlePrev}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid View */}
      {viewMode === 'month' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Month day cells */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((item, idx) => {
              const dayVisits = item.dateStr ? visitsList.filter(v => v.date === item.dateStr) : [];
              return (
                <div
                  key={idx}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-xl border flex flex-col justify-between transition-colors ${
                    item.isCurrentMonth
                      ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-950/20 border-slate-900/40 text-slate-700 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${item.isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.dayNumber || ''}
                    </span>
                    {dayVisits.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    )}
                  </div>

                  {/* Day Visits List */}
                  <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto max-h-[70px]">
                    {dayVisits.map((v) => (
                      <div
                        key={v.id}
                        className="bg-cyan-950/80 border border-cyan-800/60 rounded p-1 text-[10px] leading-tight text-cyan-200"
                        title={`${v.clientName} - ${v.responsibleProfessional}`}
                      >
                        <div className="font-bold truncate">{v.startTime} {v.clientName}</div>
                        <div className="text-[9px] text-cyan-400/80 truncate">👷 {v.responsibleProfessional}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day View */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Vista de {viewMode === 'week' ? 'Semana' : 'Día'}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Visualización por franjas horarias sincronizada con las visitas programadas en la base operativa.
            </p>
          </div>
        </div>
      )}

      {/* Empty State Banner shown when 0 visits exist */}
      {visitsList.length === 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No hay visitas programadas</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Actualmente no existen inspecciones agendadas en el sistema. Puedes crear un nuevo agendamiento con cliente, dirección y profesional asignado.
            </p>
          </div>
          <button
            onClick={onOpenScheduleVisitModal}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ PROGRAMAR VISITA</span>
          </button>
        </div>
      )}

    </div>
  );
};
