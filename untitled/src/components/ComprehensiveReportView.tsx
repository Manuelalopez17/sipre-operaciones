import React from 'react';
import { ArrowLeft, Download, FileText, Printer, Sparkles } from 'lucide-react';
import { EvidenceMediaItem, PropertyInspection } from '../types';

interface ComprehensiveReportViewProps {
  inspection: PropertyInspection;
  evidence?: EvidenceMediaItem[];
  onBack: () => void;
}

const show = (value: any) => {
  if (value === undefined || value === null || value === '') return 'No registrado';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
};

const Field: React.FC<{ label: string; value: any; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={wide ? 'sm:col-span-2' : ''}>
    <div className="text-[10px] uppercase font-bold text-slate-500">{label}</div>
    <div className="text-xs font-semibold text-slate-900 whitespace-pre-wrap mt-0.5">{show(value)}</div>
  </div>
);

const Section: React.FC<{ number: number | string; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <section className="space-y-3 break-inside-avoid-page">
    <h2 className="text-xs font-black uppercase tracking-wide text-slate-900 bg-slate-100 p-2 border-l-4 border-teal-600">{number}. {title}</h2>
    {children}
  </section>
);

export const ComprehensiveReportView: React.FC<ComprehensiveReportViewProps> = ({ inspection, evidence = [], onBack }) => {
  const media = evidence.length ? evidence : (inspection.evidenceMedia || []);
  const photos = media.filter(m => m.mediaType === 'photo');
  const otherMedia = media.filter(m => m.mediaType !== 'photo');
  const findings = inspection.findings || [];
  const zones = inspection.walkthroughZones || [];
  const repairs = inspection.proposedRepairs || [];
  const aiFindingAnalyses = findings.filter(f => !!f.aiPreliminaryAnalysis);
  const aiPhotoAnalyses = (inspection.photos || []).filter(p => !!p.aiAnalysis);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ inspection, evidence: media }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIPRE_${inspection.id}_INFORME_COMPLETO.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <button onClick={onBack} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Volver a informes</button>
        <div className="flex gap-2"><button onClick={exportJson} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1"><Download className="w-4 h-4" />Respaldo JSON</button><button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-bold flex items-center gap-1"><Printer className="w-4 h-4" />Imprimir / Guardar PDF</button></div>
      </div>

      <article className="bg-white text-slate-900 rounded-2xl shadow-xl p-7 sm:p-10 space-y-7 print:shadow-none print:p-0 print:rounded-none">
        <header className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div><div className="flex items-center gap-2"><FileText className="w-6 h-6 text-teal-700" /><span className="font-mono text-2xl font-black tracking-wider">SIPRE</span></div><h1 className="text-lg font-black uppercase mt-1">Informe integral de inspección técnica</h1><p className="text-xs text-slate-500 mt-1">Consolidado de todos los puntos diligenciados en la visita, registro fotográfico, hallazgos, conclusiones, apoyo IA y decisión profesional.</p></div>
          <div className="text-xs sm:text-right"><div className="font-black">{inspection.id}</div><div className="text-slate-500">Visita: {inspection.visitId || 'No vinculada'}</div><div className="text-slate-500">Expediente: {inspection.caseId || 'No vinculado'}</div><div className="text-slate-500">{inspection.date} · {inspection.time}</div></div>
        </header>

        <Section number={1} title="Profesional y trazabilidad">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Profesional inspector" value={inspection.inspectorName} /><Field label="Matrícula profesional" value={inspection.professionalLicense} /><Field label="Organización" value={inspection.organization} /><Field label="Estado del registro" value={inspection.status} /></div>
        </Section>

        <Section number={2} title="Identificación del predio">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Dirección" value={inspection.address} wide /><Field label="Barrio / sector" value={inspection.neighborhood} /><Field label="Municipio" value={inspection.municipality} /><Field label="Departamento" value={inspection.department} /><Field label="Tipo de inmueble" value={inspection.propertyType} /><Field label="Apto / unidad" value={inspection.apartmentUnit} /><Field label="Torre / bloque" value={inspection.towerBlock} /><Field label="Piso / nivel" value={inspection.floorLevel} /><Field label="Número de pisos" value={inspection.buildingFloorsCount || inspection.floors} /><Field label="Área aproximada m²" value={inspection.approxAreaM2 || inspection.approximateAreaM2} /><Field label="Uso actual" value={inspection.buildingUse} /><Field label="Año de construcción aprox." value={inspection.approxConstructionYear || inspection.constructionYear} /><Field label="Ocupantes aprox." value={inspection.approxOccupants} /><Field label="GPS" value={inspection.gps ? `${inspection.gps.latitude}, ${inspection.gps.longitude}` : ''} />
          </div>
        </Section>

        <Section number={3} title="Propietario, cliente y atención de la visita">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Propietario" value={inspection.ownerName || inspection.ownerOrOccupant} /><Field label="Ocupante" value={inspection.occupantName} /><Field label="Organización / copropiedad" value={inspection.clientOrganization} /><Field label="Cédula / NIT" value={inspection.identificationNumber} /><Field label="Teléfono" value={inspection.ownerPhone} /><Field label="Correo" value={inspection.ownerEmail} /><Field label="Persona de contacto" value={inspection.contactPerson} /><Field label="Relación con el inmueble" value={inspection.relationshipWithProperty} /><Field label="Quién atendió la visita" value={inspection.whoAttendsVisit} /><Field label="Observaciones iniciales del cliente" value={inspection.professionalAssessment?.additionalComments} wide />
          </div>
        </Section>

        <Section number={4} title="Documentación técnica disponible">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Planos arquitectónicos" value={inspection.documentation?.blueprints} /><Field label="Planos estructurales" value={inspection.documentation?.structuralDesign} /><Field label="Estudio de suelos" value={inspection.documentation?.soilStudy} /><Field label="Memorias de cálculo" value={inspection.documentation?.calculationMemories} /><Field label="Licencia de construcción" value={inspection.documentation?.buildingPermit} /><Field label="Informes técnicos previos" value={inspection.documentation?.previousTechnicalReports} /><Field label="Fotografías previas" value={inspection.documentation?.preEventPhotos} /><Field label="Notas de documentación" value={inspection.documentation?.notes} wide /></div>
        </Section>

        <Section number={5} title="Caracterización estructural">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Sistema estructural" value={inspection.structuralSystem} /><Field label="Material predominante" value={inspection.predominantMaterial || inspection.primaryConstructionMaterial} /><Field label="Cimentación" value={inspection.foundationType} /><Field label="Sistema de entrepiso" value={inspection.floorSystem} /><Field label="Cubierta" value={inspection.roofType} /><Field label="Mampostería" value={inspection.masonryType} /><Field label="Modificaciones previas" value={inspection.previousStructuralModifications} wide /><Field label="Reparaciones previas" value={inspection.previousRepairs} wide /><Field label="Daños previos conocidos" value={inspection.previousDamage} wide /><Field label="Condición general" value={inspection.generalCondition || inspection.generalObservations} wide /></div>
        </Section>

        <Section number={6} title="Recorrido de inspección por zonas">
          {zones.length ? <div className="space-y-2">{zones.map(zone => <div key={zone.id} className="border border-slate-200 rounded-lg p-3"><div className="font-black text-sm">{zone.name}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"><Field label="Descripción" value={zone.description} /><Field label="Notas técnicas" value={zone.technicalNotes} /></div><div className="text-[10px] text-slate-500 mt-2">Hallazgos asociados: {zone.findingsCount || 0}</div></div>)}</div> : <p className="text-xs text-slate-500">No se registraron zonas de recorrido.</p>}
        </Section>

        <Section number={7} title={`Hallazgos técnicos (${findings.length})`}>
          {findings.length ? <div className="space-y-3">{findings.map((f, idx) => <div key={f.id || idx} className="border border-slate-200 rounded-lg p-3"><div className="font-black text-sm">Hallazgo {idx + 1}: {f.elementLabel || f.elementType}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"><Field label="Zona / piso" value={`${show(f.zone)} / ${show(f.floor)}`} /><Field label="Elemento / material" value={`${show(f.elementType)} / ${show(f.material)}`} /><Field label="Daño" value={f.damageType} /><Field label="Severidad" value={f.severity} /><Field label="Descripción" value={f.description} wide /><Field label="Posible causa" value={f.possibleCause} wide /><Field label="Observación profesional" value={f.professionalObservation || f.inspectorObservations} wide /><Field label="Verificación adicional" value={f.additionalVerificationRequired} wide /><Field label="Reparación potencial" value={f.repairPotentiallyRequired} /></div></div>)}</div> : <p className="text-xs text-slate-500">No se registraron hallazgos.</p>}
        </Section>

        <Section number={8} title={`Registro fotográfico y evidencias (${media.length})`}>
          {photos.length ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{photos.map((item, idx) => <figure key={item.id || idx} className="border border-slate-200 rounded-lg p-3 break-inside-avoid-page"><img src={item.url} alt={item.filename || `Evidencia ${idx + 1}`} className="w-full max-h-80 object-contain bg-slate-50 rounded" /><figcaption className="mt-2 text-xs"><div className="font-bold">FOTO {(idx + 1).toString().padStart(2,'0')} · {item.filename || 'Fotografía'}</div><div className="text-slate-500">{item.category} · {item.date} {item.time}</div><div className="text-slate-700 mt-1">{item.description}</div></figcaption></figure>)}</div> : <p className="text-xs text-slate-500">No hay fotografías vinculadas al registro.</p>}
          {otherMedia.length > 0 && <div className="mt-4 space-y-2">{otherMedia.map(item => <div key={item.id} className="border border-slate-200 rounded-lg p-3 text-xs"><div className="font-bold">{item.mediaType.toUpperCase()} · {item.filename || 'Archivo'}</div><div className="text-slate-500">{item.category} · {item.date} {item.time}</div><div className="mt-1">{item.description}</div><a href={item.url} target="_blank" rel="noreferrer" className="text-teal-700 underline print:hidden">Abrir evidencia</a></div>)}</div>}
        </Section>

        <Section number={9} title="Conclusiones registradas en campo">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Resumen del recorrido" value={inspection.walkthroughSummary} wide /><Field label="Resumen de hallazgos" value={inspection.mainFindingsSummary} wide /><Field label="Condición general del inmueble" value={inspection.generalPropertyCondition} wide /><Field label="Observaciones estructurales" value={inspection.structuralObservations} wide /><Field label="Observaciones de mampostería" value={inspection.masonryObservations} wide /><Field label="Observaciones no estructurales" value={inspection.nonstructuralObservations} wide /><Field label="Terreno / suelo" value={inspection.groundObservations} wide /><Field label="Causas potenciales" value={inspection.potentialCauses} wide /><Field label="Estudios adicionales" value={inspection.additionalStudiesRequired} wide /><Field label="Recomendaciones inmediatas" value={inspection.immediateRecommendations} wide /><Field label="Restricciones de acceso" value={inspection.accessRestrictionsNote} wide /><Field label="Medidas temporales" value={inspection.temporaryMeasuresNote} wide /></div>
        </Section>

        <Section number={10} title="Análisis y recomendaciones de IA">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700"><Sparkles className="w-4 h-4" />El análisis IA es apoyo técnico y se mantiene separado de la conclusión profesional.</div>
          {aiFindingAnalyses.length || aiPhotoAnalyses.length ? <div className="space-y-3">{aiFindingAnalyses.map((f, idx) => <div key={f.id || idx} className="border border-purple-200 rounded-lg p-3 text-xs"><div className="font-black">Hallazgo: {f.elementLabel}</div><Field label="Condición observada" value={f.aiPreliminaryAnalysis?.observedCondition} /><Field label="Clasificación preliminar" value={f.aiPreliminaryAnalysis?.possiblePathologyClassification} /><Field label="Causas posibles" value={(f.aiPreliminaryAnalysis?.possibleCauses || []).join('; ')} /><Field label="Verificaciones recomendadas" value={(f.aiPreliminaryAnalysis?.additionalVerificationRequired || []).join('; ')} /></div>)}{aiPhotoAnalyses.map((p, idx) => <div key={p.id || idx} className="border border-purple-200 rounded-lg p-3 text-xs"><div className="font-black">Fotografía: {p.description || p.id}</div><Field label="Condición observada" value={p.aiAnalysis?.observedCondition} /><Field label="Clasificación preliminar" value={p.aiAnalysis?.possiblePathologyClassification} /><Field label="Causas posibles" value={(p.aiAnalysis?.possibleCauses || []).join('; ')} /></div>)}</div> : <p className="text-xs text-slate-500">No hay análisis IA persistido para esta inspección.</p>}
        </Section>

        <Section number={11} title="Decisión, intervención y concepto profesional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Decisión registrada" value={inspection.repairDecision} wide /><Field label="Seguimiento requerido" value={inspection.repairFollowUpRequired} /><Field label="Fecha de seguimiento" value={inspection.repairFollowUpDate} /><Field label="Conclusión profesional" value={inspection.professionalAssessment?.conclusion} wide /><Field label="Recomendaciones profesionales" value={inspection.professionalAssessment?.immediateRecommendations} wide /><Field label="Restricciones" value={inspection.professionalAssessment?.accessRestrictions} wide /><Field label="Estabilización temporal" value={inspection.professionalAssessment?.temporaryStabilization} wide /><Field label="Evaluación estructural adicional" value={inspection.professionalAssessment?.structuralEvaluationRequired} /><Field label="Monitoreo" value={inspection.professionalAssessment?.monitoringRequired} /><Field label="Reparación requerida" value={inspection.professionalAssessment?.repairRequired} /><Field label="Recomendación de evacuación" value={inspection.professionalAssessment?.evacuationRecommendation} /></div>
          {repairs.length > 0 && <div className="mt-4"><div className="font-black text-xs uppercase mb-2">Intervenciones propuestas</div><div className="space-y-2">{repairs.map((r, idx) => <div key={r.id || idx} className="border border-slate-200 rounded-lg p-3 text-xs"><div className="font-bold">{r.elementLocation}: {r.repairDescription}</div><div className="text-slate-500 mt-1">Problema: {r.problem || 'No registrado'}</div><div className="text-slate-500">Prioridad {r.priority} · {r.estimatedQuantity} {r.unit}</div><div className="text-slate-500">Especificación: {r.technicalSpecification || 'No registrada'}</div><div className="text-slate-500">Materiales: {r.expectedMaterials || 'No registrados'}</div></div>)}</div></div>}
        </Section>

        <footer className="border-t border-slate-300 pt-5 text-xs text-slate-500"><div className="font-bold text-slate-800">Profesional responsable: {inspection.professionalAssessment?.inspectorName || inspection.inspectorName}</div><div>Matrícula: {inspection.professionalAssessment?.professionalLicense || inspection.professionalLicense || 'No registrada'}</div><div className="mt-2">Este documento consolida la información efectivamente registrada en SIPRE. Los campos no diligenciados se muestran como “No registrado”.</div></footer>
      </article>
    </div>
  );
};
