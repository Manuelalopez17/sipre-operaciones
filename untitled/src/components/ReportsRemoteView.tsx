import React, { useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCw, Search, Loader2, AlertCircle, Eye, Cloud, HardDriveDownload } from 'lucide-react';
import { getInspections } from '../lib/storage';
import { getEvidenceFilesFromDb } from '../lib/supabaseService';
import { getInspectionSnapshotsRemote, migrateLocalInspectionSnapshots, RemoteInspectionSnapshot, subscribeInspectionSnapshots } from '../lib/inspectionRemote';
import { EvidenceMediaItem, PropertyInspection } from '../types';
import { useAuth } from '../context/AuthContext';
import { ComprehensiveReportView } from './ComprehensiveReportView';

export const ReportsRemoteView: React.FC = () => {
  const { user, profile } = useAuth();
  const [remote, setRemote] = useState<RemoteInspectionSnapshot[]>([]);
  const [local, setLocal] = useState<PropertyInspection[]>([]);
  const [selected, setSelected] = useState<PropertyInspection | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const localRows = getInspections();
      setLocal(localRows);
      const remoteRows = await getInspectionSnapshotsRemote();
      setRemote(remoteRows);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los informes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeInspectionSnapshots(load);
    const timer = window.setInterval(load, 10000);
    return () => { unsub(); window.clearInterval(timer); };
  }, []);

  const combined = useMemo(() => {
    const map = new Map<string, { inspection: PropertyInspection; source: 'remoto' | 'local'; updatedAt: string }>();
    remote.forEach(row => map.set(row.inspectionId, { inspection: row.snapshot, source: 'remoto', updatedAt: row.updatedAt }));
    local.forEach(row => {
      if (!map.has(row.id)) map.set(row.id, { inspection: row, source: 'local', updatedAt: row.updatedAt || row.createdAt });
    });
    return [...map.values()].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }, [remote, local]);

  const filtered = useMemo(() => combined.filter(row => {
    const i = row.inspection;
    const hay = `${i.id} ${i.visitId || ''} ${i.caseId || ''} ${i.address || ''} ${i.ownerName || i.ownerOrOccupant || ''} ${i.inspectorName || ''}`.toLowerCase();
    return !search.trim() || hay.includes(search.trim().toLowerCase());
  }), [combined, search]);

  const recoverLocal = async () => {
    setMigrating(true); setError(null);
    try {
      const rows = getInspections();
      const count = await migrateLocalInspectionSnapshots(rows, user?.id, profile?.full_name || user?.email || 'Usuario SIPRE');
      setNotice(count ? `${count} registro(s) local(es) fueron respaldados en Supabase.` : 'No había registros locales nuevos por respaldar.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'No se pudieron respaldar los registros locales.');
    } finally {
      setMigrating(false);
      window.setTimeout(() => setNotice(null), 6000);
    }
  };

  const openReport = async (inspection: PropertyInspection) => {
    setSelected(inspection);
    setSelectedEvidence([]);
    try {
      const evidence = await getEvidenceFilesFromDb({ caseId: inspection.caseId, visitId: inspection.visitId });
      setSelectedEvidence(evidence);
    } catch {
      setSelectedEvidence(inspection.evidenceMedia || []);
    }
  };

  useEffect(() => {
    if (loading || selected) return;
    const requestedVisitId = sessionStorage.getItem('sipre_open_report_visit');
    if (!requestedVisitId) return;

    const match = combined.find(row => row.inspection.visitId === requestedVisitId);
    sessionStorage.removeItem('sipre_open_report_visit');

    if (match) {
      openReport(match.inspection);
    } else {
      setNotice('Esta visita todavía no tiene un informe finalizado en Supabase. Si eres el profesional asignado, vuelve a VISITAS y usa “Editar / completar informe” para diligenciarlo y finalizarlo.');
      window.setTimeout(() => setNotice(null), 8000);
    }
  }, [loading, combined, selected]);

  if (selected) {
    return <ComprehensiveReportView inspection={{ ...selected, evidenceMedia: selectedEvidence.length ? selectedEvidence : selected.evidenceMedia }} evidence={selectedEvidence} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold tracking-widest text-teal-700 uppercase">Informes SIPRE</div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-1"><FileText className="w-6 h-6 text-teal-700" />Informes completos de inspección</h1>
          <p className="text-xs text-slate-500 mt-1">Consulta el registro integral de cada visita y genera un PDF con todos los datos disponibles, no solo el resumen de IA.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={recoverLocal} disabled={migrating} className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">{migrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDriveDownload className="w-4 h-4" />}Respaldar registros de este computador</button>
          <button onClick={load} className="px-3 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"><RefreshCw className="w-4 h-4" />Actualizar</button>
        </div>
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs font-bold">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="relative"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por predio, dirección, visita, expediente o profesional..." className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" /></div></div>

      {loading ? <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Cargando informes...</div> : filtered.length ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{filtered.map(({ inspection, source, updatedAt }) => (
        <article key={inspection.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3"><div><div className="font-mono text-xs font-bold text-teal-700">{inspection.id}</div><div className="text-lg font-black text-slate-900 mt-1">{inspection.ownerName || inspection.ownerOrOccupant || inspection.address || 'Inspección'}</div><div className="text-xs text-slate-500 mt-1">{inspection.address} · {inspection.municipality}</div></div><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${source === 'remoto' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{source === 'remoto' ? <><Cloud className="w-3 h-3 inline mr-1" />Remoto</> : 'Solo en este equipo'}</span></div>
          <div className="grid grid-cols-2 gap-2 text-xs"><div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-500">Profesional</span><div className="font-bold text-slate-800 mt-0.5">{inspection.inspectorName || 'No registrado'}</div></div><div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-500">Estado</span><div className="font-bold text-slate-800 mt-0.5">{inspection.status || 'No registrado'}</div></div></div>
          <div className="text-[10px] text-slate-400">Última actualización: {updatedAt ? new Date(updatedAt).toLocaleString('es-CO') : 'No disponible'}</div>
          <div className="flex justify-end border-t border-slate-200 pt-3"><button onClick={() => openReport(inspection)} className="px-3 py-2 rounded-lg bg-teal-700 text-white text-xs font-bold flex items-center gap-1"><Eye className="w-4 h-4" />Ver informe completo / PDF</button></div>
        </article>
      ))}</div> : <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">No hay informes recuperados todavía.</div>}
    </div>
  );
};