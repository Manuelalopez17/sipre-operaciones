import React, { useState, useRef, useEffect } from 'react';
import { VoiceNoteMetadata } from '../../types';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Sparkles, 
  Trash2, 
  FileText, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface VoiceNotesSectionProps {
  voiceNotes: VoiceNoteMetadata[];
  onAddVoiceNote: (note: VoiceNoteMetadata) => void;
  onUpdateVoiceNote: (note: VoiceNoteMetadata) => void;
  onDeleteVoiceNote: (id: string) => void;
  elementContext?: {
    elementType?: string;
    floor?: string;
  };
}

export const VoiceNotesSection: React.FC<VoiceNotesSectionProps> = ({
  voiceNotes,
  onAddVoiceNote,
  onUpdateVoiceNote,
  onDeleteVoiceNote,
  elementContext,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);

        // Convert blob to base64 for persistent storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const newNote: VoiceNoteMetadata = {
            id: 'VN-' + Date.now(),
            audioBlobUrl: blobUrl,
            audioBase64: base64Audio,
            durationSeconds: recordingSeconds || 5,
            recordedAt: new Date().toISOString(),
            rawTranscription: 'Dictado de voz grabado en campo durante la inspección técnica.',
            structuredNote: 'Dictado pendiente de estructuración con IA.',
            isTranscribed: false,
          };
          onAddVoiceNote(newNote);
        };
        reader.readAsDataURL(audioBlob);

        // Stop tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission error:', err);
      alert('No se pudo acceder al micrófono del dispositivo. Verifique los permisos en el navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const togglePlayback = (note: VoiceNoteMetadata) => {
    if (activePlayingId === note.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setActivePlayingId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const player = new Audio(note.audioBlobUrl || note.audioBase64);
      audioPlayerRef.current = player;
      player.onended = () => setActivePlayingId(null);
      player.play();
      setActivePlayingId(note.id);
    }
  };

  const handleTranscribeAndStructure = async (note: VoiceNoteMetadata) => {
    setTranscribingId(note.id);
    try {
      const response = await fetch('/api/gemini/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTranscription: note.rawTranscription,
          inspectorAudioNotes: note.structuredNote || note.inspectorEditedNote,
          elementContext,
        }),
      });

      if (!response.ok) throw new Error('Error al procesar nota de voz');

      const data = await response.json();
      const updated: VoiceNoteMetadata = {
        ...note,
        rawTranscription: note.rawTranscription || 'Dictado de campo procesado',
        structuredNote: data.structuredNote || note.structuredNote,
        technicalClassification: data.technicalClassification,
        inspectorEditedNote: data.structuredNote,
        isTranscribed: true,
      };

      onUpdateVoiceNote(updated);
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      alert('Error al estructurar nota de voz: ' + (err?.message || 'Verifique la conexión'));
    } finally {
      setTranscribingId(null);
    }
  };

  const saveEditNote = (note: VoiceNoteMetadata) => {
    const updated: VoiceNoteMetadata = {
      ...note,
      inspectorEditedNote: editText,
      structuredNote: editText,
    };
    onUpdateVoiceNote(updated);
    setEditingId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mic className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Notas de Voz y Dictados de Campo
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          {voiceNotes.length} nota(s) grabada(s)
        </span>
      </div>

      {/* Record Action Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {isRecording ? (
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="text-red-400 font-mono font-bold text-sm">
                GRABANDO: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Graba tus observaciones técnicas mientras inspeccionas. La IA transcribirá y estandarizará la terminología.
            </p>
          )}
        </div>

        <div>
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-500 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-600/30 transition-all"
            >
              <Square className="w-4 h-4" />
              <span>DETENER GRABACIÓN</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/30 transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>GRABAR NOTA DE VOZ</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice Notes List */}
      {voiceNotes.length > 0 && (
        <div className="space-y-3">
          {voiceNotes.map((note, index) => (
            <div
              key={note.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3"
            >
              {/* Note Header: Audio Player & Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => togglePlayback(note)}
                    className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shadow transition-colors"
                  >
                    {activePlayingId === note.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-white">Audio #{index + 1}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-mono">
                      {note.durationSeconds}s • {note.recordedAt?.slice(11, 16)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTranscribeAndStructure(note)}
                    disabled={transcribingId === note.id}
                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${transcribingId === note.id ? 'animate-spin' : ''}`} />
                    <span>{transcribingId === note.id ? 'Estructurando...' : 'Estructurar con IA'}</span>
                  </button>
                  <button
                    onClick={() => onDeleteVoiceNote(note.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                    title="Eliminar audio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Note Content / Transcription */}
              {editingId === note.id ? (
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <textarea
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => saveEditNote(note)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Edición</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  {note.technicalClassification && (
                    <span className="inline-block bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono mb-1">
                      {note.technicalClassification}
                    </span>
                  )}
                  <p className="italic text-slate-200">
                    "{note.inspectorEditedNote || note.structuredNote || note.rawTranscription}"
                  </p>
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => {
                        setEditingId(note.id);
                        setEditText(note.inspectorEditedNote || note.structuredNote || note.rawTranscription || '');
                      }}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Editar nota técnica</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
