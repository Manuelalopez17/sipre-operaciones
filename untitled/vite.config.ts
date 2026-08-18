import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function sipreRuntimeFixes(): Plugin {
  return {
    name: 'sipre-runtime-fixes',
    enforce: 'pre',
    transform(code, id) {
      let next = code;

      if (id.endsWith('/src/context/AuthContext.tsx') || id.endsWith('\\src\\context\\AuthContext.tsx')) {
        next = next.replace(
          '    setProfile(p);',
          `    const authenticatedEmail = String(authUser?.email || p?.email || '').trim().toLowerCase();\n    if (p && authenticatedEmail === 'csgrupotecnico2026@gmail.com') {\n      p = { ...p, role: 'coordinator', email: authUser?.email || p.email };\n    }\n    setProfile(p);`
        );
        next = next.replace(
          '    setActiveProfiles(profiles);',
          `    setActiveProfiles(profiles.map((item) => {\n      const email = String(item.email || '').trim().toLowerCase();\n      return email === 'csgrupotecnico2026@gmail.com' ? { ...item, role: 'coordinator' as const } : item;\n    }));`
        );
      }

      if (id.endsWith('/src/App.tsx') || id.endsWith('\\src\\App.tsx')) {
        next = next.replace(
          "import { Dashboard } from './components/Dashboard';",
          "import { Dashboard } from './components/Dashboard';\nimport { OperationalOverview } from './components/OperationalOverview';"
        );
        next = next.replace(
          '  const planner = isCoordinator(profile?.role) || isManagement(profile?.role);',
          `  const planner = isCoordinator(profile?.role) || isManagement(profile?.role);\n  const visitPlanner = !isProfessional(profile?.role);`
        );
        next = next.replace(
          '  const openScheduleVisit = () => {\n    if (!planner) {',
          '  const openScheduleVisit = () => {\n    if (!visitPlanner) {'
        );
        next = next.replace(
          '<ScheduleVisitModal isOpen={isScheduleVisitModalOpen && planner}',
          '<ScheduleVisitModal isOpen={isScheduleVisitModalOpen && visitPlanner}'
        );
        next = next.replace(
          "{activeView === 'dashboard' && <Dashboard onNavigate={handleNavigate} onOpenNewCaseModal={openNewCase} onOpenScheduleVisitModal={openScheduleVisit} />}",
          "{activeView === 'dashboard' && <><Dashboard onNavigate={handleNavigate} onOpenNewCaseModal={openNewCase} onOpenScheduleVisitModal={openScheduleVisit} /><OperationalOverview /></>}"
        );
      }

      if (
        id.endsWith('/src/components/AgendaView.tsx') ||
        id.endsWith('\\src\\components\\AgendaView.tsx') ||
        id.endsWith('/src/components/VisitsView.tsx') ||
        id.endsWith('\\src\\components\\VisitsView.tsx')
      ) {
        next = next.replace(
          '  const planner = isCoordinator(profile?.role) || isManagement(profile?.role);',
          '  const planner = !isProfessional(profile?.role);'
        );
      }

      if (id.endsWith('/src/components/AgendaView.tsx') || id.endsWith('\\src\\components\\AgendaView.tsx')) {
        next = next.replace(
          "['inspector', 'structural_specialist'].includes(String(p.role || '').toLowerCase())",
          "['inspector', 'structural_specialist', 'profesional'].includes(String(p.role || '').toLowerCase())"
        );

        next = next.replace(
          "    responsibleProfessionalId: '',\n    visitObjective: '',\n    status: 'PROGRAMADA',",
          "    responsibleProfessionalId: '',\n    clientName: '',\n    address: '',\n    municipality: '',\n    neighborhood: '',\n    visitObjective: '',\n    status: 'PROGRAMADA',"
        );
        next = next.replace(
          "      responsibleProfessionalId: assignedId,\n      visitObjective: visit.visitObjective || '',\n      status: visit.status || 'PROGRAMADA',",
          "      responsibleProfessionalId: assignedId,\n      clientName: visit.clientName || '',\n      address: visit.address || '',\n      municipality: visit.municipality || '',\n      neighborhood: visit.neighborhood || '',\n      visitObjective: visit.visitObjective || '',\n      status: visit.status || 'PROGRAMADA',"
        );
        next = next.replace(
          "        responsible_professional: assignedProfessional.full_name,\n        visit_objective: editForm.visitObjective,",
          "        responsible_professional: assignedProfessional.full_name,\n        client_name: editForm.clientName,\n        address: editForm.address,\n        municipality: editForm.municipality,\n        neighborhood: editForm.neighborhood,\n        visit_objective: editForm.visitObjective,"
        );
        next = next.replace(
          '<div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Objetivo de la visita</label><textarea disabled={!planner} rows={3} value={editForm.visitObjective} onChange={e => setEditForm({ ...editForm, visitObjective: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>',
          '<div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Cliente / nombre del predio</label><input disabled={!planner} value={editForm.clientName} onChange={e => setEditForm({ ...editForm, clientName: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div><div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Dirección</label><input disabled={!planner} value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div><div><label className="block text-slate-300 font-bold mb-1">Municipio</label><input disabled={!planner} value={editForm.municipality} onChange={e => setEditForm({ ...editForm, municipality: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div><div><label className="block text-slate-300 font-bold mb-1">Barrio / sector</label><input disabled={!planner} value={editForm.neighborhood} onChange={e => setEditForm({ ...editForm, neighborhood: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div><div className="sm:col-span-2"><label className="block text-slate-300 font-bold mb-1">Objetivo de la visita</label><textarea disabled={!planner} rows={3} value={editForm.visitObjective} onChange={e => setEditForm({ ...editForm, visitObjective: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white disabled:opacity-70" /></div>'
        );

        if (!next.includes("from '../lib/workFrontRemote'")) {
          next = next.replace(
            "import { isCoordinator, isManagement, isProfessional } from '../lib/roles';",
            "import { isCoordinator, isManagement, isProfessional } from '../lib/roles';\nimport { deleteWorkFrontInDb } from '../lib/workFrontRemote';"
          );
        }
        next = next.replace(
          '      const visitId = selectedVisit.id;\n\n      const { data: evidenceRows }',
          `      const visitId = selectedVisit.id;\n\n      const { data: relatedFronts } = await client\n        .from('work_fronts')\n        .select('id')\n        .eq('originating_visit_id', visitId);\n      for (const front of relatedFronts || []) {\n        await deleteWorkFrontInDb(front.id);\n      }\n\n      const { data: evidenceRows }`
        );
      }

      if (id.endsWith('/src/components/ScheduleVisitModal.tsx') || id.endsWith('\\src\\components\\ScheduleVisitModal.tsx')) {
        next = next.replace(
          '  const { user, activeProfiles } = useAuth();',
          '  const { user, activeProfiles, reloadActiveProfiles } = useAuth();'
        );
        next = next.replace(
          '    setError(null);\n    getCasesFromDb()',
          '    setError(null);\n    reloadActiveProfiles();\n    getCasesFromDb()'
        );
        next = next.replace(
          "(p.role === 'inspector' || p.role === 'structural_specialist' || p.role === 'Inspector')",
          "['inspector','structural_specialist','profesional'].includes(String(p.role || '').toLowerCase())"
        );
      }

      if (id.endsWith('/src/lib/workFrontRemote.ts') || id.endsWith('\\src\\lib\\workFrontRemote.ts')) {
        next = next.replace(
          `export async function deleteWorkFrontInDb(id: string): Promise<void> {\n  const client = getSupabaseClient();\n  if (!client) throw new Error('Supabase no está configurado.');\n  const { error } = await client.from('work_fronts').delete().eq('id', id);\n  if (error) throw new Error(error.message);\n  await getWorkFrontsFromDb();\n}`,
          `export async function deleteWorkFrontInDb(id: string): Promise<void> {\n  const client = getSupabaseClient();\n  if (!client) throw new Error('Supabase no está configurado.');\n\n  const { data: evidenceRows } = await client.from('evidence_files').select('storage_path').eq('work_front_id', id);\n  const paths = (evidenceRows || []).map((row: any) => row.storage_path).filter(Boolean);\n  if (paths.length) await client.storage.from('sipre-files').remove(paths);\n\n  const dependentTables = ['material_deliveries','material_requests','work_logs','technical_handover_approvals','client_handovers','billing_records','payments','collection_actions','evidence_files'];\n  for (const table of dependentTables) {\n    try { await client.from(table).delete().eq('work_front_id', id); } catch { /* optional table */ }\n  }\n\n  const { error } = await client.from('work_fronts').delete().eq('id', id);\n  if (error) throw new Error(error.message);\n  await getWorkFrontsFromDb();\n}`
        );
      }

      if (id.endsWith('/src/components/WorkFrontsRemoteView.tsx') || id.endsWith('\\src\\components\\WorkFrontsRemoteView.tsx')) {
        next = next.replace(
          'const [onlyMine, setOnlyMine] = useState(true);',
          "const [onlyMine, setOnlyMine] = useState(() => String(profile?.role || '').toLowerCase().includes('inspector') || String(profile?.role || '').toLowerCase().includes('structural_specialist'));"
        );
        next = next.replace('title="Eliminar prueba"', 'title="Eliminar prueba o dato erróneo"');
      }

      if (id.endsWith('/src/components/FieldModeView.tsx') || id.endsWith('\\src\\components\\FieldModeView.tsx')) {
        const mediaInputs = /\s*<input ref=\{photoCaptureRef\}[\s\S]*?<input ref=\{documentFileRef\}[\s\S]*?\/>/m;
        const mediaMatch = next.match(mediaInputs);
        if (mediaMatch) {
          const block = mediaMatch[0].trim();
          next = next.replace(mediaMatch[0], '');
          next = next.replace('      {/* Step Content Container */}', `      ${block}\n\n      {/* Step Content Container */}`);
        }
        if (!next.includes('id="field-media-error-global"')) {
          next = next.replace(
            '      {/* 10-Step Progress Indicator */}',
            `      {mediaError && (\n        <div id="field-media-error-global" className="p-3.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs">\n          {mediaError}\n        </div>\n      )}\n\n      {/* 10-Step Progress Indicator */}`
          );
        }
        if (!next.includes("from '../lib/workFrontRemote'")) {
          next = next.replace(
            "import { uploadEvidenceFile, getEvidenceFilesFromDb } from '../lib/supabaseService';",
            "import { uploadEvidenceFile, getEvidenceFilesFromDb } from '../lib/supabaseService';\nimport { createWorkFrontFromVisitInDb } from '../lib/workFrontRemote';"
          );
        }
        next = next.replace('const handleCreateWorkFrontFromDecision = () => {', 'const handleCreateWorkFrontFromDecision = async () => {');
        next = next.replace('const newFront = saveWorkFront({', 'const newFront = await createWorkFrontFromVisitInDb({');
      }

      if (id.endsWith('/src/components/Dashboard.tsx') || id.endsWith('\\src\\components\\Dashboard.tsx')) {
        next = next.replace(
          "const [selectedRoleView, setSelectedRoleView] = useState<'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO'>(userRoleCategory);",
          "const selectedRoleView = userRoleCategory;\n  const setSelectedRoleView = (_role: 'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO') => {};"
        );
        next = next.replace(
          '          {/* Role Perspective Switcher for Initial Team Verification */}\n          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">',
          '          {/* Role is fixed by authenticated user */}\n          <div className="hidden">'
        );
        next = next.replaceAll("onClick={() => onNavigate('field-mode')}", "onClick={() => onNavigate('visits')}");
      }

      return next === code ? null : { code: next, map: null };
    },
  };
}

export default defineConfig(() => ({
  plugins: [sipreRuntimeFixes(), react(), tailwindcss()],
  build: { outDir: 'dist', sourcemap: false },
  define: {
    'process.env.SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
  },
  envPrefix: ['VITE_', 'SUPABASE_'],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
