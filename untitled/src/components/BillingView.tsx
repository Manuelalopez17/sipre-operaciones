import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileText, 
  X, 
  Eye, 
  ShieldCheck,
  FolderKanban,
  Wrench,
  Receipt
} from 'lucide-react';
import { BillingRecord, BillingPaymentStatus, CaseRecord } from '../types';
import { getBillings, saveBilling, generateNextBillingCode, getCases } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { canModifyBilling, getDisplayRole } from '../lib/roles';
import { recordActivity } from '../lib/supabaseService';

export const BillingView: React.FC = () => {
  const { user, profile } = useAuth();
  const [billingsList, setBillingsList] = useState<BillingRecord[]>([]);
  const [casesList, setCasesList] = useState<CaseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreatingBilling, setIsCreatingBilling] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingRecord | null>(null);
  const userCanEdit = canModifyBilling(profile?.role);

  // New Billing State
  const [newBillingForm, setNewBillingForm] = useState({
    caseCode: '',
    workFrontCode: '',
    clientName: '',
    concept: 'Inspección técnica estructural y dictamen patológico',
    totalAmount: 0,
    advancePercentage: 50,
    paymentTerms: '50% anticipo, 50% contra entrega de informe/obra',
  });

  const reloadData = () => {
    setBillingsList(getBillings());
    setCasesList(getCases());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleCreateBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillingForm.clientName.trim()) return;

    const nextCode = generateNextBillingCode();
    const total = Number(newBillingForm.totalAmount) || 0;
    const advance = Math.round((total * (Number(newBillingForm.advancePercentage) || 50)) / 100);

    const created = saveBilling({
      id: 'BILL-' + Date.now(),
      billingCode: nextCode,
      caseId: 'EXP-' + Date.now(),
      caseCode: newBillingForm.caseCode || 'EXP-2026-0001',
      workFrontCode: newBillingForm.workFrontCode,
      clientName: newBillingForm.clientName,
      concept: newBillingForm.concept,
      totalAmount: total,
      advanceRequested: advance,
      balancePending: total,
      paidAmount: 0,
      paymentStatus: 'PENDIENTE DE COBRO',
      paymentTerms: newBillingForm.paymentTerms,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    recordActivity(
      `Cuenta de cobro emitida: ${nextCode} por $${total.toLocaleString()}`,
      { billingCode: nextCode, totalAmount: total, client: newBillingForm.clientName },
      {
        userId: user?.id,
        userName: profile?.full_name || 'Administración',
        userRole: profile?.role,
        entityType: 'billing',
        entityId: created.id,
      }
    );

    reloadData();
    setIsCreatingBilling(false);
    setNewBillingForm({
      caseCode: '',
      workFrontCode: '',
      clientName: '',
      concept: 'Inspección técnica estructural y dictamen patológico',
      totalAmount: 0,
      advancePercentage: 50,
      paymentTerms: '50% anticipo, 50% contra entrega de informe/obra',
    });
  };

  const getStatusBadge = (status: BillingPaymentStatus) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PENDIENTE DE COBRO') || s.includes('ANTICIPO')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">PENDIENTE</span>;
    }
    if (s.includes('PARCIAL')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-800">PAGO PARCIAL</span>;
    }
    if (s.includes('PAGADO')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">PAGADO</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">{status}</span>;
  };

  const filteredBillings = billingsList.filter((b) => {
    const matchesSearch = 
      b.billingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.caseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || b.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="sipre-billing-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Administración Financiera
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5 mt-1">
            <CreditCard className="w-6 h-6 text-cyan-400" />
            <span>Cobros, Facturación y Recaudos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cuentas de cobro por concepto de peritajes, anticipos de frentes de obra y control de saldos pendientes.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingBilling(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ NUEVA CUENTA DE COBRO</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (ej. CC-2026-0001), cliente o expediente..."
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
          <option value="PENDIENTE DE COBRO">PENDIENTE DE COBRO</option>
          <option value="ANTICIPO PENDIENTE">ANTICIPO PENDIENTE</option>
          <option value="PAGO PARCIAL">PAGO PARCIAL</option>
          <option value="PAGADO">PAGADO</option>
        </select>
      </div>

      {/* Billings Table */}
      {filteredBillings.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-5">Código</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Expediente</th>
                  <th className="p-3.5">Concepto</th>
                  <th className="p-3.5">Valor Total</th>
                  <th className="p-3.5">Pendiente</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 pr-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredBillings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3.5 pl-5 font-mono font-bold text-cyan-400">
                      {b.billingCode}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {b.clientName}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {b.caseCode}
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-slate-400">
                      {b.concept}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      ${b.totalAmount.toLocaleString('es-CO')}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      ${b.balancePending.toLocaleString('es-CO')}
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(b.paymentStatus)}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => setSelectedBilling(b)}
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
            <CreditCard className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No hay cobros ni facturas pendientes</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Los cobros por servicios profesionales y ejecución de obra se gestionan aquí vinculados a cada expediente.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingBilling(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ NUEVA CUENTA DE COBRO</span>
          </button>
        </div>
      )}

      {/* Modal: Nueva Cuenta de Cobro */}
      {isCreatingBilling && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateBilling} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-cyan-400" />
                <span>Nueva Cuenta de Cobro / Factura</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingBilling(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Cliente / Copropiedad *</label>
                <input
                  type="text"
                  required
                  value={newBillingForm.clientName}
                  onChange={(e) => setNewBillingForm({ ...newBillingForm, clientName: e.target.value })}
                  placeholder="Ej. Condominio Los Sauces P.H."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Expediente Vinculado</label>
                  <input
                    type="text"
                    value={newBillingForm.caseCode}
                    onChange={(e) => setNewBillingForm({ ...newBillingForm, caseCode: e.target.value })}
                    placeholder="Ej. EXP-2026-0001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Frente de Obra (opcional)</label>
                  <input
                    type="text"
                    value={newBillingForm.workFrontCode}
                    onChange={(e) => setNewBillingForm({ ...newBillingForm, workFrontCode: e.target.value })}
                    placeholder="Ej. FO-2026-0001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Concepto Técnico del Cobro</label>
                <input
                  type="text"
                  value={newBillingForm.concept}
                  onChange={(e) => setNewBillingForm({ ...newBillingForm, concept: e.target.value })}
                  placeholder="Descripción del servicio profesional o intervención..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Valor Total ($ COP) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newBillingForm.totalAmount || ''}
                    onChange={(e) => setNewBillingForm({ ...newBillingForm, totalAmount: Number(e.target.value) })}
                    placeholder="Ej. 2500000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">% Anticipo Solicitado</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newBillingForm.advancePercentage}
                    onChange={(e) => setNewBillingForm({ ...newBillingForm, advancePercentage: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Condiciones de Pago</label>
                <input
                  type="text"
                  value={newBillingForm.paymentTerms}
                  onChange={(e) => setNewBillingForm({ ...newBillingForm, paymentTerms: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingBilling(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Crear Cobro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Detalle de Cobro */}
      {selectedBilling && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedBilling.billingCode}</span>
                <h3 className="text-base font-black text-white">{selectedBilling.clientName}</h3>
              </div>
              <button
                onClick={() => setSelectedBilling(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Expediente:</span>
                <span className="font-mono font-bold text-white">{selectedBilling.caseCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Estado de Pago:</span>
                <div>{getStatusBadge(selectedBilling.paymentStatus)}</div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Concepto:</span>
                <span className="text-right text-slate-200 max-w-[200px] truncate">{selectedBilling.concept}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Valor Total:</span>
                <span className="font-mono font-bold text-white">${selectedBilling.totalAmount.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Saldo Pendiente:</span>
                <span className="font-mono font-bold text-amber-400">${selectedBilling.balancePending.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBilling(null)}
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
