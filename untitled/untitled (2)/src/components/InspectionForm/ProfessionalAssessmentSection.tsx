import React, { useState, useRef } from 'react';
import { ProfessionalAssessment, PriorityLevel } from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Lock, 
  PenTool, 
  Trash2, 
  Save, 
  FileCheck,
  Building,
  UserCheck
} from 'lucide-react';

interface ProfessionalAssessmentSectionProps {
  assessment: ProfessionalAssessment;
  preliminaryPriority: PriorityLevel;
  isConfirmed: boolean;
  onUpdateAssessment: (updated: ProfessionalAssessment, confirmed: boolean) => void;
  inspectorName: string;
  professionalLicense: string;
  organization: string;
}

export const ProfessionalAssessmentSection: React.FC<ProfessionalAssessmentSectionProps> = ({
  assessment,
  preliminaryPriority,
  isConfirmed,
  onUpdateAssessment,
  inspectorName,
  professionalLicense,
  organization,
}) => {
  const [formData, setFormData] = useState<ProfessionalAssessment>({
    ...assessment,
    inspectorName: assessment.inspectorName || inspectorName,
    professionalLicense: assessment.professionalLicense || professionalLicense,
    organization: assessment.organization || organization,
    date: assessment.date || new Date().toISOString().split('T')[0],
    finalPriorityConfirmed: assessment.finalPriorityConfirmed || preliminaryPriority || 'YELLOW',
  });

  const [confirmed, setConfirmed] = useState<boolean>(isConfirmed);

  // Digital Signature Canvas
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string | undefined>(assessment.digitalSignatureDataUrl);

  const handlePrioritySelect = (p: PriorityLevel) => {
    setFormData((prev) => ({ ...prev, finalPriorityConfirmed: p }));
  };

  const handleFieldChange = (field: keyof ProfessionalAssessment, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Signature drawing handlers
  const startDrawingSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsSigning(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isSigning) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0284c7';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingSignature = () => {
    if (!isSigning) return;
    setIsSigning(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setSignatureData(dataUrl);
      setFormData((prev) => ({ ...prev, digitalSignatureDataUrl: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureData(undefined);
    setFormData((prev) => ({ ...prev, digitalSignatureDataUrl: undefined }));
  };

  const handleSaveAndConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.conclusion.trim()) {
      alert('La conclusión profesional es obligatoria antes de emitir la evaluación final.');
      return;
    }

    const updated = {
      ...formData,
      confirmedByProfessional: confirmed,
    };
    onUpdateAssessment(updated, confirmed);
    alert('Concepto profesional y clasificación guardados exitosamente.');
  };

  return (
    <form onSubmit={handleSaveAndConfirm} className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
      
      {/* Section Title */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Concepto Técnico y Evaluación Profesional de Habitabilidad</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Solo un profesional matriculado e inspector autorizado puede emitir y aprobar el dictamen final.
          </p>
        </div>
      </div>

      {/* Priority Selection Cards (Green / Yellow / Red) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Clasificación de Prioridad y Habitabilidad Post-Sismo (Etiqueta Oficial)
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* VERDE */}
          <div
            onClick={() => handlePrioritySelect('GREEN')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.finalPriorityConfirmed === 'GREEN'
                ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-sm font-bold text-emerald-400">VERDE - HABITABLE</h3>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Sin daño significativo aparente en elementos estructurales portantes. Capacidad sismorresistente no comprometida.
            </p>
          </div>

          {/* AMARILLO */}
          <div
            onClick={() => handlePrioritySelect('YELLOW')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.finalPriorityConfirmed === 'YELLOW'
                ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500"></span>
              <h3 className="text-sm font-bold text-amber-400">AMARILLO - USO RESTRINGIDO</h3>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Daño moderado o peligro localizado. Requiere evaluación estructural detallada y/o apuntalamiento preventivo.
            </p>
          </div>

          {/* ROJO */}
          <div
            onClick={() => handlePrioritySelect('RED')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              formData.finalPriorityConfirmed === 'RED'
                ? 'bg-red-950/60 border-red-500 ring-2 ring-red-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse"></span>
              <h3 className="text-sm font-bold text-red-400">ROJO - INHABITABLE / ALTO RIESGO</h3>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Daño estructural severo o riesgo inminente de colapso local/global. Prohibido el ingreso de personas.
            </p>
          </div>

        </div>

        {!confirmed && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-amber-500/40 text-xs text-amber-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-semibold">Clasificación pendiente de confirmación profesional por el inspector matriculado.</span>
          </div>
        )}
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Professional Conclusion */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Conclusión y Diagnóstico Profesional del Inspector *
          </label>
          <textarea
            required
            rows={3}
            value={formData.conclusion}
            onChange={(e) => handleFieldChange('conclusion', e.target.value)}
            placeholder="Sintetice el comportamiento estructural observado, daños críticos identificados y concepto técnico de seguridad..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Immediate Recommendations */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Recomendaciones Inmediatas
          </label>
          <textarea
            rows={3}
            value={formData.immediateRecommendations}
            onChange={(e) => handleFieldChange('immediateRecommendations', e.target.value)}
            placeholder="Ej. Delimitación de perímetro con cinta de peligro a 5 metros..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Temporary Stabilization Recommendations */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Recomendaciones de Estabilización Temporal / Apuntalamiento
          </label>
          <textarea
            rows={3}
            value={formData.temporaryStabilization}
            onChange={(e) => handleFieldChange('temporaryStabilization', e.target.value)}
            placeholder="Ej. Apuntalamiento telescópico de viga V-102 en el primer nivel..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Access Restrictions */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Restricción de Acceso al Inmueble
          </label>
          <select
            value={formData.accessRestrictions}
            onChange={(e) => handleFieldChange('accessRestrictions', e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="Ninguna">Ninguna (Acceso Libre)</option>
            <option value="Acceso Restringido Parcial">Acceso Restringido Parcial (Solo áreas seguras)</option>
            <option value="Prohibido el Ingreso">Prohibido el Ingreso (Peligro de Colapso)</option>
          </select>
        </div>

        {/* Evacuation Recommendation */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Recomendación de Evacuación
          </label>
          <select
            value={formData.evacuationRecommendation}
            onChange={(e) => handleFieldChange('evacuationRecommendation', e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="No Requerida">No Requerida</option>
            <option value="Evacuación Preventiva Parcial">Evacuación Preventiva Parcial</option>
            <option value="Evacuación Total Inmediata">Evacuación Total Inmediata</option>
          </select>
        </div>

        {/* Binary Decision Toggles */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.structuralEvaluationRequired}
              onChange={(e) => handleFieldChange('structuralEvaluationRequired', e.target.checked)}
              className="w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-700 focus:ring-cyan-500"
            />
            <span className="text-xs text-slate-200 font-semibold">¿Requiere Evaluación Estructural Detallada?</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.monitoringRequired}
              onChange={(e) => handleFieldChange('monitoringRequired', e.target.checked)}
              className="w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-700 focus:ring-cyan-500"
            />
            <span className="text-xs text-slate-200 font-semibold">¿Requiere Monitoreo de Fisuras / Asentamiento?</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.repairRequired}
              onChange={(e) => handleFieldChange('repairRequired', e.target.checked)}
              className="w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-700 focus:ring-cyan-500"
            />
            <span className="text-xs text-slate-200 font-semibold">¿Requiere Obras de Reparación / Refuerzo?</span>
          </label>

        </div>

        {/* Additional Studies */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Estudios Adicionales Requeridos
          </label>
          <input
            type="text"
            value={formData.additionalStudiesRequired}
            onChange={(e) => handleFieldChange('additionalStudiesRequired', e.target.value)}
            placeholder="Ej. Extracción de núcleos de concreto, ensayo de ultrasonido, estudio geotécnico de ladera..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

      </div>

      {/* Professional Signature & Confirmation Block */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <PenTool className="w-4 h-4 text-cyan-400" />
          <span>Firma y Datos de Acreditación del Profesional Inspector</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Nombre del Profesional:</span>
            <input
              type="text"
              value={formData.inspectorName}
              onChange={(e) => handleFieldChange('inspectorName', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
            />
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Matrícula Profesional / Licencia:</span>
            <input
              type="text"
              value={formData.professionalLicense}
              onChange={(e) => handleFieldChange('professionalLicense', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
            />
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Organización / Entidad:</span>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => handleFieldChange('organization', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
            />
          </div>
        </div>

        {/* Digital Signature Canvas Pad */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold">Firma Digital del Profesional:</span>
            <button
              type="button"
              onClick={clearSignature}
              className="text-[11px] text-slate-400 hover:text-red-400 flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar firma</span>
            </button>
          </div>

          <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-1 flex items-center justify-center">
            {signatureData ? (
              <div className="relative w-full h-32 flex items-center justify-center bg-slate-950 rounded-lg">
                <img src={signatureData} alt="Firma Profesional" className="max-h-28 object-contain" />
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute top-2 right-2 bg-slate-800 text-xs text-slate-300 px-2 py-1 rounded"
                >
                  Volver a firmar
                </button>
              </div>
            ) : (
              <canvas
                ref={signatureCanvasRef}
                width={500}
                height={120}
                onMouseDown={startDrawingSignature}
                onMouseMove={drawSignature}
                onMouseUp={stopDrawingSignature}
                onTouchStart={startDrawingSignature}
                onTouchMove={drawSignature}
                onTouchEnd={stopDrawingSignature}
                className="w-full h-32 cursor-crosshair bg-slate-950 rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Mandatory Confirmation Checkbox */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-700 mt-0.5"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              Certifico en calidad de profesional competente que he realizado la inspección de campo y que el dictamen, conclusiones y recomendaciones reflejan mi juicio técnico independiente conforme a las normas vigentes.
            </span>
          </label>
        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/30 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>GUARDAR Y VALIDAR CONCEPTO PROFESIONAL</span>
        </button>
      </div>

    </form>
  );
};
