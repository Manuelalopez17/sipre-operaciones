from pathlib import Path

FIELD = Path('untitled/src/components/FieldModeView.tsx')
SERVICE = Path('untitled/src/lib/supabaseService.ts')

field = FIELD.read_text(encoding='utf-8')
service = SERVICE.read_text(encoding='utf-8')

if 'const [mediaUploading, setMediaUploading]' not in field:
    field = field.replace("import React, { useState } from 'react';", "import React, { useState, useRef, useEffect } from 'react';")
    field = field.replace("} from '../lib/storage';", "} from '../lib/storage';\nimport { uploadEvidenceFile, getEvidenceFilesFromDb } from '../lib/supabaseService';\nimport { useAuth } from '../context/AuthContext';", 1)

    anchor = "  const [evidenceList, setEvidenceList] = useState<EvidenceMediaItem[]>([]);\n  const [activeEvidenceCategory, setActiveEvidenceCategory] = useState<EvidenceCategory>('GENERAL VISIT');\n"
    block = anchor + """  const [mediaUploading, setMediaUploading] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [pendingMediaDescription, setPendingMediaDescription] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);

  const photoCaptureRef = useRef<HTMLInputElement | null>(null);
  const photoUploadRef = useRef<HTMLInputElement | null>(null);
  const videoCaptureRef = useRef<HTMLInputElement | null>(null);
  const audioFileRef = useRef<HTMLInputElement | null>(null);
  const documentFileRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const { user, profile } = useAuth();

  const reloadEvidenceFromDb = async () => {
    if (!initialVisit?.id && !initialVisit?.caseId) return;
    const items = await getEvidenceFilesFromDb({ caseId: initialVisit?.caseId, visitId: initialVisit?.id });
    setEvidenceList(items);
  };

  useEffect(() => {
    reloadEvidenceFromDb();
    return () => audioStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, [initialVisit?.id, initialVisit?.caseId]);

  const handleEvidenceFile = async (file: File, mediaType: EvidenceMediaItem['mediaType'], description?: string) => {
    setMediaUploading(true);
    setMediaError(null);
    try {
      const result = await uploadEvidenceFile(file, {
        caseId: initialVisit?.caseId,
        visitId: initialVisit?.id,
        category: activeEvidenceCategory,
        description: description || pendingMediaDescription || `${mediaType} de inspección en campo`,
        uploadedBy: user?.id,
      });
      if (!result.success || !result.url) throw new Error(result.error || 'No se pudo guardar la evidencia en Supabase.');
      const now = new Date();
      const item: EvidenceMediaItem = {
        id: result.storagePath || `EV-${Date.now()}`,
        mediaType,
        url: result.url,
        filename: file.name,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        user: profile?.full_name || user?.email || 'Usuario SIPRE',
        visitId: initialVisit?.id,
        caseId: initialVisit?.caseId,
        category: activeEvidenceCategory,
        description: description || pendingMediaDescription || `${mediaType} de inspección en campo`,
        createdAt: now.toISOString(),
      };
      setEvidenceList((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
      setPendingMediaDescription('');
      setSavedSuccessMsg(`${file.name} guardado en SIPRE y disponible para el equipo.`);
      setTimeout(() => setSavedSuccessMsg(null), 3500);
    } catch (err: any) {
      setMediaError(err?.message || 'No se pudo guardar la evidencia. Verifique conexión y permisos.');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleInputEvidence = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: EvidenceMediaItem['mediaType']) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await handleEvidenceFile(file, mediaType);
  };

  const startVoiceRecording = async () => {
    setMediaError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      audioFileRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `nota-voz-${Date.now()}.${ext}`, { type: mime });
        stream.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        await handleEvidenceFile(file, 'voice', pendingMediaDescription || 'Nota de voz de inspección en campo');
      };
      recorder.start();
      setIsRecordingVoice(true);
    } catch (err) {
      console.warn('Microphone capture failed:', err);
      audioFileRef.current?.click();
      setMediaError('No fue posible abrir el micrófono directamente. Puedes grabar o seleccionar un audio desde el dispositivo.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecordingVoice(false);
  };
"""
    if anchor not in field:
        raise RuntimeError('Evidence state anchor not found')
    field = field.replace(anchor, block, 1)

    field = field.replace("      voiceNotes: [],\n      walkthroughSummary:", "      voiceNotes: [],\n      evidenceMedia: evidenceList,\n      walkthroughSummary:", 1)

    zone_start = field.index('                    <div className="grid grid-cols-3 gap-2 pt-2">')
    zone_end = field.index('                    </div>\n                  </div>', zone_start) + len('                    </div>')
    zone_new = '''                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button type="button" onClick={() => { setActiveEvidenceCategory('GENERAL VISIT'); setPendingMediaDescription(`Zona: ${activeZone.name}`); photoCaptureRef.current?.click(); }} className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-1 text-center">
                        <Camera className="w-4 h-4 text-cyan-400" /><span className="text-[11px] font-bold">Foto</span>
                      </button>
                      <button type="button" onClick={() => { setActiveEvidenceCategory('GENERAL VISIT'); setPendingMediaDescription(`Zona: ${activeZone.name}`); videoCaptureRef.current?.click(); }} className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-1 text-center">
                        <Video className="w-4 h-4 text-purple-400" /><span className="text-[11px] font-bold">Video</span>
                      </button>
                      <button type="button" onClick={() => { setActiveEvidenceCategory('GENERAL VISIT'); setPendingMediaDescription(`Zona: ${activeZone.name}`); if (isRecordingVoice) stopVoiceRecording(); else startVoiceRecording(); }} className={`bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 text-center ${isRecordingVoice ? 'border-red-500 text-red-300' : 'border-slate-800 text-slate-300'}`}>
                        <Mic className={`w-4 h-4 ${isRecordingVoice ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} /><span className="text-[11px] font-bold">{isRecordingVoice ? 'Detener Voz' : 'Nota de Voz'}</span>
                      </button>
                    </div>'''
    field = field[:zone_start] + zone_new + field[zone_end:]

    step7_start = field.index('        {/* ========================================================\n            STEP 7: EVIDENCIAS')
    step8_start = field.index('        {/* ========================================================\n            STEP 8: CONCLUSIONES DE LA VISITA', step7_start)
    step7 = '''        {/* ========================================================
            STEP 7: EVIDENCIAS
           ======================================================== */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2"><Camera className="w-5 h-5 text-cyan-400" /><span>7. Evidencias y Galería de Inspección</span></h2>
              <p className="text-xs text-slate-400 mt-0.5">Fotos, videos, notas de voz y documentos almacenados en SIPRE para consulta remota.</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['GENERAL VISIT','FINDINGS','BEFORE REPAIR','DURING REPAIR','AFTER REPAIR','MATERIALS','MATERIAL DELIVERY','FINAL HANDOVER'].map((cat) => (
                <button key={cat} type="button" onClick={() => setActiveEvidenceCategory(cat as EvidenceCategory)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeEvidenceCategory === cat ? 'bg-cyan-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'}`}>{cat}</button>
              ))}
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Descripción opcional de la evidencia</label>
              <input type="text" value={pendingMediaDescription} onChange={(e) => setPendingMediaDescription(e.target.value)} placeholder="Ej. Fisura diagonal en columna C-03, primer piso" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none" />
            </div>

            <input ref={photoCaptureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleInputEvidence(e, 'photo')} />
            <input ref={photoUploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleInputEvidence(e, 'photo')} />
            <input ref={videoCaptureRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => handleInputEvidence(e, 'video')} />
            <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleInputEvidence(e, 'voice')} />
            <input ref={documentFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*" className="hidden" onChange={(e) => handleInputEvidence(e, 'document')} />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              <button type="button" disabled={mediaUploading} onClick={() => photoCaptureRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><Camera className="w-5 h-5 text-cyan-400" /><span>Tomar Foto</span></button>
              <button type="button" disabled={mediaUploading} onClick={() => photoUploadRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><Upload className="w-5 h-5 text-blue-400" /><span>Subir Foto</span></button>
              <button type="button" disabled={mediaUploading} onClick={() => videoCaptureRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><Video className="w-5 h-5 text-purple-400" /><span>Grabar Video</span></button>
              <button type="button" disabled={mediaUploading} onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording} className={`bg-slate-950 disabled:opacity-50 p-3 rounded-xl border flex flex-col items-center space-y-1.5 text-xs font-bold ${isRecordingVoice ? 'border-red-500 text-red-300' : 'border-slate-800 text-slate-200'}`}><Mic className={`w-5 h-5 ${isRecordingVoice ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} /><span>{isRecordingVoice ? 'Detener Voz' : 'Nota de Voz'}</span></button>
              <button type="button" disabled={mediaUploading} onClick={() => documentFileRef.current?.click()} className="bg-slate-950 disabled:opacity-50 p-3 rounded-xl border border-slate-800 flex flex-col items-center space-y-1.5 text-xs font-bold text-slate-200"><FileText className="w-5 h-5 text-amber-400" /><span>Documento</span></button>
            </div>

            {mediaUploading && <div className="bg-cyan-950/60 border border-cyan-800 rounded-xl px-4 py-3 text-xs text-cyan-200 font-bold">Guardando evidencia en SIPRE…</div>}
            {mediaError && <div className="bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 text-xs text-red-200">{mediaError}</div>}

            {evidenceList.filter((item) => item.category === activeEvidenceCategory).length === 0 ? (
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-2"><Camera className="w-8 h-8 text-slate-600 mx-auto" /><h3 className="text-xs font-bold text-slate-300">Sin archivos en la categoría "{activeEvidenceCategory}"</h3><p className="text-[11px] text-slate-500">Las evidencias se guardarán en Supabase y quedarán disponibles para el equipo.</p></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evidenceList.filter((item) => item.category === activeEvidenceCategory).map((item) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    {item.mediaType === 'photo' && <img src={item.url} alt={item.description || item.filename || 'Evidencia'} className="w-full h-48 object-cover bg-black" />}
                    {item.mediaType === 'video' && <video src={item.url} controls playsInline className="w-full h-48 object-contain bg-black" />}
                    {item.mediaType === 'voice' && <div className="p-4 bg-slate-900"><audio src={item.url} controls className="w-full" /></div>}
                    {item.mediaType === 'document' && <div className="p-5 text-center bg-slate-900"><a href={item.url} target="_blank" rel="noreferrer" className="text-cyan-300 text-xs font-bold hover:underline">Abrir documento</a></div>}
                    <div className="p-3 space-y-1"><div className="text-xs font-bold text-white truncate">{item.filename || item.mediaType}</div><div className="text-[10px] text-slate-500">{item.date} {item.time} · {item.user}</div><div className="text-[11px] text-slate-300">{item.description}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

'''
    field = field[:step7_start] + step7 + field[step8_start:]

if 'function mapEvidenceCategoryToDb' not in service:
    service = service.replace('  EvidenceFileRecord,\n  ActivityLogEntry,', '  EvidenceFileRecord,\n  EvidenceCategory,\n  EvidenceMediaItem,\n  ActivityLogEntry,', 1)
    start = service.index('export async function uploadEvidenceFile(')
    end = service.index('// -------------------------------------------------------------\n// 8. REALTIME SUBSCRIPTIONS', start)
    replacement = '''function mapEvidenceCategoryToDb(category?: string): string {
  const map: Record<string, string> = { 'GENERAL VISIT':'general_visit', FINDINGS:'finding', 'BEFORE REPAIR':'before_repair', 'DURING REPAIR':'during_repair', 'AFTER REPAIR':'after_repair', MATERIALS:'materials', 'MATERIAL DELIVERY':'material_delivery', 'FINAL HANDOVER':'final_handover' };
  return map[(category || '').toUpperCase()] || 'other';
}

function mapEvidenceCategoryFromDb(category?: string): EvidenceCategory {
  const map: Record<string, EvidenceCategory> = { general_visit:'GENERAL VISIT', finding:'FINDINGS', before_repair:'BEFORE REPAIR', during_repair:'DURING REPAIR', after_repair:'AFTER REPAIR', materials:'MATERIALS', material_delivery:'MATERIAL DELIVERY', final_handover:'FINAL HANDOVER' };
  return map[category || ''] || 'GENERAL VISIT';
}

function mediaTypeFromMime(mime?: string): EvidenceMediaItem['mediaType'] {
  if ((mime || '').startsWith('image/')) return 'photo';
  if ((mime || '').startsWith('video/')) return 'video';
  if ((mime || '').startsWith('audio/')) return 'voice';
  return 'document';
}

export async function uploadEvidenceFile(file: File, metadata: { caseId?: string; visitId?: string; inspectionId?: string; findingId?: string; workFrontId?: string; category?: string; description?: string; uploadedBy?: string; }): Promise<{ success:boolean; url?:string; storagePath?:string; error?:string }> {
  const client = getSupabaseClient();
  if (!client) return { success:false, error:'Cliente de Supabase no disponible' };
  try {
    const body = file.type.startsWith('image/') ? await compressImageClientSide(file) : file;
    const rawExt = file.name.includes('.') ? file.name.split('.').pop() : undefined;
    const mimeExt = file.type.includes('/') ? file.type.split('/')[1].split(';')[0] : undefined;
    const ext = (rawExt || mimeExt || 'bin').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2,8);
    const scope = metadata.caseId || metadata.visitId || 'general';
    const storagePath = `${scope}/${metadata.visitId || 'general'}/${ts}-${rand}.${ext}`;
    const { error: uploadError } = await client.storage.from('sipre-files').upload(storagePath, body, { cacheControl:'3600', upsert:false, contentType:file.type || 'application/octet-stream' });
    if (uploadError) return { success:false, error:uploadError.message };

    const { error: evidenceError } = await client.from('evidence_files').insert({
      case_id: metadata.caseId || null, visit_id: metadata.visitId || null, inspection_id: metadata.inspectionId || null, finding_id: metadata.findingId || null, work_front_id: metadata.workFrontId || null,
      category: mapEvidenceCategoryToDb(metadata.category), storage_path: storagePath, original_filename: file.name, file_type: file.type || 'application/octet-stream', description: metadata.description || '', uploaded_by: metadata.uploadedBy || null, captured_at: new Date().toISOString()
    });
    if (evidenceError) { await client.storage.from('sipre-files').remove([storagePath]); return { success:false, error:evidenceError.message }; }
    const { data: signed } = await client.storage.from('sipre-files').createSignedUrl(storagePath, 60*60*24*7);
    return { success:true, url:signed?.signedUrl || storagePath, storagePath };
  } catch (err:any) { return { success:false, error:err?.message || 'Error al subir archivo' }; }
}

export async function getEvidenceFilesFromDb(filters: { caseId?:string; visitId?:string; workFrontId?:string }): Promise<EvidenceMediaItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    let query = client.from('evidence_files').select('*').order('captured_at', { ascending:false });
    if (filters.visitId) query = query.eq('visit_id', filters.visitId); else if (filters.workFrontId) query = query.eq('work_front_id', filters.workFrontId); else if (filters.caseId) query = query.eq('case_id', filters.caseId);
    const { data, error } = await query;
    if (error) return [];
    const items: EvidenceMediaItem[] = [];
    for (const row of data || []) {
      const { data: signed } = await client.storage.from('sipre-files').createSignedUrl(row.storage_path, 60*60*24*7);
      const captured = new Date(row.captured_at || row.created_at || new Date().toISOString());
      items.push({ id:row.id, mediaType:mediaTypeFromMime(row.file_type), url:signed?.signedUrl || row.storage_path, filename:row.original_filename || 'evidencia', date:captured.toISOString().split('T')[0], time:captured.toTimeString().slice(0,5), user:row.uploaded_by || 'Usuario SIPRE', visitId:row.visit_id || undefined, caseId:row.case_id || undefined, workFrontId:row.work_front_id || undefined, category:mapEvidenceCategoryFromDb(row.category), description:row.description || '', createdAt:row.created_at || captured.toISOString() });
    }
    return items;
  } catch { return []; }
}

'''
    service = service[:start] + replacement + service[end:]

FIELD.write_text(field, encoding='utf-8')
SERVICE.write_text(service, encoding='utf-8')
print('SIPRE media fix applied')
