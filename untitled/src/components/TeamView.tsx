import React, { useState } from 'react';
import { 
  Users, 
  PlusCircle, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Award, 
  ShieldCheck, 
  MapPin, 
  Wrench, 
  X, 
  Eye, 
  UserCheck 
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  professionalCard?: string;
  phone: string;
  email: string;
  status: 'Disponible' | 'En Campo' | 'Inactivo';
}

export const TeamView: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isCreatingMember, setIsCreatingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    role: 'Inspector Técnico',
    specialty: 'Patología de Estructuras',
    professionalCard: '',
    phone: '',
    email: '',
  });

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name.trim()) return;

    const newMember: TeamMember = {
      id: 'MEM-' + Date.now(),
      name: newMemberForm.name,
      role: newMemberForm.role,
      specialty: newMemberForm.specialty,
      professionalCard: newMemberForm.professionalCard,
      phone: newMemberForm.phone,
      email: newMemberForm.email,
      status: 'Disponible',
    };

    setTeamMembers([...teamMembers, newMember]);
    setIsCreatingMember(false);
    setNewMemberForm({
      name: '',
      role: 'Inspector Técnico',
      specialty: 'Patología de Estructuras',
      professionalCard: '',
      phone: '',
      email: '',
    });
  };

  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div id="sipre-team-screen" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              Talento y Especialistas
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5 mt-1">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Personal Técnico y Cuadrillas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de inspectores avalados, ingenieros peritos, supervisores y cuadrillas de reparación técnica.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingMember(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-600/25 border border-cyan-400/40 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ REGISTRAR ESPECIALISTA</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, especialidad o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Todos los Roles</option>
          <option value="Inspector Técnico">Inspector Técnico</option>
          <option value="Ingeniero Perito">Ingeniero Perito</option>
          <option value="Supervisor de Obra">Supervisor de Obra</option>
          <option value="Oficial de Reparación">Oficial de Reparación</option>
        </select>
      </div>

      {/* Team Cards */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    {member.role}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {member.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{member.name}</h3>
                <p className="text-xs text-slate-400">{member.specialty}</p>

                {member.professionalCard && (
                  <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Matrícula: {member.professionalCard}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>{member.phone || 'Sin teléfono'}</span>
                <span>{member.email || 'Sin email'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
            <Users className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No hay especialistas registrados</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Registra inspectores de campo, ingenieros calculistas y cuadrillas operativas para asignarlos a visitas y frentes de obra.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingMember(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 shadow-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ REGISTRAR ESPECIALISTA</span>
          </button>
        </div>
      )}

      {/* Modal: Registrar Especialista */}
      {isCreatingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateMember} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Nuevo Especialista / Operativo</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingMember(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  placeholder="Ej. Ing. Mateo Valencia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Rol SIPRE</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Profesional">Profesional (Inspector / Ingeniero)</option>
                    <option value="Coordinador">Coordinador (Operaciones / Programación)</option>
                    <option value="Gerencia">Gerencia (Administrador)</option>
                    <option value="Operativo">Operativo (Técnico / Cuadrilla)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Matrícula Prof.</label>
                  <input
                    type="text"
                    value={newMemberForm.professionalCard}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, professionalCard: e.target.value })}
                    placeholder="Ej. 05202-12345 ANT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Especialidad Técnica</label>
                <input
                  type="text"
                  value={newMemberForm.specialty}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, specialty: e.target.value })}
                  placeholder="Ej. Concreto reforzado, fibra de carbono, geotecnia..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    placeholder="Ej. 300 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    placeholder="m.valencia@sipre.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingMember(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
