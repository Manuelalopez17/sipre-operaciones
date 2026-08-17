import React, { useState } from 'react';
import { VideoMetadata } from '../../types';
import { Video, Upload, Trash2, Play, Film, CloudUpload, Info } from 'lucide-react';

interface VideoSectionProps {
  videos: VideoMetadata[];
  onAddVideo: (video: VideoMetadata) => void;
  onDeleteVideo: (id: string) => void;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  videos,
  onAddVideo,
  onDeleteVideo,
}) => {
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const videoUrl = URL.createObjectURL(file);

    const newVideo: VideoMetadata = {
      id: 'VID-' + Date.now(),
      url: videoUrl,
      filename: file.name,
      sizeBytes: file.size,
      durationSeconds: 0,
      description: description || 'Video de inspección general y comportamiento dinámico',
      uploadedAt: new Date().toISOString(),
      supabaseStoragePath: `inspection-videos/${Date.now()}_${file.name}`,
    };

    onAddVideo(newVideo);
    setDescription('');
    setIsUploading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Registro Audiovisual y Videos de Campo
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          {videos.length} video(s)
        </span>
      </div>

      {/* Video Upload Box */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <p className="text-xs text-slate-400">
          Carga videos panorámicos para documentar giros, inclinaciones globales, vibraciones inducidas o zonas de difícil acceso.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Descripción del video (ej. Recorrido de fachada norte y nudos exteriores)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <label className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all shadow">
            <Upload className="w-4 h-4" />
            <span>SUBIR VIDEO</span>
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Videos List Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col justify-between"
            >
              <div className="aspect-video bg-black flex items-center justify-center relative">
                <video
                  src={vid.url}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
                      {vid.filename}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {(vid.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {vid.uploadedAt.slice(0, 10)}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteVideo(vid.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title="Eliminar video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 italic">
                  "{vid.description}"
                </p>

                <div className="flex items-center space-x-1 text-[10px] text-cyan-400 font-mono">
                  <CloudUpload className="w-3 h-3" />
                  <span>Almacenamiento: Supabase Storage Bucket</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
