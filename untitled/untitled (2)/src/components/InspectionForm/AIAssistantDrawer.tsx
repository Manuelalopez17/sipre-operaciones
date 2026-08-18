import React, { useState } from 'react';
import { PropertyInspection, Finding } from '../../types';
import { 
  Sparkles, 
  X, 
  Send, 
  BookOpen, 
  AlertTriangle, 
  CheckSquare, 
  HelpCircle, 
  FileText, 
  ListChecks, 
  ShieldAlert,
  Search,
  ExternalLink
} from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: PropertyInspection;
  selectedFinding?: Finding | null;
  onAttachReference?: (ref: any) => void;
  onInsertTechnicalNote?: (note: string) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  inspection,
  selectedFinding,
  onAttachReference,
  onInsertTechnicalNote,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; references?: any[]; timestamp: string }>>([
    {
      sender: 'ai',
      text: `Hola, soy el asistente de ingeniería y patología estructural SIPRE. Estoy configurado para asistir en la identificación de fallas conforme a NSR-10, AIS 410, FEMA P-2055 y ACI 318.\n\nRecuerda: Mis análisis son estrictamente preliminares y no sustituyen el criterio del profesional a cargo.`,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    { label: 'Analizar hallazgo', action: 'Analizar hallazgo', icon: Sparkles },
    { label: '¿Qué debo verificar?', action: '¿Qué debo verificar?', icon: HelpCircle },
    { label: 'Posibles causas', action: 'Posibles causas', icon: HelpCircle },
    { label: 'Verificaciones adicionales', action: 'Verificaciones adicionales', icon: ListChecks },
    { label: 'Recomendaciones preliminares', action: 'Recomendaciones preliminares', icon: AlertTriangle },
    { label: 'Buscar referencia técnica', action: 'Buscar referencia técnica', icon: BookOpen },
    { label: 'Resumir inspección', action: 'Resumir inspección', icon: FileText },
    { label: 'Generar lista de acciones', action: 'Generar lista de acciones', icon: CheckSquare },
  ];

  const handleExecuteAction = async (actionLabel: string, customQuery?: string) => {
    setIsLoading(true);
    const query = customQuery || actionLabel;

    // Add user message
    const userMsg = {
      sender: 'user' as const,
      text: query,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionLabel,
          query: customQuery || actionLabel,
          inspectionData: {
            id: inspection.id,
            buildingUse: inspection.buildingUse,
            structuralSystem: inspection.structuralSystem,
            floors: inspection.floors,
            basements: inspection.basements,
            previousDamage: inspection.previousDamage,
            findingsCount: inspection.findings?.length || 0,
          },
          findingData: selectedFinding
            ? {
                elementType: selectedFinding.elementType,
                location: selectedFinding.location,
                floor: selectedFinding.floor,
                damageType: selectedFinding.damageType,
                severity: selectedFinding.severity,
                crackWidth: selectedFinding.crack?.widthRange || selectedFinding.measurements,
                crackOrientation: selectedFinding.crack?.orientation,
                description: selectedFinding.description,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar el asistente');
      }

      const data = await response.json();
      const aiMsg = {
        sender: 'ai' as const,
        text: data.result || 'No se pudo obtener respuesta.',
        references: data.references,
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Error de conexión: ${err?.message || 'Error desconocido'}. Verifique la conexión o continúe con la evaluación profesional directa.`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    handleExecuteAction('Consulta Técnica de Ingeniería', inputText.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col">
      
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>Asistente de Ingeniería IA</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                Gemini 3.7
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {selectedFinding ? `Enfocado en: ${selectedFinding.elementLabel}` : 'Contexto global de edificación'}
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

      {/* Safety Mandatory Banner */}
      <div className="bg-amber-950/70 border-b border-amber-500/40 px-4 py-2 text-[11px] text-amber-200 flex items-start space-x-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-300">
            Aviso Regulatorio de Seguridad
          </span>
          <span>ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.</span>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="p-3 bg-slate-950/90 border-b border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Acciones Rápidas de Inspección:
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.label}
                onClick={() => handleExecuteAction(qa.action)}
                disabled={isLoading}
                className="bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate">{qa.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-md font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* References Attachment Buttons */}
              {msg.references && msg.references.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                    Referencias Técnicas Asociadas:
                  </span>
                  {msg.references.map((ref, rIdx) => (
                    <div key={rIdx} className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-white font-bold">
                        <span>{ref.standard} • {ref.section}</span>
                        {onAttachReference && (
                          <button
                            onClick={() => onAttachReference(ref)}
                            className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-0.5"
                          >
                            <span>Adjuntar al informe</span>
                          </button>
                        )}
                      </div>
                      <p className="text-slate-400 text-[10px] italic">"{ref.relevantExcerpt}"</p>
                    </div>
                  ))}
                </div>
              )}

              <span
                className={`text-[9px] block mt-1.5 ${
                  msg.sender === 'user' ? 'text-cyan-100 text-right' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 w-fit">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Consultando fuentes normativas y procesando ingeniería...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendCustomMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe una consulta técnica (ej. criterios de columna corta NSR-10)..."
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white p-2 rounded-lg transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
