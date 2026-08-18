import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  PlusCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertTriangle, 
  Wrench, 
  FolderKanban, 
  X, 
  Eye, 
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { MaterialRequestRecord, MaterialRequestStatus, WorkFrontRecord } from '../types';
import { getMaterialRequests, saveMaterialRequest, generateNextMaterialRequestCode, getWorkFronts } from '../lib/storage';

interface MaterialsViewProps {
  onNavigateToDeliveries?: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  onNavigateToDeliveries,
}) => {
  const [requestsList, setRequestsList] = useState<MaterialRequestRecord[]>([]);
  const [workFronts, setWorkFronts] = useState<WorkFrontRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequestRecord | null>(null);

  // New Request Form
  const [newRequestForm, setNewRequestForm] = useState({
    workFrontCode: '',
    caseCode: '',
    urgency: 'Media' as any,
    justification: '',
    items: [
      { name: '', requestedQuantity: 1, unit: 'un', technicalSpecification: '' }
    ]
  });

  const reloadData = () => {
    setRequestsList(getMaterialRequests());
    setWorkFronts(getWorkFronts());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleAddItemRow = () => {
    setNewRequestForm({
      ...newRequestForm,
      items: [
        ...newRequestForm.items,
        { name: '', requestedQuantity: 1, unit: 'un', technicalSpecification: '' }
      ]
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (newRequestForm.items.length <= 1) return;
    const updated = newRequestForm.items.filter((_, i) => i !== index);
    setNewRequestForm({ ...newRequestForm, items: updated });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...newRequestForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setNewRequestForm({ ...newRequestForm, items: updated });
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = newRequestForm.items.filter(i => i.name.trim());
    if (validItems.length === 0) return;

    const nextCode = generateNextMaterialRequestCode();
    const created = saveMaterialRequest({
      id: 'REQ-' + Date.now(),
      requestCode: nextCode,
      workFrontId: 'WF-' + Date.now(),
      workFrontCode: newRequestForm.workFrontCode || 'FO-2026-0001',
      caseId: 'EXP-' + Date.now(),
      caseCode: newRequestForm.caseCode || 'EXP-2026-0001',
      requestedBy: 'Supervisor de Frente',
      requestDate: new Date().toISOString().split('T')[0],
      urgency: newRequestForm.urgency,
      status: 'SOLICITADO',
      justification: newRequestForm.justification,
      items: validItems.map((it, idx) => ({
        id: 'ITM-' + idx,
        name: it.name,
        requestedQuantity: Number(it.requestedQuantity) || 1,
        unit: it.unit,
        technicalSpecification: it.technicalSpecification,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    reloadData();
    setIsCreatingRequest(false);
    setNewRequestForm({
      workFrontCode: '',
      caseCode: '',
      urgency: 'Media',
      justification: '',
      items: [{ name: '', requestedQuantity: 1, unit: 'un', technicalSpecification: '' }]
    });
  };

  const getStatusBadge = (status: MaterialRequestStatus) => {
    const s = (status || '').toUpperCase();
    if (s.includes('SOLICITADO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800">SOLICITADO</span>;
    if (s.includes('REVISIÓN')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">EN REVISIÓN</span>;
    if (s.includes('APROBADO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">APROBADO</span>;
    if (s.includes('COMPRADO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">COMPRADO</span>;
    if (s.includes('CAMINO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse">EN CAMINO 🚚</span>;
    if (s.includes('ENTREGADO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-950 text-teal-300 border border-teal-800">ENTREGADO EN SITIO</span>;
    if (s.includes('RECHAZADO')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">RECHAZADO</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
  };

  const filteredRequests = requestsList.filter((r) => {
    const matchesSearch = 
      r.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workFrontCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="sipre-materials-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Suministros y Logística
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5 mt-1">
            <Boxes className="w-6 h-6 text-cyan-400" />
            <span>Gestión de Materiales e Insumos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de requerimientos técnicos, resinas, morteros de reparación, aceros y órdenes de compra.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingRequest(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ SOLICITAR MATERIALES</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (ej. REQ-2026-0001), frente de obra o material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Todos los Estados</option>
          <option value="SOLICITADO">SOLICITADO</option>
          <option value="EN REVISIÓN">EN REVISIÓN</option>
          <option value="APROBADO">APROBADO</option>
          <option value="COMPRADO">COMPRADO</option>
          <option value="EN CAMINO">EN CAMINO</option>
          <option value="ENTREGADO EN SITIO">ENTREGADO EN SITIO</option>
        </select>
      </div>

      {/* Table / Grid */}
      {filteredRequests.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Código</th>
                  <th className="p-3.5">Frente de Obra</th>
                  <th className="p-3.5">Ítems Solicitados</th>
                  <th className="p-3.5">Urgencia</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 pr-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-cyan-400">
                      {req.requestCode}
                    </td>
                    <td className="p-3.5 font-mono text-slate-200">
                      {req.workFrontCode}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-white block">
                        {req.items.map(i => `${i.name} (${i.requestedQuantity} ${i.unit})`).join(', ')}
                      </span>
                      {req.justification && (
                        <span className="text-[11px] text-slate-400 truncate block max-w-xs">{req.justification}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`font-bold ${req.urgency === 'Urgente' || req.urgency === 'Alta' ? 'text-red-400' : 'text-slate-300'}`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {req.requestDate}
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg font-bold border border-slate-700 flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
            <Boxes className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No hay solicitudes de materiales registradas</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Las solicitudes de materiales se generan para abastecer las cuadrillas de reparación en los frentes de obra activos.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingRequest(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ SOLICITAR MATERIALES</span>
          </button>
        </div>
      )}

      {/* Modal: Nueva Solicitud de Materiales */}
      {isCreatingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateRequest} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-cyan-400" />
                <span>Nueva Solicitud de Materiales</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingRequest(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Frente de Obra *</label>
                  <input
                    type="text"
                    required
                    value={newRequestForm.workFrontCode}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, workFrontCode: e.target.value })}
                    placeholder="Ej. FO-2026-0001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nivel de Urgencia</label>
                  <select
                    value={newRequestForm.urgency}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, urgency: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Justificación Técnica</label>
                <input
                  type="text"
                  value={newRequestForm.justification}
                  onChange={(e) => setNewRequestForm({ ...newRequestForm, justification: e.target.value })}
                  placeholder="Ej. Resina epóxica e inyectores para reparación de viga V-102"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Ítems Solicitados</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Agregar Ítem</span>
                  </button>
                </div>

                {newRequestForm.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        required
                        placeholder="Nombre material (ej. SikaWrap)"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={item.requestedQuantity}
                        onChange={(e) => handleItemChange(idx, 'requestedQuantity', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="un">un (unidad)</option>
                        <option value="kg">kg</option>
                        <option value="gal">galón</option>
                        <option value="m">metro</option>
                        <option value="m²">m²</option>
                        <option value="saco">saco / bulto</option>
                      </select>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingRequest(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Registrar Solicitud
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Detalle de Solicitud */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedRequest.requestCode}</span>
                <h3 className="text-base font-black text-white">Detalle de Solicitud</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Frente de Obra:</span>
                <span className="font-mono font-bold text-white">{selectedRequest.workFrontCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Estado:</span>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Urgencia:</span>
                <span className="font-bold text-white">{selectedRequest.urgency}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Solicitado por:</span>
                <span className="text-white">{selectedRequest.requestedBy}</span>
              </div>

              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Ítems:</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  {selectedRequest.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between font-mono">
                      <span>{it.name}</span>
                      <span className="font-bold text-cyan-400">{it.requestedQuantity} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
