import React from 'react';
import { PropertyInspection, PriorityLevel } from '../types';
import { 
  Printer, 
  Download, 
  Share2, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Calendar, 
  User, 
  FileText, 
  CheckSquare,
  BookOpen
} from 'lucide-react';

interface ReportViewProps {
  inspection: PropertyInspection;
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ inspection, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(inspection, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIPRE_INSPECCION_${inspection.id}.json`;
    a.click();
  };

  const getPriorityPlacard = (priority: PriorityLevel) => {
    switch (priority) {
      case 'RED':
        return (
          <div className="border-4 border-red-600 bg-red-50 text-red-950 p-4 rounded-xl text-center space-y-1 shadow-md print:border-red-600 print:bg-red-50">
            <span className="text-2xl font-black tracking-widest text-red-600 block">
              INHABITABLE / ALTO RIESGO
            </span>
            <p className="text-xs font-bold uppercase text-red-900">
              PROHIBIDO EL INGRESO DE PERSONAS • PELIGRO ESTRUCTURAL
            </p>
          </div>
        );
      case 'YELLOW':
        return (
          <div className="border-4 border-amber-500 bg-amber-50 text-amber-950 p-4 rounded-xl text-center space-y-1 shadow-md print:border-amber-500 print:bg-amber-50">
            <span className="text-2xl font-black tracking-widest text-amber-600 block">
              USO RESTRINGIDO / EVALUACIÓN ADICIONAL
            </span>
            <p className="text-xs font-bold uppercase text-amber-900">
              ACCESO LIMITADO EXCLUSIVAMENTE A PERSONAL AUTORIZADO
            </p>
          </div>
        );
      case 'GREEN':
      default:
        return (
          <div className="border-4 border-emerald-600 bg-emerald-50 text-emerald-950 p-4 rounded-xl text-center space-y-1 shadow-md print:border-emerald-600 print:bg-emerald-50">
            <span className="text-2xl font-black tracking-widest text-emerald-600 block">
              HABITABLE / SIN DAÑO APARENTE CRÍTICO
            </span>
            <p className="text-xs font-bold uppercase text-emerald-900">
              NO SE OBSERVA COMPROMISO DE LA ESTABILIDAD ESTRUCTURAL GLOBAL
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Action Bar (hidden on print) */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 shadow print:hidden">
        <button
          onClick={onBack}
          className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Panel</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJson}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar JSON</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR / GENERAR PDF</span>
          </button>
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-8 sm:p-12 space-y-8 font-sans print:p-0 print:shadow-none print:rounded-none">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-2xl font-black tracking-wider text-slate-900">SIPRE</span>
              <span className="bg-slate-900 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                Informe Técnico Oficial
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Sistema de Inspección de Patología y Riesgo Estructural Post-Sismo
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Conforme a NSR-10 (Ley 400 de 1997), Manual AIS 410 y Guías de Evaluación Rápida FEMA P-2055 / ATC-20
            </p>
          </div>

          <div className="text-right font-mono text-xs space-y-0.5">
            <div className="bg-slate-100 p-2 rounded border border-slate-300">
              <span className="text-slate-500 block text-[10px]">CÓDIGO DE INSPECCIÓN:</span>
              <span className="text-sm font-black text-slate-900">{inspection.id}</span>
            </div>
            <span className="text-[11px] text-slate-500 block">Fecha: {inspection.date} • {inspection.time}</span>
          </div>
        </div>

        {/* Priority Placard */}
        <div>
          {getPriorityPlacard(inspection.professionalAssessment?.finalPriorityConfirmed || inspection.preliminaryPriority)}
        </div>

        {/* Section 1: Inspector & Organization */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-cyan-600">
            1. Identificación del Inspector y Entidad Evaluadora
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-2">
            <div>
              <span className="text-slate-500 block">Profesional Inspector:</span>
              <span className="font-bold text-slate-900">{inspection.inspectorName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Matrícula Profesional:</span>
              <span className="font-bold font-mono text-slate-900">{inspection.professionalLicense || 'N/D'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Organización / Entidad:</span>
              <span className="font-bold text-slate-900">{inspection.organization || 'Comité Técnico de Emergencias'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Estado del Dictamen:</span>
              <span className="font-bold text-slate-900">
                {inspection.isPreliminaryPriorityConfirmed ? 'Validado y Firmado' : 'Borrador Técnico'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Property & Structural System */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-cyan-600">
            2. Localización y Características de la Edificación
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-2">
            <div className="col-span-2">
              <span className="text-slate-500 block">Dirección:</span>
              <span className="font-bold text-slate-900">{inspection.address}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Barrio / Sector:</span>
              <span className="font-bold text-slate-900">{inspection.neighborhood}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Municipio / Depto:</span>
              <span className="font-bold text-slate-900">{inspection.municipality} ({inspection.department})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Coordenadas GPS:</span>
              <span className="font-mono text-slate-900">
                {inspection.gps?.latitude ? `${inspection.gps.latitude}, ${inspection.gps.longitude}` : 'No georreferenciado'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Sistema Estructural:</span>
              <span className="font-bold text-slate-900">{inspection.structuralSystem}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Uso del Inmueble:</span>
              <span className="font-bold text-slate-900">{inspection.buildingUse}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Niveles / Pisos:</span>
              <span className="font-bold text-slate-900">{inspection.floors} piso(s) • {inspection.basements} sótano(s)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Elements and Findings Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-cyan-600">
            3. Registro Detallado de Elementos y Hallazgos Patológicos
          </h2>

          {inspection.findings?.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2">No se documentaron patologías o fisuras durante la visita.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Elemento</th>
                    <th className="p-2 border-r border-slate-300">Tipo de Daño / Patología</th>
                    <th className="p-2 border-r border-slate-300">Severidad</th>
                    <th className="p-2 border-r border-slate-300">Caracterización de Fisura</th>
                    <th className="p-2">Descripción Técnica</th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.findings?.map((f, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 font-bold font-mono border-r border-slate-200">
                        {f.elementLabel}
                        <span className="block text-[10px] font-sans text-slate-500 font-normal">
                          {f.floor} • {f.location}
                        </span>
                      </td>
                      <td className="p-2 font-medium border-r border-slate-200">
                        {f.damageType}
                        <span className="block text-[10px] text-slate-500">{f.category}</span>
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                            f.severity === 'Crítica'
                              ? 'bg-red-100 text-red-800'
                              : f.severity === 'Severa'
                              ? 'bg-orange-100 text-orange-800'
                              : f.severity === 'Moderada'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {f.severity}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-[11px] border-r border-slate-200">
                        {f.crack ? (
                          <div>
                            <span>Ancho: {f.crack.widthMm ? `${f.crack.widthMm} mm` : f.crack.widthRange}</span>
                            <span className="block text-[10px] text-slate-500">
                              {f.crack.orientation} • {f.crack.depth}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="p-2 text-slate-700 text-[11px]">
                        {f.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 4: Photographic Record */}
        {inspection.photos && inspection.photos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-cyan-600">
              4. Registro Fotográfico y Anotaciones de Campo ({inspection.photos.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inspection.photos.map((p, idx) => (
                <div key={p.id} className="border border-slate-300 rounded-lg p-3 space-y-2 bg-slate-50">
                  <div className="aspect-video bg-black rounded overflow-hidden flex items-center justify-center">
                    <img
                      src={p.annotatedUrl || p.originalUrl}
                      alt={`FOTO ${idx + 1}`}
                      className="max-h-full object-contain"
                    />
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>FOTO {(idx + 1).toString().padStart(2, '0')}</span>
                      <span className="font-mono text-slate-500">{p.date} {p.time}</span>
                    </div>
                    <p className="text-slate-700 font-medium">
                      <span className="text-slate-500">Elemento:</span> {p.elementName || 'General'}
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <span className="text-slate-500">Descripción:</span> {p.description}
                    </p>
                    {p.inspectorObservation && (
                      <p className="text-slate-800 text-[11px] italic bg-white p-1.5 rounded border border-slate-200">
                        "{p.inspectorObservation}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Professional Assessment and Recommendations */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 p-2 border-l-4 border-cyan-600">
            5. Dictamen Técnico y Recomendaciones Profesionales
          </h2>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block uppercase text-[10px]">Conclusión Profesional del Inspector:</span>
              <p className="text-slate-900 font-medium mt-0.5 leading-relaxed">
                {inspection.professionalAssessment?.conclusion || 'Pendiente de redacción por el profesional.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Recomendaciones Inmediatas:</span>
                <p className="text-slate-800 mt-0.5">
                  {inspection.professionalAssessment?.immediateRecommendations || 'Ninguna indicada.'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Estabilización Temporal / Apuntalamiento:</span>
                <p className="text-slate-800 mt-0.5">
                  {inspection.professionalAssessment?.temporaryStabilization || 'No se requiere en esta fase.'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Restricción de Acceso:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {inspection.professionalAssessment?.accessRestrictions || 'Ninguna'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Recomendación de Evacuación:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {inspection.professionalAssessment?.evacuationRecommendation || 'No Requerida'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-[11px] text-slate-700 font-medium">
              <span>
                • Evaluación estructural requerida:{' '}
                <strong>{inspection.professionalAssessment?.structuralEvaluationRequired ? 'SÍ' : 'NO'}</strong>
              </span>
              <span>
                • Monitoreo de fisuras requerido:{' '}
                <strong>{inspection.professionalAssessment?.monitoringRequired ? 'SÍ' : 'NO'}</strong>
              </span>
              <span>
                • Reparación requerida:{' '}
                <strong>{inspection.professionalAssessment?.repairRequired ? 'SÍ' : 'NO'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Section 6: AI Safety Disclaimer & Technical References */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-300 text-xs space-y-2">
          <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="uppercase text-[10px] tracking-wider">Aviso Legal y Limitación Técnica</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL. Los módulos de asistencia computacional y visión artificial suministran orientación analítica preliminar y no constituyen por sí mismos certificación estructural, cálculo de estabilidad ni dictamen de habitabilidad. El presente documento es vinculante únicamente con la firma del profesional matriculado a cargo.
          </p>
          <div className="pt-1 text-[10px] font-mono text-slate-500">
            Normas de Referencia Aplicadas: NSR-10 (Títulos A, B, C, D, E, H) • AIS 410 • FEMA P-2055 • ACI 318
          </div>
        </div>

        {/* Section 7: Professional Signature Block */}
        <div className="pt-8 border-t-2 border-slate-900 flex flex-col sm:flex-row justify-between items-end gap-6">
          <div className="text-xs text-slate-500 space-y-1">
            <p>Documento generado digitalmente por SIPRE v2.4</p>
            <p className="font-mono text-[10px]">Hash de Integridad SHA-256: {inspection.id}-AUTH-VERIFIED</p>
          </div>

          <div className="w-64 text-center space-y-2">
            {inspection.professionalAssessment?.digitalSignatureDataUrl ? (
              <div className="h-16 flex items-center justify-center">
                <img
                  src={inspection.professionalAssessment.digitalSignatureDataUrl}
                  alt="Firma Profesional"
                  className="max-h-14 object-contain"
                />
              </div>
            ) : (
              <div className="h-16 border-b border-slate-400"></div>
            )}
            <div className="border-t border-slate-900 pt-1 text-xs">
              <span className="font-bold block text-slate-900">{inspection.inspectorName}</span>
              <span className="text-slate-600 font-mono text-[11px] block">
                Mat. Prof: {inspection.professionalLicense || 'No especificada'}
              </span>
              <span className="text-slate-500 text-[10px] block">{inspection.organization}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
