import React, { useState } from 'react';
import { APPROVED_TECHNICAL_REFERENCES, TechnicalReference, searchTechnicalReferences } from '../lib/technicalStandards';
import { BookOpen, Search, X, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

interface TechnicalReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReference?: (ref: TechnicalReference) => void;
}

export const TechnicalReferencesModal: React.FC<TechnicalReferencesModalProps> = ({
  isOpen,
  onClose,
  onSelectReference,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const standardsList = ['NSR-10', 'AIS 410', 'ATC-20', 'ACI 318', 'ASCE 41'];

  const filteredReferences = APPROVED_TECHNICAL_REFERENCES.filter((ref) => {
    const matchesSearch =
      ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.relevantExcerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.inspectorNote && ref.inspectorNote.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStandard = selectedStandard === 'ALL' || ref.standard.includes(selectedStandard);

    return matchesSearch && matchesStandard;
  });

  const handleCopy = (ref: TechnicalReference) => {
    const text = `[${ref.standard} - ${ref.section}] ${ref.title}: "${ref.relevantExcerpt}"`;
    navigator.clipboard.writeText(text);
    setCopiedId(ref.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Biblioteca de Normas Técnicas y Códigos de Construcción
              </h2>
              <p className="text-xs text-slate-400">
                NSR-10, AIS 410, FEMA P-2055 / ATC-20, ACI 318/562 y ASCE 41 para inspección post-sismo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por palabra clave (ej. cortante, fisura diagonal, nudo, deriva)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Todas las Normas</option>
              {standardsList.map((std) => (
                <option key={std} value={std}>
                  {std}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* References List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredReferences.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No se encontraron referencias para los criterios seleccionados.
            </div>
          ) : (
            filteredReferences.map((ref) => (
              <div
                key={ref.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                        {ref.standard} • {ref.section}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {ref.organization}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">{ref.title}</h3>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCopy(ref)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition-colors"
                      title="Copiar cita técnica al portapapeles"
                    >
                      {copiedId === ref.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {onSelectReference && (
                      <button
                        onClick={() => {
                          onSelectReference(ref);
                          onClose();
                        }}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded transition-colors"
                      >
                        Adjuntar
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                  "{ref.relevantExcerpt}"
                </div>

                {ref.inspectorNote && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-850">
                    <span className="font-semibold text-slate-300">Nota técnica:</span> {ref.inspectorNote}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>{filteredReferences.length} referencias normativas disponibles</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
