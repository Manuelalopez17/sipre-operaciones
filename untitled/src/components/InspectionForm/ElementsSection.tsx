import React, { useState } from 'react';
import { BuildingElement, BuildingElementType, ElementType, DamageCategory } from '../../types';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  ShieldAlert,
  Building,
  CheckSquare
} from 'lucide-react';

interface ElementsSectionProps {
  elements: BuildingElement[];
  onAddElement: (element: BuildingElement) => void;
  onUpdateElement: (element: BuildingElement) => void;
  onDeleteElement: (elementId: string) => void;
  onSelectElementForFindings?: (element: BuildingElement) => void;
  selectedElementId?: string;
}

export const ElementsSection: React.FC<ElementsSectionProps> = ({
  elements,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onSelectElementForFindings,
  selectedElementId,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<BuildingElementType>('Columna');
  const [newCategory, setNewCategory] = useState<DamageCategory>('Estructural');
  const [newFloor, setNewFloor] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  const elementTypes: { type: BuildingElementType; label: string; category: DamageCategory }[] = [
    { type: 'Columna', label: 'Columna de Concreto', category: 'Estructural' },
    { type: 'Viga', label: 'Viga de Concreto', category: 'Estructural' },
    { type: 'Muro Estructural', label: 'Muro Estructural / Pantalla', category: 'Estructural' },
    { type: 'Muro de Mampostería', label: 'Muro de Mampostería', category: 'Estructural' },
    { type: 'Losa / Entrepiso', label: 'Losa / Entrepiso', category: 'Estructural' },
    { type: 'Cimentación', label: 'Cimentación / Zapata', category: 'Estructural' },
    { type: 'Escalera', label: 'Escalera', category: 'Estructural' },
    { type: 'Elemento de Acero', label: 'Columna / Viga de Acero', category: 'Estructural' },
    { type: 'Elemento de Madera', label: 'Estructura de Madera', category: 'Estructural' },
    { type: 'Cubierta / Techo', label: 'Cubierta / Cercha / Techo', category: 'Estructural' },
    { type: 'Fachada', label: 'Fachada / Encerramiento', category: 'No Estructural' },
    { type: 'Parapeto', label: 'Parapeto / Antepecho', category: 'No Estructural' },
    { type: 'Cielorraso', label: 'Cielorraso / Drywall', category: 'No Estructural' },
    { type: 'Ventana', label: 'Vidriería / Ventanal', category: 'No Estructural' },
    { type: 'Instalación / Tubería / Tanque', label: 'Instalación / Red de Servicios / Tanque', category: 'No Estructural' },
    { type: 'Terreno / Suelo', label: 'Suelo / Terreno Circundante', category: 'Geotécnico / Suelo' },
    { type: 'Talud', label: 'Talud / Ladera', category: 'Geotécnico / Suelo' },
    { type: 'Otro', label: 'Otro Elemento', category: 'Estructural' },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newElem: BuildingElement = {
      id: 'ELEM-' + Date.now(),
      label: newLabel.trim(),
      type: newType,
      category: newCategory,
      floor: newFloor,
      location: newLocation,
      material: newMaterial,
      findingsCount: 0,
    };

    onAddElement(newElem);
    setNewLabel('');
    setNewFloor('');
    setNewLocation('');
    setNewMaterial('');
    setIsAdding(false);
  };

  const handleTypeChange = (type: ElementType) => {
    setNewType(type);
    const found = elementTypes.find((t) => t.type === type);
    if (found) {
      setNewCategory(found.category);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
      
      {/* Header & Add Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">
            Elementos de la Edificación ({elements.length})
          </h2>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>AGREGAR ELEMENTO</span>
          </button>
        )}
      </div>

      {/* New Element Inline Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Registrar Nuevo Elemento de Inspección
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Identificador / Etiqueta del Elemento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Columna C-02, Viga V-101, Muro Eje B"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tipo de Elemento
              </label>
              <select
                value={newType}
                onChange={(e) => handleTypeChange(e.target.value as ElementType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {elementTypes.map((et) => (
                  <option key={et.type} value={et.type}>
                    {et.label} ({et.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Categoría Estructural
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as DamageCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Estructural">Estructural</option>
                <option value="No Estructural">No Estructural</option>
                <option value="Geotécnico / Suelo">Geotécnico / Suelo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Piso / Nivel
              </label>
              <input
                type="text"
                value={newFloor}
                onChange={(e) => setNewFloor(e.target.value)}
                placeholder="Piso 1 / Sótano 1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Ubicación / Ejes Estructurales
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Eje 2-C / Fachada Occidental"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Material Predominante
              </label>
              <input
                type="text"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Concreto reforzado 28 MPa"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

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
              <span>Guardar Elemento</span>
            </button>
          </div>
        </form>
      )}

      {/* Elements List */}
      {elements.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-300 font-semibold">No se han registrado elementos aún.</p>
          <p className="text-[11px] text-slate-500">Agrega columnas, vigas, muros o losas para documentar patologías específicas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {elements.map((elem) => {
            const isSelected = selectedElementId === elem.id;
            return (
              <div
                key={elem.id}
                onClick={() => onSelectElementForFindings && onSelectElementForFindings(elem)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {elem.label}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        elem.category === 'Estructural'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : elem.category === 'Geotécnico / Suelo'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {elem.category}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <p><span className="text-slate-500">Tipo:</span> {elem.type}</p>
                    <p><span className="text-slate-500">Nivel/Ejes:</span> {elem.floor} • {elem.location}</p>
                    <p><span className="text-slate-500">Material:</span> {elem.material || 'N/D'}</p>
                  </div>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    {elem.findingsCount || 0} hallazgo(s)
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar elemento ${elem.label}?`)) {
                        onDeleteElement(elem.id);
                      }
                    }}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Eliminar elemento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
