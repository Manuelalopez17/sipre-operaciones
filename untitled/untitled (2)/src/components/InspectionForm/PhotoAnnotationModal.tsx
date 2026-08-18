import React, { useState, useRef, useEffect } from 'react';
import { PhotoMetadata, PhotoAnnotation, AIPreliminaryAnalysis, GPSCoordinate } from '../../types';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Undo2, 
  Trash2, 
  Save, 
  X, 
  ArrowUpRight, 
  Minus, 
  Circle, 
  Square, 
  PenTool, 
  Type, 
  Ruler, 
  CheckCircle,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';

interface PhotoAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (photo: PhotoMetadata) => void;
  inspectionId: string;
  elementId?: string;
  elementName?: string;
  findingId?: string;
  inspectorName: string;
  currentGps?: GPSCoordinate;
  contextData?: {
    elementType?: string;
    structuralSystem?: string;
    floor?: string;
    location?: string;
    damageType?: string;
    crackWidth?: string;
    crackOrientation?: string;
    inspectorNotes?: string;
  };
}

export const PhotoAnnotationModal: React.FC<PhotoAnnotationModalProps> = ({
  isOpen,
  onClose,
  onSavePhoto,
  inspectionId,
  elementId,
  elementName,
  findingId,
  inspectorName,
  currentGps,
  contextData,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<PhotoAnnotation['type']>('arrow');
  const [selectedColor, setSelectedColor] = useState<string>('#ef4444'); // Red default
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [textInput, setTextInput] = useState<string>('Fisura');
  const [measurementInput, setMeasurementInput] = useState<string>('0.5 mm');
  const [description, setDescription] = useState<string>('');
  const [inspectorObservation, setInspectorObservation] = useState<string>('');

  // Camera Stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<PhotoAnnotation[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  // AI Analysis state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIPreliminaryAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Stop camera on unmount or close
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Redraw canvas whenever image or annotations change
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas dimension based on image aspect ratio
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Render existing annotations
      renderAllAnnotations(ctx, annotations);

      // Render in-progress drawing
      if (currentPoints.length > 0) {
        renderAnnotation(ctx, {
          type: activeTool,
          points: currentPoints,
          color: selectedColor,
          strokeWidth,
          text: textInput,
          measurementValue: measurementInput,
        });
      }
    };
    img.src = imageSrc;
  }, [imageSrc, annotations, currentPoints, activeTool, selectedColor, strokeWidth, textInput, measurementInput]);

  function renderAllAnnotations(ctx: CanvasRenderingContext2D, items: PhotoAnnotation[]) {
    items.forEach((item) => renderAnnotation(ctx, item));
  }

  function renderAnnotation(ctx: CanvasRenderingContext2D, ann: PhotoAnnotation) {
    ctx.save();
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const p = ann.points;
    if (!p || p.length === 0) {
      ctx.restore();
      return;
    }

    if (ann.type === 'arrow' && p.length >= 2) {
      const from = p[0];
      const to = p[p.length - 1];
      const headlen = 14;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    } else if (ann.type === 'line' && p.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
      ctx.stroke();
    } else if (ann.type === 'rectangle' && p.length >= 2) {
      const start = p[0];
      const end = p[p.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (ann.type === 'circle' && p.length >= 2) {
      const start = p[0];
      const end = p[p.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (ann.type === 'freehand' && p.length > 1) {
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length; i++) {
        ctx.lineTo(p[i].x, p[i].y);
      }
      ctx.stroke();
    } else if (ann.type === 'text' && p.length >= 1) {
      const pos = p[0];
      ctx.font = 'bold 16px sans-serif';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.fillText(ann.text || 'Etiqueta', pos.x, pos.y);
    } else if (ann.type === 'measurement' && p.length >= 2) {
      const from = p[0];
      const to = p[p.length - 1];
      // Caliper measurement line
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Tick markers at both ends
      const angle = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2;
      const tick = 8;
      ctx.beginPath();
      ctx.moveTo(from.x - tick * Math.cos(angle), from.y - tick * Math.sin(angle));
      ctx.lineTo(from.x + tick * Math.cos(angle), from.y + tick * Math.sin(angle));
      ctx.moveTo(to.x - tick * Math.cos(angle), to.y - tick * Math.sin(angle));
      ctx.lineTo(to.x + tick * Math.cos(angle), to.y + tick * Math.sin(angle));
      ctx.stroke();

      // Measurement tag
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - 8;
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#0f172a';
      const label = ann.measurementValue || '0.5 mm';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(midX - textWidth / 2 - 4, midY - 12, textWidth + 8, 16);
      ctx.fillStyle = ann.color;
      ctx.fillText(label, midX - textWidth / 2, midY);
    }

    ctx.restore();
  }

  // Handle Camera Start
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('No se pudo acceder a la cámara del dispositivo. Puedes subir una foto desde tu galería o archivos.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 800;
    tempCanvas.height = video.videoHeight || 600;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
      setImageSrc(dataUrl);
      setAnnotations([]);
    }
    // Stop camera
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImageSrc(evt.target?.result as string);
      setAnnotations([]);
    };
    reader.readAsDataURL(file);
  };

  // Mouse / Touch drawing handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setCurrentPoints([coords]);

    if (activeTool === 'text') {
      // Text placed on single click
      const newAnnotation: PhotoAnnotation = {
        type: 'text',
        points: [coords],
        color: selectedColor,
        strokeWidth,
        text: textInput,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
      setIsDrawing(false);
      setCurrentPoints([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'text') return;
    const coords = getCanvasCoords(e);
    if (activeTool === 'freehand') {
      setCurrentPoints((prev) => [...prev, coords]);
    } else {
      // Line, Arrow, Rect, Circle, Measurement (keep start, update end)
      setCurrentPoints((prev) => [prev[0], coords]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 0) {
      const newAnnotation: PhotoAnnotation = {
        type: activeTool,
        points: currentPoints,
        color: selectedColor,
        strokeWidth,
        text: textInput,
        measurementValue: measurementInput,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
    }
    setCurrentPoints([]);
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setAnnotations([]);
  };

  // AI Multimodal Analysis
  const handleAnalyzeWithAI = async () => {
    if (!imageSrc) return;
    setIsAnalyzingAI(true);
    setAiError(null);
    setAiAnalysisResult(null);

    try {
      const response = await fetch('/api/gemini/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          mimeType: 'image/jpeg',
          context: {
            elementType: elementName || contextData?.elementType,
            structuralSystem: contextData?.structuralSystem,
            floor: contextData?.floor,
            location: contextData?.location,
            damageType: contextData?.damageType,
            crackWidth: measurementInput || contextData?.crackWidth,
            crackOrientation: contextData?.crackOrientation,
            inspectorNotes: inspectorObservation || description || contextData?.inspectorNotes,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error de comunicación con el servicio de análisis');
      }

      const data = await response.json();
      setAiAnalysisResult(data);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setAiError(err?.message || 'No se pudo completar el análisis.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleSave = () => {
    if (!imageSrc || !canvasRef.current) return;
    const annotatedUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);

    const now = new Date();
    const photoData: PhotoMetadata = {
      id: 'PHT-' + Date.now(),
      photoNumber: 1, // Will be sequentially indexed
      originalUrl: imageSrc,
      annotatedUrl: annotations.length > 0 ? annotatedUrl : undefined,
      annotations,
      elementId,
      elementName,
      findingId,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      gps: currentGps,
      inspector: inspectorName,
      description: description || 'Fotografía de inspección de elemento estructural',
      inspectorObservation: inspectorObservation || description,
      aiAnalysis: aiAnalysisResult || undefined,
    };

    onSavePhoto(photoData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Documentación Fotográfica y Análisis Patológico
            </h2>
            {elementName && (
              <span className="text-xs bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                {elementName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left / Center: Image & Canvas Editor */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Input Capture Bar (if no image yet or wants to retake) */}
            {!imageSrc && !isCameraActive && (
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center space-y-4 bg-slate-950/50">
                <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-white">Capturar o Cargar Fotografía</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Toma una foto en campo usando la cámara del dispositivo o selecciona un archivo de imagen.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                    <span>USAR CÁMARA DEL DISPOSITIVO</span>
                  </button>
                  <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>SUBIR FOTO DESDE ARCHIVOS</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Live Camera View */}
            {isCameraActive && (
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center border border-slate-700">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 flex items-center space-x-4">
                  <button
                    onClick={capturePhoto}
                    className="bg-red-600 hover:bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-2xl active:scale-95"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      if (cameraStreamRef.current) {
                        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
                      }
                      setIsCameraActive(false);
                    }}
                    className="bg-slate-900/80 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Canvas Editor when Image is Loaded */}
            {imageSrc && (
              <div className="space-y-3">
                {/* Annotation Toolbar */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {/* Tool Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveTool('arrow')}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                        activeTool === 'arrow' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                      title="Flecha indicadora de daño"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span className="hidden sm:inline">Flecha</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('measurement')}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                        activeTool === 'measurement' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                      title="Cota / Medición milimétrica de fisura"
                    >
                      <Ruler className="w-4 h-4" />
                      <span className="hidden sm:inline">Cota / Medida</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('circle')}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                        activeTool === 'circle' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                      title="Círculo de atención"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTool('rectangle')}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                        activeTool === 'rectangle' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                      title="Zona / Rectángulo"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTool('freehand')}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                        activeTool === 'freehand' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                      title="Trazo libre / Croquis de fisura"
                    >
                      <PenTool className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTool('text')}
                      className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                        activeTool === 'text' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                      title="Texto"
                    >
                      <Type className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Color Palettes & Stroke */}
                  <div className="flex items-center space-x-2">
                    {['#ef4444', '#f59e0b', '#06b6d4', '#10b981', '#ffffff'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          selectedColor === color ? 'scale-125 border-white shadow' : 'border-transparent opacity-80'
                        }`}
                      />
                    ))}
                    <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
                    <button
                      onClick={handleUndo}
                      disabled={annotations.length === 0}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30"
                      title="Deshacer trazo"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleClearAll}
                      disabled={annotations.length === 0}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded disabled:opacity-30"
                      title="Borrar todas las anotaciones"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional inputs for Text or Measurement Tool */}
                {activeTool === 'measurement' && (
                  <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 flex items-center space-x-3 text-xs">
                    <span className="text-slate-400">Texto de medición:</span>
                    <input
                      type="text"
                      value={measurementInput}
                      onChange={(e) => setMeasurementInput(e.target.value)}
                      placeholder="Ej. 1.2 mm / 40 cm"
                      className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs w-36 font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[11px] text-slate-500">Arrastra en la imagen para trazar la cota</span>
                  </div>
                )}

                {activeTool === 'text' && (
                  <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 flex items-center space-x-3 text-xs">
                    <span className="text-slate-400">Etiqueta de texto:</span>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Ej. Desprendimiento de recubrimiento"
                      className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-white text-xs flex-1 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[11px] text-slate-500">Haz clic en la imagen para estampar</span>
                  </div>
                )}

                {/* The Interactive Canvas */}
                <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-1">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    className="max-w-full max-h-[480px] object-contain cursor-crosshair rounded shadow-lg"
                  />
                </div>

                {/* Retake / Change Image Trigger */}
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Anotaciones activas: {annotations.length}</span>
                  <button
                    onClick={() => {
                      setImageSrc(null);
                      setAnnotations([]);
                      setAiAnalysisResult(null);
                    }}
                    className="text-cyan-400 hover:underline"
                  >
                    Tomar otra foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Metadata & AI Vision Analysis */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-4">
              {/* Photo Description & Inspector Observation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Descripción / Ubicación Específica de la Fotografía
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Tercio superior de columna C-03 vista frontal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Observación Técnica del Inspector
                </label>
                <textarea
                  rows={2}
                  value={inspectorObservation}
                  onChange={(e) => setInspectorObservation(e.target.value)}
                  placeholder="Ej. Fisura diagonal a 45 grados con desprendimiento local de concreto..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Multimodal AI Vision Button */}
              {imageSrc && (
                <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Análisis con Visión Artificial IA</span>
                    </div>
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-mono">
                      Gemini 3.7
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Evalúa mecánicamente la imagen junto con el contexto estructural para sugerir clasificaciones patológicas y verificaciones en campo.
                  </p>
                  <button
                    onClick={handleAnalyzeWithAI}
                    disabled={isAnalyzingAI}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzingAI ? 'Analizando Fotografía...' : 'ANALIZAR CON IA'}</span>
                  </button>
                </div>
              )}

              {/* AI Analysis Output Display */}
              {aiAnalysisResult && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
                  {/* Mandatory Safety Banner */}
                  <div className="bg-amber-950/80 border border-amber-500/60 p-2.5 rounded-lg flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-amber-300 uppercase leading-tight">
                        {aiAnalysisResult.disclaimer}
                      </p>
                      <p className="text-[10px] text-amber-200/80 mt-0.5">
                        Confianza del modelo: <span className="font-bold">{aiAnalysisResult.confidenceLevel}</span>
                      </p>
                    </div>
                  </div>

                  {/* Observed Condition */}
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Condición Observada:</span>
                    <p className="text-slate-200 mt-0.5">{aiAnalysisResult.observedCondition}</p>
                  </div>

                  {/* Pathology Classification */}
                  <div>
                    <span className="text-slate-400 font-semibold block text-[11px]">Clasificación Patológica Preliminar:</span>
                    <p className="text-cyan-300 font-semibold mt-0.5">{aiAnalysisResult.possiblePathologyClassification}</p>
                  </div>

                  {/* Possible Causes */}
                  {aiAnalysisResult.possibleCauses?.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block text-[11px]">Posibles Causas Mecánicas:</span>
                      <ul className="list-disc list-inside text-slate-300 mt-0.5 space-y-0.5">
                        {aiAnalysisResult.possibleCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Additional Verification */}
                  {aiAnalysisResult.additionalVerificationRequired?.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block text-[11px]">Verificaciones en Campo Requeridas:</span>
                      <ul className="list-disc list-inside text-amber-300/90 mt-0.5 space-y-0.5">
                        {aiAnalysisResult.additionalVerificationRequired.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reference categories */}
                  {aiAnalysisResult.referenceCategories?.length > 0 && (
                    <div className="pt-1 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Normas de referencia sugeridas:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiAnalysisResult.referenceCategories.map((ref, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {aiError && (
                <div className="bg-red-950/60 border border-red-800 p-3 rounded-lg text-xs text-red-300">
                  {aiError}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!imageSrc}
                className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 shadow-lg disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>GUARDAR FOTO Y ANOTACIONES</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
