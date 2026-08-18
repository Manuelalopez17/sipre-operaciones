import React, { useState } from 'react';
import { 
  Finding, 
  BuildingElement, 
  SeverityLevel, 
  DamageCategory, 
  CrackWidthRange, 
  CrackOrientation, 
  CrackDepth, 
  CrackActivity,
  PhotoMetadata
} from '../../types';
import { 
  AlertOctagon, 
  Plus, 
  Trash2, 
  Camera, 
  Sparkles, 
  Ruler, 
  CheckSquare, 
  AlertTriangle, 
  Check, 
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';

interface FindingsSectionProps {
  findings: Finding[];
  elements: BuildingElement[];
  onAddFinding: (finding: Finding) => void;
  onUpdateFinding: (finding: Finding) => void;
  onDeleteFinding: (findingId: string) => void;
  onOpenPhotoModal: (elementId?: string, elementName?: string, findingId?: string) => void;
  onOpenAIAssistant: (finding: Finding) => void;
}

export const FindingsSection: React.FC<FindingsSectionProps> = ({
  findings,
  elements,
  onAddFinding,
  onUpdateFinding,
  onDeleteFinding,
  onOpenPhotoModal,
  onOpenAIAssistant,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string>(elements[0]?.id || '');
  const [damageCategory, setDamageCategory] = useState<DamageCategory>('Estructural');
  const [damageType, setDamageType] = useState<string>('Fisuración diagonal por cortante');
  const [severity, setSeverity] = useState<SeverityLevel>('Moderada');
  const [location, setLocation] = useState<string>('');
  const [floor, setFloor] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [immediateHazard, setImmediateHazard] = useState<boolean>(false);

  // Crack module fields
  const [isCrackFinding, setIsCrackFinding] = useState<boolean>(false);
  const [crackWidthMm, setCrackWidthMm] = useState<number | undefined>(undefined);
  const [crackWidthRange, setCrackWidthRange] = useState<CrackWidthRange>('< 0.1 mm');
  const [crackLengthCm, setCrackLengthCm] = useState<number | undefined>(undefined);
  const [crackOrientation, setCrackOrientation] = useState<CrackOrientation>('Diagonal');
  const [crackDepth, setCrackDepth] = useState<CrackDepth>('Superficial');
  const [crackCrossesElement, setCrackCrossesElement] = useState<boolean>(false);
  const [crackActivity, setCrackActivity] = useState<CrackActivity>('Activa');

  // Specific Checklist states
  const [activeChecklist, setActiveChecklist] = useState<string[]>([]);

  const selectedElement = elements.find((e) => e.id === selectedElementId);

  // Checklist templates based on element
  const getChecklistOptions = (category: DamageCategory) => {
    if (category === 'Estructural') {
      return [
        'Fisuración diagonal a 45° (Cortante)',
        'Fisuración por flexión en zonas de momento máximo',
        'Desprendimiento de recubrimiento (Spalling)',
        'Aplastamiento del concreto (Crushing)',
        'Acero de refuerzo expuesto',
        'Pandeo del refuerzo longitudinal',
        'Deformación permanente residual',
        'Falla en unión viga-columna (Nudo)',
        'Desplazamiento relativo entre niveles',
        'Corrosión de armaduras',
        'Fisuración escalonada en mampostería',
        'Separación entre muro y pórtico',
        'Punzonamiento en losa',
        'Pérdida de apoyo o asiento en viga',
      ];
    } else if (category === 'Geotécnico / Suelo') {
      return [
        'Grietas en el terreno circundante',
        'Asentamiento diferencial evidente',
        'Hundimiento / Subsidencia',
        'Deslizamiento / Inestabilidad de ladera',
        'Erosión severa en apoyos',
        'Evidencia de licuación de suelos',
        'Desprendimiento de rocas',
        'Exposición y socavación de zapatas',
      ];
    } else {
      return [
        'Colapso o daño severo en fachada',
        'Agrietamiento o desprendimiento de antepecho / parapeto',
        'Caída de cielo raso / paneles de yeso',
        'Rotura de vidriería y ventanales',
        'Desprendimiento de luminarias / cielos pesados',
        'Desanclaje de equipos mecánicos / tanques',
        'Ruptura de tuberías de gas o agua',
        'Deformación y desprendimiento de tabiques divisorios',
        'Falla en barandas / pasamanos',
      ];
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedElementId) {
      alert('Debes seleccionar o crear al menos un elemento primero.');
      return;
    }

    const elem = elements.find((e) => e.id === selectedElementId);

    const newFinding: Finding = {
      id: 'FIND-' + Date.now(),
      elementId: selectedElementId,
      elementLabel: elem?.label || 'Elemento',
      elementType: elem?.type || 'Columna de Concreto',
      category: damageCategory,
      damageType: damageType || 'Daño estructural general',
      severity,
      floor: floor || elem?.floor || 'Piso 1',
      location: location || elem?.location || 'General',
      description: description || damageType,
      checklistTags: activeChecklist,
      crack: isCrackFinding
        ? {
            widthMm: crackWidthMm,
            widthRange: crackWidthRange,
            lengthCm: crackLengthCm,
            orientation: crackOrientation,
            depth: crackDepth,
            crossesElement: crackCrossesElement,
            activity: crackActivity,
          }
        : undefined,
      immediateHazard,
      photoIds: [],
    };

    onAddFinding(newFinding);
    setDescription('');
    setActiveChecklist([]);
    setIsAdding(false);
  };

  const toggleChecklistTag = (tag: string) => {
    setActiveChecklist((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <AlertOctagon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">
            Hallazgos Patológicos y Daños Identificados ({findings.length})
          </h2>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              if (elements.length === 0) {
                alert('Registra primero un elemento en la sección de Elementos.');
                return;
              }
              setIsAdding(true);
            }}
            className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>REGISTRAR HALLAZGO</span>
          </button>
        )}
      </div>

      {/* Inline Creation Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-950 p-5 rounded-xl border border-cyan-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Nuevo Registro de Daño / Fisura
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Target Element */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Elemento Afectado *
              </label>
              <select
                value={selectedElementId}
                onChange={(e) => {
                  setSelectedElementId(e.target.value);
                  const found = elements.find((elem) => elem.id === e.target.value);
                  if (found) {
                    setDamageCategory(found.category);
                    setFloor(found.floor);
                    setLocation(found.location);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {elements.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.label} ({el.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Severidad del Daño *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="Baja" className="text-emerald-400">Baja (Daño leve / estético)</option>
                <option value="Moderada" className="text-amber-400">Moderada (Atención requerida)</option>
                <option value="Severa" className="text-orange-400">Severa (Capacidad comprometida)</option>
                <option value="Crítica" className="text-red-400">Crítica (Riesgo inminente de falla)</option>
              </select>
            </div>

            {/* Damage Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Categoría del Daño
              </label>
              <select
                value={damageCategory}
                onChange={(e) => setDamageCategory(e.target.value as DamageCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Estructural">Estructural</option>
                <option value="No Estructural">No Estructural</option>
                <option value="Geotécnico / Suelo">Geotécnico / Suelo</option>
              </select>
            </div>

            {/* Damage Type Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tipo / Patología Principal *
              </label>
              <input
                type="text"
                required
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                placeholder="Fisuración diagonal por cortante..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

          </div>

          {/* Specialized Structural Damage Checklist Pills */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-300">
              Lista de Chequeo Estructural Especializada ({damageCategory}):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {getChecklistOptions(damageCategory).map((item) => {
                const isSelected = activeChecklist.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleChecklistTag(item)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crack Measurement Module */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCrackFinding}
                  onChange={(e) => setIsCrackFinding(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded bg-slate-950 border-slate-700"
                />
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1">
                  <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Módulo de Medición y Caracterización de Fisuras</span>
                </span>
              </label>
            </div>

            {isCrackFinding && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Ancho Medido con Calibrador (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={crackWidthMm || ''}
                    onChange={(e) => setCrackWidthMm(parseFloat(e.target.value) || undefined)}
                    placeholder="Ej. 0.8"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Rango de Ancho Normalizado
                  </label>
                  <select
                    value={crackWidthRange}
                    onChange={(e) => setCrackWidthRange(e.target.value as CrackWidthRange)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="< 0.1 mm">&lt; 0.1 mm (Microfisura)</option>
                    <option value="0.1 - 0.3 mm">0.1 - 0.3 mm (Fisura fina)</option>
                    <option value="0.3 - 0.5 mm">0.3 - 0.5 mm (Fisura moderada)</option>
                    <option value="0.5 - 1.0 mm">0.5 - 1.0 mm (Fisura considerable)</option>
                    <option value="1.0 - 3.0 mm">1.0 - 3.0 mm (Grieta importante)</option>
                    <option value="> 3.0 mm">&gt; 3.0 mm (Grieta severa / Falla)</option>
                    <option value="No medido">No medido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Orientación de la Fisura
                  </label>
                  <select
                    value={crackOrientation}
                    onChange={(e) => setCrackOrientation(e.target.value as CrackOrientation)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Diagonal">Diagonal (~45°)</option>
                    <option value="Horizontal">Horizontal</option>
                    <option value="Vertical">Vertical</option>
                    <option value="Escalonada">Escalonada (Juntas)</option>
                    <option value="Radial">Radial</option>
                    <option value="Longitudinal">Longitudinal</option>
                    <option value="Transversal">Transversal</option>
                    <option value="Irregular">Irregular / En mapa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Longitud Aprox. (cm)
                  </label>
                  <input
                    type="number"
                    value={crackLengthCm || ''}
                    onChange={(e) => setCrackLengthCm(parseFloat(e.target.value) || undefined)}
                    placeholder="Ej. 45"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Profundidad Estimada
                  </label>
                  <select
                    value={crackDepth}
                    onChange={(e) => setCrackDepth(e.target.value as CrackDepth)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Superficial">Superficial (Solo revoque/recubrimiento)</option>
                    <option value="Profunda">Profunda (Alcanza el núcleo)</option>
                    <option value="Pasante / Atraviesa">Pasante / Atraviesa el elemento</option>
                    <option value="No determinado">No determinado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Estado de Actividad
                  </label>
                  <select
                    value={crackActivity}
                    onChange={(e) => setCrackActivity(e.target.value as CrackActivity)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Activa">Activa / Viva (Requiere testigo)</option>
                    <option value="Inactiva">Inactiva / Muerta</option>
                    <option value="No determinado">No determinado</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center pt-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={crackCrossesElement}
                      onChange={(e) => setCrackCrossesElement(e.target.checked)}
                      className="w-4 h-4 text-red-500 rounded bg-slate-950 border-slate-700"
                    />
                    <span className="text-xs text-red-300 font-semibold">
                      ¿La fisura atraviesa completamente la sección transversal del elemento?
                    </span>
                  </label>
                </div>

              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400">
              Descripción Detallada del Hallazgo
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el patrón de daño, desprendimientos, exposición de armadura, afectación a elementos vecinos..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Immediate Hazard Checkbox */}
          <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50 flex items-center justify-between">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={immediateHazard}
                onChange={(e) => setImmediateHazard(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded bg-slate-950 border-red-800"
              />
              <span className="text-xs font-bold text-red-300">
                Peligro Inminente Localizado (Riesgo de colapso local o caída de objetos)
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Hallazgo</span>
            </button>
          </div>
        </form>
      )}

      {/* Findings List */}
      {findings.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-300 font-semibold">No se han registrado hallazgos patológicos.</p>
          <p className="text-[11px] text-slate-500">Documenta fisuras, aplastamiento, pandeo de refuerzo o daños no estructurales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {findings.map((f) => {
            const isSevereOrCritical = f.severity === 'Severa' || f.severity === 'Crítica';
            return (
              <div
                key={f.id}
                className={`bg-slate-950 border rounded-xl p-4 space-y-3 transition-all ${
                  isSevereOrCritical ? 'border-red-900/60 shadow-md' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {f.elementLabel}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        f.severity === 'Crítica'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : f.severity === 'Severa'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : f.severity === 'Moderada'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      Severidad: {f.severity}
                    </span>
                    {f.immediateHazard && (
                      <span className="text-[10px] bg-red-900/80 text-white font-bold px-2 py-0.5 rounded border border-red-700 animate-pulse">
                        PELIGRO INMINENTE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Attach Photo button */}
                    <button
                      onClick={() => onOpenPhotoModal(f.elementId, f.elementLabel, f.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Tomar o adjuntar fotografía con anotaciones"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Foto ({f.photoIds?.length || 0})</span>
                    </button>

                    {/* AI Assistant button */}
                    <button
                      onClick={() => onOpenAIAssistant(f)}
                      className="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Consultar asistente de ingeniería IA para este hallazgo"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Analizar IA</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este hallazgo patológico?')) {
                          onDeleteFinding(f.id);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar hallazgo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Finding Title & Description */}
                <div>
                  <h4 className="text-xs font-bold text-cyan-300">{f.damageType}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{f.description}</p>
                </div>

                {/* Crack parameters summary if present */}
                {f.crack && (
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 font-mono">
                    <div>
                      <span className="text-slate-500 block">Ancho:</span>
                      <span className="text-white font-bold">{f.crack.widthMm ? `${f.crack.widthMm} mm` : f.crack.widthRange}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Orientación:</span>
                      <span>{f.crack.orientation}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Profundidad:</span>
                      <span>{f.crack.depth}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Actividad:</span>
                      <span className={f.crack.activity === 'Activa' ? 'text-amber-400 font-bold' : ''}>{f.crack.activity}</span>
                    </div>
                  </div>
                )}

                {/* Checklist Tags */}
                {f.checklistTags && f.checklistTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {f.checklistTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-900 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-800"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
