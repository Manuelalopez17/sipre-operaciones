import React, { useState } from 'react';
import { 
  Smartphone, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Upload, 
  Video, 
  Mic, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  PlusCircle, 
  Trash2, 
  Layers, 
  Building2, 
  FileCheck, 
  Compass, 
  Paperclip, 
  CheckSquare, 
  Square, 
  ArrowRight 
} from 'lucide-react';
import { 
  PropertyType, 
  StructuralSystem, 
  CaseDocumentation,
  BuildingElementType,
  DamageSeverity
} from '../types';

export interface FieldFindingItem {
  id: string;
  elementType: BuildingElementType | string;
  elementLabel: string;
  locationDescription: string;
  damageType: string;
  crackType: string;
  crackWidthMm: number;
  approximateLengthM: number;
  orientation: string;
  severity: DamageSeverity;
  possibleCause: string;
  professionalNotes: string;
}

interface FieldModeViewProps {
  onBackToDashboard: () => void;
  onFinalizeToTechnicalReview: () => void;
}

export const FieldModeView: React.FC<FieldModeViewProps> = ({
  onBackToDashboard,
  onFinalizeToTechnicalReview,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 8;

  // Step 1: Datos Generales
  const [generalData, setGeneralData] = useState({
    propertyType: 'Edificio' as PropertyType,
    approxArea: '450',
    floorCount: '4',
    currentUse: 'Residencial multifamiliar',
    occupantCount: '16',
    structuralSystem: 'Pórticos de Concreto Reforzado' as StructuralSystem,
    predominantMaterial: 'Concreto Reforzado',
    generalNotes: 'Estructura construida en 2012 sin ampliaciones aparentes.',
  });

  // Step 2: Documentación Disponible
  const [docs, setDocs] = useState<CaseDocumentation>({
    blueprints: 'Parciales',
    structuralDesign: 'Parcial',
    soilStudy: 'No disponible',
    calculationMemories: 'No se conoce',
    buildingPermit: 'Sí',
    notes: '',
  });

  // Step 3: Caracterización
  const [characterization, setCharacterization] = useState({
    globalCondition: 'Estructura regular en planta y alzado.',
    surroundings: 'Medianera colindante con edificio de 3 pisos al costado occidental.',
    foundationType: 'Zapatas aisladas con vigas de amarre',
    structuralHistory: 'Sismo moderado hace 2 semanas con afectación en muros divisorios.',
  });

  // Step 4 & 5: Hallazgos & Inspección
  const [findings, setFindings] = useState<FieldFindingItem[]>([
    {
      id: 'FIND-001',
      elementType: 'Columna',
      elementLabel: 'Columna C-02 (Eje B)',
      locationDescription: 'Primer Piso, Costado Occidental',
      damageType: 'Grieta / Fisura',
      crackType: 'Diagonal (Cortante)',
      crackWidthMm: 1.2,
      approximateLengthM: 0.6,
      orientation: 'Diagonal a 45°',
      severity: 'Moderada',
      possibleCause: 'Concentración de esfuerzos cortantes post-sismo',
      professionalNotes: 'Fisura diagonal con desprendimiento leve de recubrimiento.',
    }
  ]);

  const [newFinding, setNewFinding] = useState<Partial<FieldFindingItem>>({
    elementType: 'Viga',
    elementLabel: 'Viga V-101',
    locationDescription: 'Piso 1, Eje 2',
    damageType: 'Grieta / Fisura',
    crackType: 'Flexión',
    crackWidthMm: 0.5,
    approximateLengthM: 0.4,
    orientation: 'Vertical',
    severity: 'Baja',
    possibleCause: 'Flexión / Asentamiento leve',
    professionalNotes: '',
  });

  const [isAddingFinding, setIsAddingFinding] = useState(false);

  // Step 6: Evidencias
  const [aiAssistantResponse, setAiAssistantResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Step 7: Conclusiones
  const [conclusions, setConclusions] = useState({
    evidenceSummary: 'Se identificaron fisuras diagonales por cortante en columna C-2 del primer piso y fisuración en muros divisorios.',
    overallObservedCondition: 'Regular con afectaciones locales en elementos principales y mampostería.',
    attentionAspects: 'Monitoreo de ancho de grieta en columna C-2 con testigos de yeso o fisurómetro óptico.',
    additionalInfoNeeded: 'Planos estructurales definitivos y estudio de vulnerabilidad sísmica local.',
    preliminaryRecommendations: 'Instalación de apuntalamiento preventivo temporal en pórtico de eje B.',
    professionalConclusion: 'Se requiere revisión técnica formal y análisis por especialista estructural para definir la intervención.',
  });

  // Step 8: Finalizar Checklist
  const [checklist, setChecklist] = useState({
    generalDataCompleted: true,
    docsReviewed: true,
    inspectionDone: true,
    findingsRecorded: true,
    evidencesReviewed: true,
    professionalConclusionRecorded: true,
  });

  const [finalizationNotice, setFinalizationNotice] = useState<string | null>(null);

  const steps = [
    { num: 1, title: 'Datos Generales', icon: Building2 },
    { num: 2, title: 'Documentación', icon: FileCheck },
    { num: 3, title: 'Caracterización', icon: Compass },
    { num: 4, title: 'Inspección', icon: Layers },
    { num: 5, title: 'Hallazgos', icon: AlertTriangle },
    { num: 6, title: 'Evidencias', icon: Camera },
    { num: 7, title: 'Conclusiones', icon: FileText },
    { num: 8, title: 'Finalizar', icon: CheckCircle2 },
  ];

  const handleAddFindingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: FieldFindingItem = {
      id: 'FIND-' + Date.now(),
      elementType: newFinding.elementType || 'Viga',
      elementLabel: newFinding.elementLabel || 'Elemento Inspeccionado',
      locationDescription: newFinding.locationDescription || 'Ubicación en campo',
      damageType: newFinding.damageType || 'Grieta / Fisura',
      crackType: newFinding.crackType || 'Diagonal (Cortante)',
      crackWidthMm: Number(newFinding.crackWidthMm) || 0.5,
      approximateLengthM: Number(newFinding.approximateLengthM) || 0.5,
      orientation: newFinding.orientation || 'Vertical',
      severity: (newFinding.severity as DamageSeverity) || 'Moderada',
      possibleCause: newFinding.possibleCause || 'Esfuerzo mecánico post-sismo',
      professionalNotes: newFinding.professionalNotes || '',
    };

    setFindings([...findings, item]);
    setIsAddingFinding(false);
    setNewFinding({
      elementType: 'Viga',
      elementLabel: 'Viga V-102',
      locationDescription: '',
      damageType: 'Grieta / Fisura',
      crackType: 'Flexión',
      crackWidthMm: 0.5,
      approximateLengthM: 0.3,
      orientation: 'Vertical',
      severity: 'Baja',
      possibleCause: 'Flexión',
      professionalNotes: '',
    });
  };

  const handleRemoveFinding = (id: string) => {
    setFindings(findings.filter(f => f.id !== id));
  };

  const handleRunAiAssist = () => {
    setIsAiLoading(true);
    setAiAssistantResponse(null);
    setTimeout(() => {
      setIsAiLoading(false);
      setAiAssistantResponse(
        'Patrón compatible con esfuerzo cortante en zona crítica de confinamiento (NSR-10 C.21 / AIS 410). Se sugiere verificar espaciamiento de estribos y descarte de falla frágil.'
      );
    }, 900);
  };

  const handleFinalizeVisit = () => {
    setFinalizationNotice('Persistencia pendiente de habilitación.');
    setTimeout(() => {
      setFinalizationNotice(null);
      onFinalizeToTechnicalReview();
    }, 2800);
  };

  return (
    <div id="sipre-field-mode-view" className="max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between sticky top-16 z-30 backdrop-blur">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Panel Principal</span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            MODO CAMPO ACTIVO
          </span>
        </div>

        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
          Paso {currentStep} / {totalSteps}
        </span>
      </div>

      {/* Progress Stepper Bar (Touch Friendly & Horizontally Scrollable on Mobile) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl overflow-x-auto">
        <div className="flex items-center justify-between min-w-[580px] gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : isCompleted
                    ? 'bg-slate-950 text-cyan-400 border border-cyan-800/60'
                    : 'bg-slate-950/60 text-slate-500 border border-slate-800/80 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono font-bold">{s.num}</span>
                </div>
                <span className="text-[10px] font-bold mt-1 whitespace-nowrap">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mandatory Engineering Safety Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-300 flex items-center space-x-2.5">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <span className="text-[11px] leading-tight">
          <strong>Aviso Normativo:</strong> Análisis preliminar asistido por IA. Requiere verificación y firma de un profesional matriculado en ingeniería estructural.
        </span>
      </div>

      {/* STEP 1: DATOS GENERALES */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>Paso 1: Datos Generales del Inmueble</span>
            </h2>
            <p className="text-xs text-slate-400">Información básica y características de ocupación del predio</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tipo de Inmueble</label>
              <select
                value={generalData.propertyType}
                onChange={(e) => setGeneralData({ ...generalData, propertyType: e.target.value as PropertyType })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="Edificio">Edificio</option>
                <option value="Casa">Casa</option>
                <option value="Local comercial">Local comercial</option>
                <option value="Bodega">Bodega</option>
                <option value="Institucional">Institucional</option>
                <option value="Industrial">Industrial</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Área Aproximada (m²)</label>
              <input
                type="text"
                value={generalData.approxArea}
                onChange={(e) => setGeneralData({ ...generalData, approxArea: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Número de Pisos</label>
              <input
                type="number"
                value={generalData.floorCount}
                onChange={(e) => setGeneralData({ ...generalData, floorCount: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Uso Actual del Predio</label>
              <input
                type="text"
                value={generalData.currentUse}
                onChange={(e) => setGeneralData({ ...generalData, currentUse: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Número Aprox. de Ocupantes</label>
              <input
                type="number"
                value={generalData.occupantCount}
                onChange={(e) => setGeneralData({ ...generalData, occupantCount: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Sistema Estructural</label>
              <select
                value={generalData.structuralSystem}
                onChange={(e) => setGeneralData({ ...generalData, structuralSystem: e.target.value as StructuralSystem })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="Pórticos de Concreto Reforzado">Pórticos de Concreto Reforzado</option>
                <option value="Mampostería Confinada">Mampostería Confinada</option>
                <option value="Mampostería Estructural">Mampostería Estructural</option>
                <option value="Muros de Carga (Sin Confinar)">Muros de Carga (Sin Confinar)</option>
                <option value="Estructura Metálica">Estructura Metálica</option>
                <option value="Estructura Dual / Combinada">Estructura Dual / Combinada</option>
                <option value="Madera / Bahareque">Madera / Bahareque</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Material Predominante</label>
              <select
                value={generalData.predominantMaterial}
                onChange={(e) => setGeneralData({ ...generalData, predominantMaterial: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="Concreto Reforzado">Concreto Reforzado</option>
                <option value="Mampostería de Ladrillo Arcilla">Mampostería de Ladrillo Arcilla</option>
                <option value="Bloque de Concreto">Bloque de Concreto</option>
                <option value="Acero Estructural">Acero Estructural</option>
                <option value="Adobe / Tapia Pisada">Adobe / Tapia Pisada</option>
                <option value="Madera">Madera</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 text-xs">Observaciones Generales</label>
            <textarea
              rows={2}
              value={generalData.generalNotes}
              onChange={(e) => setGeneralData({ ...generalData, generalNotes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      )}

      {/* STEP 2: DOCUMENTACIÓN DISPONIBLE */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              <span>Paso 2: Documentación Disponible</span>
            </h2>
            <p className="text-xs text-slate-400">Verificación de antecedentes técnicos y planos de la edificación</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: 'blueprints', label: 'Planos Arquitectónicos y Estructurales', options: ['Sí', 'No', 'Parciales', 'No se conoce'] },
              { key: 'structuralDesign', label: 'Diseño y Memorias Estructurales', options: ['Sí', 'No', 'Parcial', 'No se conoce'] },
              { key: 'soilStudy', label: 'Estudio de Suelos / Geotécnico', options: ['Sí', 'No', 'No disponible', 'No aplica'] },
              { key: 'calculationMemories', label: 'Memorias de Cálculo', options: ['Sí', 'No', 'Parciales', 'No se conoce'] },
              { key: 'buildingPermit', label: 'Licencia de Construcción', options: ['Sí', 'No', 'No se conoce', 'No aplica'] },
            ].map((doc) => (
              <div key={doc.key} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-200">{doc.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {doc.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDocs({ ...docs, [doc.key]: opt as any })}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        (docs as any)[doc.key] === opt
                          ? 'bg-cyan-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Attach Document Buttons */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors"
            >
              <Paperclip className="w-4 h-4 text-cyan-400" />
              <span>Adjuntar Planos / PDF</span>
            </button>
            <button
              type="button"
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Fotografiar Licencia o Ficha</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CARACTERIZACIÓN */}
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Paso 3: Caracterización y Entorno</span>
            </h2>
            <p className="text-xs text-slate-400">Condición geotécnica, colindancias y tipología de cimentación</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Evaluación Global de la Estructura</label>
              <textarea
                rows={2}
                value={characterization.globalCondition}
                onChange={(e) => setCharacterization({ ...characterization, globalCondition: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Entorno del Predio y Colindancias</label>
              <textarea
                rows={2}
                value={characterization.surroundings}
                onChange={(e) => setCharacterization({ ...characterization, surroundings: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tipo de Cimentación Observada o Estimada</label>
              <input
                type="text"
                value={characterization.foundationType}
                onChange={(e) => setCharacterization({ ...characterization, foundationType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Antecedentes Estructurales y Eventos Sísmicos</label>
              <textarea
                rows={2}
                value={characterization.structuralHistory}
                onChange={(e) => setCharacterization({ ...characterization, structuralHistory: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: INSPECCIÓN DE COMPONENTES */}
      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Paso 4: Inspección de Componentes</span>
              </h2>
              <p className="text-xs text-slate-400">Verificación por zonas: estructurales, mampostería y fachadas</p>
            </div>

            <button
              onClick={() => setCurrentStep(5)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ AGREGAR HALLAZGO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { title: 'Elementos Estructurales', desc: 'Columnas, vigas, nudos, losas y muros portantes', status: 'Revisado', color: 'text-amber-400' },
              { title: 'Mampostería y Muros', desc: 'Muros divisorios, antepechos y confinamientos', status: 'Revisado', color: 'text-cyan-400' },
              { title: 'Elementos No Estructurales', desc: 'Cielorrasos, particiones, vidriería y acabados', status: 'Revisado', color: 'text-slate-300' },
              { title: 'Terreno y Cimientos', desc: 'Asentamientos, grietas en suelo o taludes', status: 'Revisado', color: 'text-slate-300' },
              { title: 'Cubierta y Techos', desc: 'Cerchas, vigas de techo y bajantes', status: 'Revisado', color: 'text-slate-300' },
              { title: 'Fachadas y Balcones', desc: 'Fisuras exteriores y voladizos', status: 'Revisado', color: 'text-slate-300' },
              { title: 'Instalaciones', desc: 'Tuberías de gas, sanitarias y cableado eléctrico', status: 'Revisado', color: 'text-slate-300' },
            ].map((elem, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className={`font-bold ${elem.color}`}>{elem.title}</h3>
                  <p className="text-[11px] text-slate-400">{elem.desc}</p>
                </div>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  OK
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: HALLAZGOS PATOLÓGICOS DETALLADOS */}
      {currentStep === 5 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Paso 5: Registro Detallado de Hallazgos</span>
              </h2>
              <p className="text-xs text-slate-400">Patologías registradas con dimensión, causa y severidad preliminar</p>
            </div>

            <button
              onClick={() => setIsAddingFinding(!isAddingFinding)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAddingFinding ? 'Cerrar Formulario' : '+ Nuevo Hallazgo'}</span>
            </button>
          </div>

          {/* Form to add a new finding */}
          {isAddingFinding && (
            <form onSubmit={handleAddFindingSubmit} className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-3 text-xs">
              <h3 className="font-bold text-white text-xs">Formulario de Patología / Grieta</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Elemento Afectado</label>
                  <select
                    value={newFinding.elementType}
                    onChange={(e) => setNewFinding({ ...newFinding, elementType: e.target.value as BuildingElementType })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                  >
                    <option value="Columna">Columna</option>
                    <option value="Viga">Viga</option>
                    <option value="Muro Estructural">Muro Estructural</option>
                    <option value="Muro de Mampostería">Muro de Mampostería</option>
                    <option value="Losa / Entrepiso">Losa / Entrepiso</option>
                    <option value="Cimentación">Cimentación</option>
                    <option value="Fachada">Fachada</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Referencia / Eje</label>
                  <input
                    type="text"
                    placeholder="Ej: Columna C-02 Eje B"
                    value={newFinding.elementLabel || ''}
                    onChange={(e) => setNewFinding({ ...newFinding, elementLabel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Grieta</label>
                  <select
                    value={newFinding.crackType}
                    onChange={(e) => setNewFinding({ ...newFinding, crackType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                  >
                    <option value="Diagonal (Cortante)">Diagonal (Cortante)</option>
                    <option value="Flexión">Flexión</option>
                    <option value="Vertical">Vertical</option>
                    <option value="Horizontal">Horizontal</option>
                    <option value="Escalonada">Escalonada</option>
                    <option value="Asentamiento">Asentamiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Ancho de Grieta (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 1.5"
                    value={newFinding.crackWidthMm || ''}
                    onChange={(e) => setNewFinding({ ...newFinding, crackWidthMm: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Severidad Preliminar</label>
                  <select
                    value={newFinding.severity}
                    onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value as DamageSeverity })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-bold"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Severa">Severa</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Posible Causa</label>
                  <input
                    type="text"
                    placeholder="Ej: Concentración de cortante post-sismo"
                    value={newFinding.possibleCause || ''}
                    onChange={(e) => setNewFinding({ ...newFinding, possibleCause: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observación Profesional</label>
                <textarea
                  rows={2}
                  placeholder="Detalle técnico de la fisura observada..."
                  value={newFinding.professionalNotes || ''}
                  onChange={(e) => setNewFinding({ ...newFinding, professionalNotes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingFinding(false)}
                  className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 text-white px-4 py-1.5 rounded-lg font-bold"
                >
                  Guardar Hallazgo
                </button>
              </div>
            </form>
          )}

          {/* List of registered findings */}
          <div className="space-y-3">
            {findings.map((f, idx) => (
              <div key={f.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      #{idx + 1} {f.elementLabel}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      f.severity === 'Severa' || f.severity === 'Crítica'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {f.severity}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFinding(f.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tipo de Daño:</span>
                    <span>{f.crackType || f.damageType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Ancho / Longitud:</span>
                    <span className="font-mono font-bold">{f.crackWidthMm} mm / {f.approximateLengthM} m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Orientación:</span>
                    <span>{f.orientation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Causa Estimada:</span>
                    <span>{f.possibleCause}</span>
                  </div>
                </div>

                <p className="text-slate-400 bg-slate-900/60 p-2 rounded-lg text-[11px]">
                  <strong>Notas:</strong> {f.professionalNotes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: EVIDENCIAS MULTIMEDIA & ASISTENCIA IA */}
      {currentStep === 6 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <span>Paso 6: Evidencias Multimedia y Asistencia Técnica</span>
            </h2>
            <p className="text-xs text-slate-400">Captura de fotografías, notas de voz, video y consulta de patrones</p>
          </div>

          {/* Quick Capture Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 p-4 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors">
              <Camera className="w-6 h-6 text-cyan-400" />
              <span>TOMAR FOTO</span>
            </button>
            <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 p-4 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors">
              <Upload className="w-6 h-6 text-blue-400" />
              <span>SUBIR FOTO</span>
            </button>
            <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 p-4 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors">
              <Video className="w-6 h-6 text-purple-400" />
              <span>GRABAR VIDEO</span>
            </button>
            <button className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 p-4 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors">
              <Mic className="w-6 h-6 text-emerald-400" />
              <span>NOTA DE VOZ</span>
            </button>
          </div>

          {/* AI Assistance Hook Box */}
          <div className="bg-slate-950 border border-cyan-900/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-bold text-xs text-white">Asistente de Patología Estructural</h3>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Consulta de orientación normativa preliminar sobre patrones de daño (AIS 410 / NSR-10).
            </p>

            <button
              onClick={handleRunAiAssist}
              disabled={isAiLoading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Analizando patrón...' : 'Generar Análisis Preliminar de Hallazgos'}</span>
            </button>

            {aiAssistantResponse && (
              <div className="p-3.5 rounded-lg bg-slate-900 border border-cyan-800/80 text-xs text-cyan-200 space-y-2 mt-2">
                <p className="font-mono text-[11px] leading-relaxed">{aiAssistantResponse}</p>
                <div className="text-[10px] text-amber-400 font-bold border-t border-slate-800 pt-1.5 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 7: CONCLUSIONES TÉCNICAS */}
      {currentStep === 7 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Paso 7: Conclusiones y Recomendaciones</span>
            </h2>
            <p className="text-xs text-slate-400">Síntesis técnica del estado de la edificación y medidas preventivas</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Resumen de lo Evidenciado</label>
              <textarea
                rows={2}
                value={conclusions.evidenceSummary}
                onChange={(e) => setConclusions({ ...conclusions, evidenceSummary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Condición General Observada</label>
              <input
                type="text"
                value={conclusions.overallObservedCondition}
                onChange={(e) => setConclusions({ ...conclusions, overallObservedCondition: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Aspectos que Requieren Atención Prioritaria</label>
              <textarea
                rows={2}
                value={conclusions.attentionAspects}
                onChange={(e) => setConclusions({ ...conclusions, attentionAspects: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Recomendaciones Preliminares de Seguridad</label>
              <textarea
                rows={2}
                value={conclusions.preliminaryRecommendations}
                onChange={(e) => setConclusions({ ...conclusions, preliminaryRecommendations: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Conclusión del Profesional Evaluador</label>
              <textarea
                rows={3}
                value={conclusions.professionalConclusion}
                onChange={(e) => setConclusions({ ...conclusions, professionalConclusion: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: FINALIZAR VISITA & CIERRE */}
      {currentStep === 8 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Paso 8: Finalizar Visita Técnica</span>
            </h2>
            <p className="text-xs text-slate-400">Verificación de checklist y transferencia a Revisión Técnica</p>
          </div>

          {finalizationNotice && (
            <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 font-bold text-center flex items-center justify-center space-x-2 animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>{finalizationNotice}</span>
            </div>
          )}

          {/* Checklist before finalization */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-2">
              Lista de Chequeo Obligatoria
            </h3>

            {[
              { key: 'generalDataCompleted', label: 'Datos generales del inmueble completos' },
              { key: 'docsReviewed', label: 'Documentación técnica y antecedentes revisados' },
              { key: 'inspectionDone', label: 'Inspección de componentes realizada' },
              { key: 'findingsRecorded', label: 'Hallazgos patológicos registrados y tipificados' },
              { key: 'evidencesReviewed', label: 'Evidencias fotográficas y notas de campo consolidadas' },
              { key: 'professionalConclusionRecorded', label: 'Conclusión técnica profesional registrada' },
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => setChecklist({ ...checklist, [item.key]: !(checklist as any)[item.key] })}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors"
              >
                {(checklist as any)[item.key] ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-600 flex-shrink-0" />
                )}
                <span className={`font-medium ${(checklist as any)[item.key] ? 'text-slate-200' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Next Stage Indicator */}
          <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Siguiente Etapa Operativa</span>
              <span className="text-white font-bold text-sm">PENDIENTE DE REVISIÓN TÉCNICA</span>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </div>

          {/* Finalize Button */}
          <button
            onClick={handleFinalizeVisit}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-sm font-black tracking-wide shadow-xl shadow-emerald-600/30 transition-all active:scale-98 flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>FINALIZAR VISITA TÉCNICA</span>
          </button>
        </div>
      )}

      {/* Bottom Step Navigation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="text-xs font-bold text-slate-400 font-mono">
          {currentStep} de {totalSteps}
        </span>

        <button
          onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
          disabled={currentStep === totalSteps}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow active:scale-95"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
