import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, Search, MapPin, RefreshCw, Trash2, Boxes, Truck, Loader2, Eye, UserCheck } from 'lucide-react';
import { WorkFrontRecord, WorkFrontStatus } from '../types';
import { getWorkFrontsFromDb, updateWorkFrontStatusInDb, deleteWorkFrontInDb, subscribeWorkFrontsRealtime } from '../lib/workFrontRemote';
import { useAuth } from '../context/AuthContext';
import { isCoordinator, isManagement, isOperative, isProfessional } from '../lib/roles';

interface WorkFrontsViewProps {
  onNavigateToMaterials?: () => void;
  onNavigateToDeliveries?: () => void;
}

export const WorkFrontsView: React.FC<WorkFrontsViewProps> = ({ onNavigateToMaterials, onNavigateToDeliveries }) => {
  const { user, profile } = useAuth();
  const [fronts, setFronts] = useState<WorkFrontRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const professionalRole = isProfessional(profile?.role);
  const coordinatorRole = isCoordinator(profile?.role);
  const managementRole = isManagement(profile?.role);
  const operativeRole = isOperative(profile?.role);
  const myName = (profile?.full_name || '').trim().toLowerCase();

  const reload = async () => {
    try {
      setFronts(await getWorkFrontsFromDb());
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los frentes de obra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    const unsub = subscribeWorkFrontsRealtime(reload);
    return unsub;
  }, []);

  const visible = useMemo(() => {
    let list = fronts;
    if (professionalRole) {
      list = list.filter(f => {
        const name = (f.responsibleTechnicalProfessional || '').trim().toLowerCase();
        return myName && (name === myName || name.includes(myName) || myName.includes(name));
      });
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(f =>
      (f.frontCode || '').toLowerCase().includes(q) ||
      (f.clientName || '').toLowerCase().includes(q) ||
      (f.propertyAddress || '').toLowerCase().includes(q) ||
      (f.caseCode || '').toLowerCase().includes(q)
    );
  }, [fronts, professionalRole, myName, search]);

  const changeStatus = async (front: WorkFrontRecord, status: WorkFrontStatus) => {
    if (!professionalRole) return;
    setActing(front.id);
    setError(null);
    try {
      await updateWorkFrontStatusInDb(front.id, status);
      await reload();
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el frente.');
    } finally {
      setActing(null);
    }
  };

  const removePendingFront = async (front: WorkFrontRecord) => {
    if (!coordinatorRole || front.status !== 'PENDIENTE') return;
    if (!window.confirm(`¿Eliminar el frente de prueba ${front.frontCode}? Solo se permite eliminar desde coordinación cuando está PENDIENTE.`)) return;
    setActing(front.id);
    setError(null);
    try {
      await deleteWorkFrontInDb(front.id);
      await reload();
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar el frente. Puede tener información relacionada.');
    } finally {
      setActing(null);
    }
  };

  const badge = (status: WorkFrontStatus) => {
    const cls = status === 'EN EJECUCIÓN' ? 'bg-emerald-950 text-emerald-300' : status === 'PENDIENTE' ? 'bg-amber-950 text-amber-300' : status === 'ENTREGADO' || status === 'CERRADO' ? 'bg-slate-800 text-slate-300' : 'bg-cyan-950 text-cyan-300';
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-700 ${cls}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">Intervenciones</div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1"><Wrench className="w-6 h-6 text-cyan-400" />Frentes de Obra</h1>
          <p className="text-xs text-slate-400 mt-1">
            {professionalRole ? 'Se muestran únicamente los frentes bajo tu responsabilidad técnica.' : coordinatorRole ? 'Seguimiento general en modo lectura. Puedes eliminar únicamente frentes PENDIENTES de prueba.' : managementRole ? 'Vista general en modo lectura.' : 'Consulta del frente para coordinación de materiales y entregas.'}
          </p>
        </div>
        <button onClick={reload} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs flex items-center gap-1"><RefreshCw className="w-4 h-4" />Actualizar</button>
      </div>

      {operativeRole && (
        <div className="flex flex-wrap gap-2">
          {onNavigateToMaterials && <button onClick={onNavigateToMaterials} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Boxes className="w-4 h-4" />Gestionar materiales</button>}
          {onNavigateToDeliveries && <button onClick={onNavigateToDeliveries} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Truck className="w-4 h-4" />Gestionar entregas</button>}
        </div>
      )}

      {error && <div className="bg-red-950 border border-red-800 text-red-200 rounded-xl p-3 text-xs">{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar frente, cliente, dirección o expediente..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white" />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando frentes remotos...</div>
      ) : visible.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">No hay frentes de obra visibles para este usuario.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(front => (
            <div key={front.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-2"><div className="font-mono text-xs font-bold text-cyan-400">{front.frontCode}</div>{badge(front.status)}</div>
              <div>
                <h3 className="font-black text-white">{front.clientName}</h3>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{front.propertyAddress}</div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                <div><span className="text-slate-500">Expediente:</span> <strong className="text-cyan-300">{front.caseCode || '-'}</strong></div>
                <div><span className="text-slate-500">Responsable técnico:</span> <strong className="text-white">{front.responsibleTechnicalProfessional}</strong></div>
                <div><span className="text-slate-500">Alcance:</span> <span className="text-slate-300">{front.repairScope}</span></div>
              </div>

              {professionalRole ? (
                <div className="border-t border-slate-800 pt-3">
                  <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1"><UserCheck className="w-3 h-3" />Seguimiento técnico</label>
                  <select disabled={acting === front.id} value={front.status} onChange={e => changeStatus(front, e.target.value as WorkFrontStatus)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="PROGRAMADO">PROGRAMADO</option>
                    <option value="LISTO PARA INICIAR">LISTO PARA INICIAR</option>
                    <option value="EN EJECUCIÓN">EN EJECUCIÓN</option>
                    <option value="SUSPENDIDO">SUSPENDIDO</option>
                    <option value="PENDIENTE DE ENTREGA">PENDIENTE DE ENTREGA</option>
                    <option value="ENTREGADO">ENTREGADO</option>
                    <option value="CERRADO">CERRADO</option>
                  </select>
                </div>
              ) : (
                <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-500 flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Modo lectura para este rol.</div>
              )}

              {coordinatorRole && front.status === 'PENDIENTE' && (
                <button disabled={acting === front.id} onClick={() => removePendingFront(front)} className="w-full bg-red-950 border border-red-800 text-red-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" />Eliminar frente de prueba</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
