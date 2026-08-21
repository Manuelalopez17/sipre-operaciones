import { defineConfig, mergeConfig, Plugin, UserConfig } from 'vite';
import baseConfig from './vite.config';

function sipreFieldReliabilityFixes(): Plugin {
  return {
    name: 'sipre-field-reliability-fixes',
    enforce: 'pre',
    transform(code, id) {
      if (!(id.endsWith('/src/components/FieldModeView.tsx') || id.endsWith('\\src\\components\\FieldModeView.tsx'))) {
        return null;
      }

      let next = code;

      next = next.replace(
`  const persistDraft = async (step = currentStep, showNotice = false) => {
    if (!initialVisit?.id || !draftReady) return;
    setSavingDraft(true);
    try {
      await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep: step, snapshot, userId: user?.id });
      if (showNotice) {
        setNotice('Borrador guardado en Supabase. Puedes continuar desde otro dispositivo con el mismo usuario.');
        window.setTimeout(() => setNotice(null), 3500);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar remotamente. Verifica que la migración de borradores esté aplicada en Supabase.');
    } finally {
      setSavingDraft(false);
    }
  };`,
`  const persistDraft = async (step = currentStep, showNotice = false): Promise<boolean> => {
    if (!initialVisit?.id || !draftReady) return false;
    setSavingDraft(true);
    try {
      await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep: step, snapshot, userId: user?.id });
      if (showNotice) {
        setNotice('Borrador guardado en Supabase. Puedes continuar desde otro dispositivo con el mismo usuario.');
        window.setTimeout(() => setNotice(null), 3500);
      }
      setError(null);
      return true;
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar remotamente. Verifica la conexión y vuelve a intentar.');
      return false;
    } finally {
      setSavingDraft(false);
    }
  };`
      );

      next = next.replace(
`  const goStep = async (step: number) => {
    await persistDraft(step, false);
    setCurrentStep(Math.max(1, Math.min(10, step)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };`,
`  const goStep = async (step: number) => {
    const targetStep = Math.max(1, Math.min(10, step));
    const saved = await persistDraft(targetStep, false);
    if (!saved) return;
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshRemoteDraft = async () => {
    if (!initialVisit?.id) return;
    setSavingDraft(true); setError(null);
    try {
      const [draft, evidence] = await Promise.all([
        getFieldDraftRemote(initialVisit.id),
        getEvidenceFilesFromDb({ caseId: initialVisit.caseId, visitId: initialVisit.id }).catch(() => []),
      ]);
      if (draft?.snapshot) {
        applyDraft(draft.snapshot);
        setCurrentStep(draft.status === 'COMPLETADA' ? 10 : draft.currentStep);
      }
      if (evidence.length) setEvidenceList(evidence);
      setNotice('Datos actualizados desde Supabase. Ya estás viendo la última información remota disponible.');
      window.setTimeout(() => setNotice(null), 3500);
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar desde Supabase.');
    } finally {
      setSavingDraft(false);
    }
  };`
      );

      next = next.replace(
`      const evidence = await getEvidenceFilesFromDb({ caseId: initialVisit.caseId, visitId: initialVisit.id });
      setEvidenceList(evidence);
      setNotice(\`${'${file.name}'} guardado remotamente.\`);`,
`      const evidence = await getEvidenceFilesFromDb({ caseId: initialVisit.caseId, visitId: initialVisit.id });
      setEvidenceList(evidence);
      await saveFieldDraftRemote({
        visitId: initialVisit.id,
        caseId: initialVisit.caseId,
        currentStep,
        snapshot: { ...snapshot, evidenceList: evidence },
        userId: user?.id,
      });
      setNotice(\`${'${file.name}'} guardado remotamente.\`);`
      );

      next = next.replace(
`  const addZone = () => {
    if (!customZoneName.trim()) return;
    const zone: InspectionWalkthroughZone = { id: \`zone-${'${Date.now()}'}\`, name: customZoneName.trim(), description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 };
    setWalkthroughZones(prev => [...prev, zone]); setSelectedZoneId(zone.id); setCustomZoneName('');
  };`,
`  const addZone = async () => {
    if (!customZoneName.trim()) {
      setError('Escribe el nombre de la zona que deseas agregar.');
      return;
    }
    setError(null);
    const zone: InspectionWalkthroughZone = { id: \`zone-${'${Date.now()}'}\`, name: customZoneName.trim(), description: '', technicalNotes: '', photos: [], videos: [], voiceNotes: [], findingsCount: 0 };
    const nextZones = [...walkthroughZones, zone];
    setWalkthroughZones(nextZones); setSelectedZoneId(zone.id); setCustomZoneName('');
    try {
      if (initialVisit?.id) await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep, snapshot: { ...snapshot, walkthroughZones: nextZones, selectedZoneId: zone.id }, userId: user?.id });
      setNotice('Zona agregada y guardada remotamente.');
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'La zona se agregó en pantalla, pero no pudo guardarse remotamente.');
    }
  };`
      );

      next = next.replace(
`  const addFinding = () => {
    if (!findingForm.elementLabel.trim() && !findingForm.description.trim()) return;
    const finding: Finding = {
      id: \`FIND-${'${Date.now()}'}\`, elementId: \`ELEM-${'${Date.now()}'}\`, elementType: findingForm.elementType,
      elementLabel: findingForm.elementLabel || findingForm.elementType, zone: findingForm.zone, floor: findingForm.floor,
      location: findingForm.zone, material: findingForm.material, description: findingForm.description, damageType: findingForm.damageType,
      severity: findingForm.severity, possibleCause: findingForm.possibleCause, professionalObservation: findingForm.professionalObservation,
      additionalVerificationRequired: findingForm.additionalVerificationRequired, repairPotentiallyRequired: findingForm.repairPotentiallyRequired,
      createdAt: new Date().toISOString(),
    };
    setFindingsList(prev => [...prev, finding]);
    setWalkthroughZones(prev => prev.map(z => z.name === findingForm.zone ? { ...z, findingsCount: (z.findingsCount || 0) + 1 } : z));
    setFindingForm({ ...findingForm, elementLabel: '', material: '', description: '', possibleCause: '', professionalObservation: '', additionalVerificationRequired: '' });
  };`,
`  const addFinding = async () => {
    setError(null);
    if (!findingForm.elementType.trim() || !findingForm.damageType.trim()) {
      setError('Completa al menos el elemento y el tipo de daño para agregar el hallazgo.');
      return;
    }
    const finding: Finding = {
      id: \`FIND-${'${Date.now()}'}\`, elementId: \`ELEM-${'${Date.now()}'}\`, elementType: findingForm.elementType,
      elementLabel: findingForm.elementLabel.trim() || findingForm.elementType, zone: findingForm.zone, floor: findingForm.floor,
      location: findingForm.zone, material: findingForm.material, description: findingForm.description, damageType: findingForm.damageType,
      severity: findingForm.severity, possibleCause: findingForm.possibleCause, professionalObservation: findingForm.professionalObservation,
      additionalVerificationRequired: findingForm.additionalVerificationRequired, repairPotentiallyRequired: findingForm.repairPotentiallyRequired,
      createdAt: new Date().toISOString(),
    };
    const nextFindings = [...findingsList, finding];
    const nextZones = walkthroughZones.map(z => z.name === findingForm.zone ? { ...z, findingsCount: (z.findingsCount || 0) + 1 } : z);
    setFindingsList(nextFindings);
    setWalkthroughZones(nextZones);
    setFindingForm({ ...findingForm, elementLabel: '', material: '', description: '', possibleCause: '', professionalObservation: '', additionalVerificationRequired: '' });
    try {
      if (initialVisit?.id) await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep, snapshot: { ...snapshot, findingsList: nextFindings, walkthroughZones: nextZones }, userId: user?.id });
      setNotice('Hallazgo agregado y guardado remotamente.');
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'El hallazgo se agregó en pantalla, pero no pudo guardarse remotamente.');
    }
  };

  const removeFinding = async (findingId: string) => {
    const nextFindings = findingsList.filter(x => x.id !== findingId);
    const nextZones = walkthroughZones.map(z => ({ ...z, findingsCount: nextFindings.filter(f => f.zone === z.name).length }));
    setFindingsList(nextFindings);
    setWalkthroughZones(nextZones);
    try {
      if (initialVisit?.id) await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep, snapshot: { ...snapshot, findingsList: nextFindings, walkthroughZones: nextZones }, userId: user?.id });
      setNotice('Hallazgo eliminado y cambio guardado remotamente.');
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar remotamente la eliminación del hallazgo.');
    }
  };`
      );

      next = next.replace(
`  const addRepair = () => {
    if (!repairForm.elementLocation.trim() && !repairForm.repairDescription.trim()) return;
    const item: RepairItemRecord = {
      id: \`REP-${'${Date.now()}'}\`, caseId: initialVisit?.caseId || '', visitId: initialVisit?.id,
      elementLocation: repairForm.elementLocation, problem: repairForm.problem, repairDescription: repairForm.repairDescription,
      priority: repairForm.priority, estimatedQuantity: Number(repairForm.estimatedQuantity) || 1, unit: repairForm.unit as any,
      technicalSpecification: repairForm.technicalSpecification, expectedMaterials: repairForm.expectedMaterials,
      specialistRequired: repairForm.specialistRequired, clientApprovalStatus: 'PENDIENTE', createdAt: new Date().toISOString(),
    };
    setProposedRepairs(prev => [...prev, item]);
    setRepairForm({ ...repairForm, elementLocation: '', problem: '', repairDescription: '', technicalSpecification: '', expectedMaterials: '' });
  };`,
`  const addRepair = async () => {
    setError(null);
    if (!repairForm.elementLocation.trim() && !repairForm.problem.trim() && !repairForm.repairDescription.trim()) {
      setError('Completa la ubicación, el problema o la intervención propuesta antes de agregarla.');
      return;
    }
    const item: RepairItemRecord = {
      id: \`REP-${'${Date.now()}'}\`, caseId: initialVisit?.caseId || '', visitId: initialVisit?.id,
      elementLocation: repairForm.elementLocation, problem: repairForm.problem, repairDescription: repairForm.repairDescription,
      priority: repairForm.priority, estimatedQuantity: Number(repairForm.estimatedQuantity) || 1, unit: repairForm.unit as any,
      technicalSpecification: repairForm.technicalSpecification, expectedMaterials: repairForm.expectedMaterials,
      specialistRequired: repairForm.specialistRequired, clientApprovalStatus: 'PENDIENTE', createdAt: new Date().toISOString(),
    };
    const nextRepairs = [...proposedRepairs, item];
    setProposedRepairs(nextRepairs);
    setRepairForm({ ...repairForm, elementLocation: '', problem: '', repairDescription: '', technicalSpecification: '', expectedMaterials: '' });
    try {
      if (initialVisit?.id) await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep, snapshot: { ...snapshot, proposedRepairs: nextRepairs }, userId: user?.id });
      setNotice('Intervención agregada y guardada remotamente.');
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'La intervención se agregó en pantalla, pero no pudo guardarse remotamente.');
    }
  };

  const removeRepair = async (repairId: string) => {
    const nextRepairs = proposedRepairs.filter(x => x.id !== repairId);
    setProposedRepairs(nextRepairs);
    try {
      if (initialVisit?.id) await saveFieldDraftRemote({ visitId: initialVisit.id, caseId: initialVisit.caseId, currentStep, snapshot: { ...snapshot, proposedRepairs: nextRepairs }, userId: user?.id });
      setNotice('Intervención eliminada y cambio guardado remotamente.');
      window.setTimeout(() => setNotice(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar remotamente la eliminación de la intervención.');
    }
  };`
      );

      next = next.replace(
`<div className="flex items-center gap-3"><button onClick={onBackToDashboard} className="p-2 rounded-xl bg-slate-100 text-slate-600"><ArrowLeft className="w-4 h-4" /></button><div>`,
`<div className="flex items-center gap-3"><button onClick={async () => { const saved = await persistDraft(currentStep, false); if (saved) onBackToDashboard(); }} className="p-2 rounded-xl bg-slate-100 text-slate-600"><ArrowLeft className="w-4 h-4" /></button><div>`
      );

      next = next.replace(
`      <button onClick={() => persistDraft(currentStep, true)} disabled={savingDraft} className="px-3 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5">{savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar borrador</button>`,
`      <div className="flex flex-wrap justify-end gap-2"><button onClick={refreshRemoteDraft} disabled={savingDraft} className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">Actualizar remoto</button><button onClick={() => persistDraft(currentStep, true)} disabled={savingDraft} className="px-3 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5">{savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Guardar borrador</button></div>`
      );

      next = next.replace(
`<button onClick={()=>setFindingsList(prev=>prev.filter(x=>x.id!==f.id))} className="text-red-600"><Trash2 className="w-4 h-4"/></button>`,
`<button onClick={()=>removeFinding(f.id)} className="text-red-600" title="Eliminar hallazgo"><Trash2 className="w-4 h-4"/></button>`
      );

      next = next.replace(
`{proposedRepairs.map((r,i)=><div key={r.id} className="border border-slate-200 rounded-xl p-3 text-xs"><div className="font-black">{i+1}. {r.elementLocation}</div><div>{r.repairDescription}</div><div className="text-slate-500">{r.estimatedQuantity} {r.unit} · {r.priority}</div></div>)}`,
`{proposedRepairs.map((r,i)=><div key={r.id} className="border border-slate-200 rounded-xl p-3 text-xs flex justify-between gap-3"><div><div className="font-black">{i+1}. {r.elementLocation || r.problem || 'Intervención'}</div><div>{r.repairDescription}</div><div className="text-slate-500">{r.estimatedQuantity} {r.unit} · {r.priority}</div></div><button onClick={()=>removeRepair(r.id)} className="text-red-600" title="Eliminar intervención"><Trash2 className="w-4 h-4"/></button></div>)}`
      );

      return next === code ? null : { code: next, map: null };
    },
  };
}

export default defineConfig(async (env) => {
  const resolvedBase = typeof baseConfig === 'function' ? await baseConfig(env as any) : await baseConfig;
  return mergeConfig(resolvedBase as UserConfig, {
    plugins: [sipreFieldReliabilityFixes()],
  });
});
