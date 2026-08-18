import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  PlusCircle, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Boxes, 
  Navigation, 
  X, 
  Eye, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { MaterialDeliveryRecord, DeliveryStatus, WorkFrontRecord } from '../types';
import { getMaterialDeliveries, saveMaterialDelivery, generateNextDeliveryCode, getWorkFronts } from '../lib/storage';

export const DeliveriesView: React.FC = () => {
  const [deliveriesList, setDeliveriesList] = useState<MaterialDeliveryRecord[]>([]);
  const [workFronts, setWorkFronts] = useState<WorkFrontRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<MaterialDeliveryRecord | null>(null);

  // New Delivery Form State
  const [newDeliveryForm, setNewDeliveryForm] = useState({
    workFrontCode: '',
    transportType: 'Vehículo propio',
    driverCourierName: '',
    driverPhone: '',
    departureDateTime: new Date().toISOString().split('T')[0] + 'T08:00',
    estimatedArrivalDateTime: new Date().toISOString().split('T')[0] + 'T10:00',
    itemsSummary: '',
  });

  const reloadData = () => {
    setDeliveriesList(getMaterialDeliveries());
    setWorkFronts(getWorkFronts());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeliveryForm.workFrontCode.trim()) return;

    const nextCode = generateNextDeliveryCode();
    const created = saveMaterialDelivery({
      id: 'DEL-' + Date.now(),
      deliveryNoteCode: nextCode,
      materialRequestId: 'REQ-' + Date.now(),
      materialRequestCode: 'REQ-2026-0001',
      workFrontId: 'WF-' + Date.now(),
      workFrontCode: newDeliveryForm.workFrontCode,
      departureDateTime: newDeliveryForm.departureDateTime,
      estimatedArrivalDateTime: newDeliveryForm.estimatedArrivalDateTime,
      transportType: newDeliveryForm.transportType,
      driverCourierName: newDeliveryForm.driverCourierName || 'Conductor Asignado',
      driverPhone: newDeliveryForm.driverPhone,
      status: 'PROGRAMADA',
      deliveredItems: [
        { materialItemId: 'ITM-1', name: newDeliveryForm.itemsSummary || 'Materiales de obra', deliveredQuantity: 1, unit: 'global' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    reloadData();
    setIsCreatingDelivery(false);
    setNewDeliveryForm({
      workFrontCode: '',
      transportType: 'Vehículo propio',
      driverCourierName: '',
      driverPhone: '',
      departureDateTime: new Date().toISOString().split('T')[0] + 'T08:00',
      estimatedArrivalDateTime: new Date().toISOString().split('T')[0] + 'T10:00',
      itemsSummary: '',
    });
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PROGRAMADA')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800">PROGRAMADA</span>;
    if (s.includes('EN RUTA')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">EN RUTA 🚚</span>;
    if (s.includes('ENTREGADA')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">ENTREGADA EN SITIO</span>;
    if (s.includes('RECHAZADA')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">RECHAZADA</span>;
    if (s.includes('PARCIAL')) return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-800">ENTREGA PARCIAL</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
  };

  const filteredDeliveries = deliveriesList.filter((d) => {
    const matchesSearch = 
      d.deliveryNoteCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.workFrontCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.driverCourierName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="sipre-deliveries-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Logística y Despachos
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5 mt-1">
            <Truck className="w-6 h-6 text-cyan-400" />
            <span>Entregas de Materiales en Sitio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo de remisiones, rutas de entrega hoy, transportistas y actas de recepción en obra.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingDelivery(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ PROGRAMAR ENTREGA</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por remisión (ej. REM-2026-0001), frente de obra o conductor..."
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
          <option value="PROGRAMADA">PROGRAMADA</option>
          <option value="EN RUTA">EN RUTA</option>
          <option value="ENTREGADA">ENTREGADA</option>
          <option value="PARCIAL">PARCIAL</option>
          <option value="RECHAZADA">RECHAZADA</option>
        </select>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveries.map((del) => (
            <div
              key={del.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {del.deliveryNoteCode}
                  </span>
                  {getStatusBadge(del.status)}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">Frente: {del.workFrontCode}</h3>
                  <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>Conductor: {del.driverCourierName} ({del.transportType})</span>
                  </p>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salida:</span>
                    <span className="font-mono text-slate-200">{del.departureDateTime?.replace('T', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Llegada Estimada:</span>
                    <span className="font-mono text-cyan-300">{del.estimatedArrivalDateTime?.replace('T', ' ')}</span>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                    <span className="font-semibold text-slate-300">Carga: </span>
                    <span>{del.deliveredItems.map(i => `${i.name} (${i.deliveredQuantity} ${i.unit})`).join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedDelivery(del)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Remisión</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
            <Truck className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No hay entregas programadas hoy</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Las remisiones de transporte y entregas de materiales en sitio se registrarán aquí con confirmación de recepción.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingDelivery(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ PROGRAMAR ENTREGA</span>
          </button>
        </div>
      )}

      {/* Modal: Programar Entrega */}
      {isCreatingDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateDelivery} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span>Programar Entrega de Materiales</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingDelivery(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Frente de Obra Destino *</label>
                <input
                  type="text"
                  required
                  value={newDeliveryForm.workFrontCode}
                  onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, workFrontCode: e.target.value })}
                  placeholder="Ej. FO-2026-0001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tipo de Transporte</label>
                  <select
                    value={newDeliveryForm.transportType}
                    onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, transportType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Vehículo propio">Vehículo propio</option>
                    <option value="Flete contratado">Flete contratado</option>
                    <option value="Mensajería express">Mensajería express</option>
                    <option value="Proveedor directo">Proveedor directo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nombre Conductor / Transportista</label>
                  <input
                    type="text"
                    value={newDeliveryForm.driverCourierName}
                    onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, driverCourierName: e.target.value })}
                    placeholder="Ej. Carlos Restrepo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fecha / Hora Salida</label>
                  <input
                    type="datetime-local"
                    value={newDeliveryForm.departureDateTime}
                    onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, departureDateTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Llegada Estimada</label>
                  <input
                    type="datetime-local"
                    value={newDeliveryForm.estimatedArrivalDateTime}
                    onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, estimatedArrivalDateTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Resumen de Materiales a Despachar</label>
                <textarea
                  rows={2}
                  value={newDeliveryForm.itemsSummary}
                  onChange={(e) => setNewDeliveryForm({ ...newDeliveryForm, itemsSummary: e.target.value })}
                  placeholder="Ej. 5 galones de resina epóxica + 20 inyectores plásticos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingDelivery(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Registrar Despacho
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Detalle de Remisión */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedDelivery.deliveryNoteCode}</span>
                <h3 className="text-base font-black text-white">Remisión de Entrega</h3>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Destino:</span>
                <span className="font-mono font-bold text-white">{selectedDelivery.workFrontCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Estado:</span>
                <div>{getStatusBadge(selectedDelivery.status)}</div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Transportista:</span>
                <span className="text-white">{selectedDelivery.driverCourierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Salida / Llegada:</span>
                <span className="font-mono text-slate-200">{selectedDelivery.departureDateTime} → {selectedDelivery.estimatedArrivalDateTime}</span>
              </div>

              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Materiales Entregados:</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  {selectedDelivery.deliveredItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between font-mono">
                      <span>{it.name}</span>
                      <span className="font-bold text-cyan-400">{it.deliveredQuantity} {it.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDelivery(null)}
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
