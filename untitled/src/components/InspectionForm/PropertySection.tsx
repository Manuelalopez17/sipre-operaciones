import React, { useState } from 'react';
import { PropertyInspection, StructuralSystemType, GPSCoordinate } from '../../types';
import { 
  Building2, 
  MapPin, 
  User, 
  Layers, 
  Compass, 
  Calendar, 
  Navigation, 
  RefreshCw, 
  FileText, 
  Phone, 
  Home
} from 'lucide-react';

interface PropertySectionProps {
  inspection: PropertyInspection;
  onUpdateField: (field: keyof PropertyInspection, value: any) => void;
  onUpdateGps: (gps: GPSCoordinate) => void;
}

export const PropertySection: React.FC<PropertySectionProps> = ({
  inspection,
  onUpdateField,
  onUpdateGps,
}) => {
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  const structuralSystems: StructuralSystemType[] = [
    'Pórticos de Concreto Reforzado',
    'Mampostería Confinada',
    'Mampostería Estructural',
    'Mampostería No Reforzada',
    'Sistema Dual (Pórticos y Muros)',
    'Estructura Metálica',
    'Estructura de Madera',
    'Estructura Prefabricada',
    'Sistema Mixto',
    'Desconocido',
    'Otro',
  ];

  const captureGpsPosition = () => {
    if (!navigator.geolocation) {
      setGpsStatusMessage('La geolocalización no está soportada en este dispositivo.');
      return;
    }

    setIsCapturingGps(true);
    setGpsStatusMessage('Obteniendo coordenadas satelitales...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GPSCoordinate = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Number(position.coords.accuracy.toFixed(1)),
          altitude: position.coords.altitude ? Number(position.coords.altitude.toFixed(1)) : undefined,
          timestamp: new Date().toISOString(),
        };
        onUpdateGps(coords);
        setIsCapturingGps(false);
        setGpsStatusMessage(`GPS capturado con precisión de ±${coords.accuracy}m`);
      },
      (error) => {
        console.warn('GPS Error:', error);
        setIsCapturingGps(false);
        setGpsStatusMessage(`Error al obtener GPS: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6">
      
      {/* Title & Inspection Code */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">
            Datos Generales del Inmueble y Ubicación
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Código de Inspección:</span>
          <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {inspection.id}
          </span>
        </div>
      </div>

      {/* Date, Time & Inspector Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Fecha de Inspección *
          </label>
          <input
            type="date"
            value={inspection.date}
            onChange={(e) => onUpdateField('date', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Hora de Inspección *
          </label>
          <input
            type="time"
            value={inspection.time}
            onChange={(e) => onUpdateField('time', e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Nombre del Inspector *
          </label>
          <input
            type="text"
            value={inspection.inspectorName}
            onChange={(e) => onUpdateField('inspectorName', e.target.value)}
            placeholder="Nombre y apellidos del inspector"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Matrícula Profesional / Licencia
          </label>
          <input
            type="text"
            value={inspection.professionalLicense}
            onChange={(e) => onUpdateField('professionalLicense', e.target.value)}
            placeholder="No. de matrícula profesional"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

      </div>

      {/* Location, Address, Municipality */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span>Localización y Georreferenciación</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Dirección del Inmueble *
            </label>
            <input
              type="text"
              value={inspection.address}
              onChange={(e) => onUpdateField('address', e.target.value)}
              placeholder="Dirección completa del inmueble"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Barrio / Sector *
            </label>
            <input
              type="text"
              value={inspection.neighborhood}
              onChange={(e) => onUpdateField('neighborhood', e.target.value)}
              placeholder="Barrio o sector"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Municipio / Ciudad *
            </label>
            <input
              type="text"
              value={inspection.municipality}
              onChange={(e) => onUpdateField('municipality', e.target.value)}
              placeholder="Municipio o ciudad"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

        {/* GPS Capture Bar */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Coordenadas GPS:{' '}
                {inspection.gps?.latitude && inspection.gps?.longitude ? (
                  <span className="font-mono text-cyan-300">
                    {inspection.gps.latitude}, {inspection.gps.longitude} (±{inspection.gps.accuracy}m)
                  </span>
                ) : (
                  <span className="text-slate-500">Sin capturar</span>
                )}
              </div>
              {gpsStatusMessage && (
                <div className="text-[11px] text-cyan-400 mt-0.5">{gpsStatusMessage}</div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={captureGpsPosition}
            disabled={isCapturingGps}
            className="bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
            <span>{isCapturingGps ? 'Capturando GPS...' : 'CAPTURAR GPS ACTUAL'}</span>
          </button>
        </div>
      </div>

      {/* Property Characteristics & Structural System */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Características de la Edificación y Sistema Estructural</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Sistema Estructural Predominante *
            </label>
            <select
              value={inspection.structuralSystem}
              onChange={(e) => onUpdateField('structuralSystem', e.target.value as StructuralSystemType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {structuralSystems.map((sys) => (
                <option key={sys} value={sys}>
                  {sys}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Uso de la Edificación *
            </label>
            <select
              value={inspection.buildingUse}
              onChange={(e) => onUpdateField('buildingUse', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Residencial Unifamiliar">Residencial Unifamiliar</option>
              <option value="Residencial Multifamiliar">Residencial Multifamiliar</option>
              <option value="Comercial">Comercial</option>
              <option value="Institucional / Hospital">Institucional / Hospital</option>
              <option value="Educativo">Educativo</option>
              <option value="Industrial">Industrial</option>
              <option value="Mixto">Mixto</option>
              <option value="Patrimonial">Patrimonial</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Número de Pisos Sobre Terreno
            </label>
            <input
              type="number"
              min={1}
              value={inspection.floors}
              onChange={(e) => onUpdateField('floors', parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Número de Sótanos
            </label>
            <input
              type="number"
              min={0}
              value={inspection.basements}
              onChange={(e) => onUpdateField('basements', parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Año Estimado de Construcción
            </label>
            <input
              type="number"
              value={inspection.constructionYear || ''}
              onChange={(e) => onUpdateField('constructionYear', parseInt(e.target.value) || undefined)}
              placeholder="Ej. 1998"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Área Construida Aprox. (m²)
            </label>
            <input
              type="number"
              value={inspection.approximateAreaM2 || ''}
              onChange={(e) => onUpdateField('approximateAreaM2', parseFloat(e.target.value) || undefined)}
              placeholder="Ej. 250"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Estado de Ocupación
            </label>
            <select
              value={inspection.occupancyStatus || 'Ocupada'}
              onChange={(e) => onUpdateField('occupancyStatus', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Ocupada">Ocupada</option>
              <option value="Desocupada">Desocupada</option>
              <option value="Evacuada Preventivamente">Evacuada Preventivamente</option>
              <option value="En Construcción">En Construcción</option>
              <option value="Desconocido">Desconocido</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Tipo de Cimentación
            </label>
            <input
              type="text"
              value={inspection.foundationType || ''}
              onChange={(e) => onUpdateField('foundationType', e.target.value)}
              placeholder="Ej. Zapatas aisladas con vigas de amarre"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

        {/* Owner & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Propietario / Representante / Ocupante
            </label>
            <input
              type="text"
              value={inspection.propertyOwner || ''}
              onChange={(e) => onUpdateField('propertyOwner', e.target.value)}
              placeholder="Nombre del propietario o administrador"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={inspection.contactPhone || ''}
              onChange={(e) => onUpdateField('contactPhone', e.target.value)}
              placeholder="+57 300 123 4567"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* General Observations & Previous Damage */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-400">
            Observaciones Generales de la Edificación y Daños Previos
          </label>
          <textarea
            rows={2}
            value={inspection.generalObservations || ''}
            onChange={(e) => onUpdateField('generalObservations', e.target.value)}
            placeholder="Edificación con ampliaciones no documentadas en el piso 3; sin evidencia de mantenimiento preventivo..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

      </div>

    </div>
  );
};
