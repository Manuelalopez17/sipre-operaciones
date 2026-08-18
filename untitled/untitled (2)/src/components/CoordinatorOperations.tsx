import React, { useState, useMemo } from 'react';
import { PropertyInspection, PriorityLevel } from '../types';
import { 
  SlidersHorizontal, 
  Download, 
  MapPin, 
  Search, 
  ShieldAlert, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Filter,
  FileSpreadsheet,
  Layers,
  Calendar
} from 'lucide-react';

interface CoordinatorOperationsProps {
  inspections: PropertyInspection[];
  onSelectInspection: (inspection: PropertyInspection) => void;
  onViewReport: (inspection: PropertyInspection) => void;
}

export const CoordinatorOperations: React.FC<CoordinatorOperationsProps> = ({
  inspections,
  onSelectInspection,
  onViewReport,
}) => {
  const [selectedMuni, setSelectedMuni] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredInspections = useMemo(() => {
    return inspections.filter((i) => {
      const matchesMuni = selectedMuni === 'ALL' || i.municipality === selectedMuni;
      const matchesPriority = selectedPriority === 'ALL' || i.preliminaryPriority === selectedPriority;
      const matchesSystem = selectedSystem === 'ALL' || i.structuralSystem === selectedSystem;
      const matchesSearch =
        i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.inspectorName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesMuni && matchesPriority && matchesSystem && matchesSearch;
    });
  }, [inspections, selectedMuni, selectedPriority, selectedSystem, searchTerm]);

  const uniqueMunis = useMemo(() => {
    const s = new Set<string>();
    inspections.forEach((i) => {
      if (i.municipality) s.add(i.municipality);
    });
    return Array.from(s);
  }, [inspections]);

  const uniqueSystems = useMemo(() => {
    const s = new Set<string>();
    inspections.forEach((i) => {
      if (i.structuralSystem) s.add(i.structuralSystem);
    });
    return Array.from(s);
  }, [inspections]);

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Fecha',
      'Hora',
      'Inspector',
      'Municipio',
      'Barrio',
      'Direccion',
      'Sistema_Estructural',
      'Pisos',
      'Prioridad',
      'Requiere_Eval_Estructural',
      'Restriccion_Acceso',
      'Recomendacion_Evacuacion',
    ];

    const rows = filteredInspections.map((i) => [
      i.id,
      i.date,
      i.time,
      `"${i.inspectorName}"`,
      `"${i.municipality}"`,
      `"${i.neighborhood}"`,
      `"${i.address}"`,
      `"${i.structuralSystem}"`,
      i.floors,
      i.preliminaryPriority,
      i.professionalAssessment?.structuralEvaluationRequired ? 'SI' : 'NO',
      `"${i.professionalAssessment?.accessRestrictions || 'Ninguna'}"`,
      `"${i.professionalAssessment?.evacuationRecommendation || 'No Requerida'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIPRE_OPERACIONES_EMERGENCIA_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">
              Centro de Operaciones y Coordinación de Emergencia
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión estratégica de triaje territorial, asignación de cuadrillas y exportación de censos post-desastre.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>EXPORTAR CENSO CSV ({filteredInspections.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        
        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Buscar Inmueble / Inspector
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, dirección..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Municipio
          </label>
          <select
            value={selectedMuni}
            onChange={(e) => setSelectedMuni(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todos los Municipios</option>
            {uniqueMunis.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Nivel de Prioridad
          </label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="RED">ROJO (Inhabitable)</option>
            <option value="YELLOW">AMARILLO (Restringido)</option>
            <option value="GREEN">VERDE (Habitable)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1">
            Sistema Estructural
          </label>
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todos los Sistemas</option>
            {uniqueSystems.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Operations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-bold uppercase">
                <th className="p-3">ID Inspección</th>
                <th className="p-3">Ubicación / Inmueble</th>
                <th className="p-3">Municipio</th>
                <th className="p-3">Sistema</th>
                <th className="p-3">Prioridad</th>
                <th className="p-3">Eval. Estructural</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    No hay inspecciones registradas.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-850 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">
                      {i.id}
                      <span className="block text-[10px] text-slate-500 font-sans font-normal">
                        {i.date}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{i.address}</span>
                      <span className="text-[11px] text-slate-400">{i.neighborhood}</span>
                    </td>
                    <td className="p-3 font-medium">{i.municipality}</td>
                    <td className="p-3 text-slate-400">{i.structuralSystem}</td>
                    <td className="p-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          i.preliminaryPriority === 'RED'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : i.preliminaryPriority === 'YELLOW'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {i.preliminaryPriority}
                      </span>
                    </td>
                    <td className="p-3">
                      {i.professionalAssessment?.structuralEvaluationRequired ? (
                        <span className="text-amber-400 font-bold">REQUERIDA</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectInspection(i)}
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => onViewReport(i)}
                          className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 px-2.5 py-1 rounded text-xs font-semibold transition-colors border border-cyan-800"
                        >
                          Informe
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
