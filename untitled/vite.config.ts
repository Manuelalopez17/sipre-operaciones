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
        // CS Grupo Tecnico is an operational coordination account even if its
        // existing Supabase profile was initially created as inspector.
        next = next.replace(
          '    setProfile(p);',
          `    const authenticatedEmail = String(authUser?.email || p?.email || '').trim().toLowerCase();\n    if (p && authenticatedEmail === 'csgrupotecnico2026@gmail.com') {\n      p = { ...p, role: 'coordinator', email: authUser?.email || p.email };\n    }\n    setProfile(p);`
        );

        // Do not expose the coordination account as an assignable professional.
        next = next.replace(
          '    setActiveProfiles(profiles);',
          `    setActiveProfiles(profiles.map((item) => {\n      const email = String(item.email || '').trim().toLowerCase();\n      return email === 'csgrupotecnico2026@gmail.com' ? { ...item, role: 'coordinator' as const } : item;\n    }));`
        );
      }

      if (id.endsWith('/src/App.tsx') || id.endsWith('\\src\\App.tsx')) {
        // Expedientes/emergencia keep their original planner permissions.
        // Visit coordination, however, is available to every non-professional role.
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
      }

      if (
        id.endsWith('/src/components/AgendaView.tsx') ||
        id.endsWith('\\src\\components\\AgendaView.tsx') ||
        id.endsWith('/src/components/VisitsView.tsx') ||
        id.endsWith('\\src\\components\\VisitsView.tsx')
      ) {
        // Only professionals are excluded from visit coordination.
        next = next.replace(
          '  const planner = isCoordinator(profile?.role) || isManagement(profile?.role);',
          '  const planner = !isProfessional(profile?.role);'
        );
      }

      if (id.endsWith('/src/components/FieldModeView.tsx') || id.endsWith('\\src\\components\\FieldModeView.tsx')) {
        // Keep camera/video/audio/document inputs mounted for every field step.
        const mediaInputs = /\s*<input ref=\{photoCaptureRef\}[\s\S]*?<input ref=\{documentFileRef\}[\s\S]*?\/>/m;
        const mediaMatch = next.match(mediaInputs);
        if (mediaMatch) {
          const block = mediaMatch[0].trim();
          next = next.replace(mediaMatch[0], '');
          next = next.replace(
            '      {/* Step Content Container */}',
            `      ${block}\n\n      {/* Step Content Container */}`
          );
        }

        if (!next.includes('id="field-media-error-global"')) {
          next = next.replace(
            '      {/* 10-Step Progress Indicator */}',
            `      {mediaError && (\n        <div id="field-media-error-global" className="p-3.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs">\n          {mediaError}\n        </div>\n      )}\n\n      {/* 10-Step Progress Indicator */}`
          );
        }

        // Work fronts created from a visit must be written to Supabase.
        if (!next.includes("from '../lib/workFrontRemote'")) {
          next = next.replace(
            "import { uploadEvidenceFile, getEvidenceFilesFromDb } from '../lib/supabaseService';",
            "import { uploadEvidenceFile, getEvidenceFilesFromDb } from '../lib/supabaseService';\nimport { createWorkFrontFromVisitInDb } from '../lib/workFrontRemote';"
          );
        }
        next = next.replace(
          'const handleCreateWorkFrontFromDecision = () => {',
          'const handleCreateWorkFrontFromDecision = async () => {'
        );
        next = next.replace(
          'const newFront = saveWorkFront({',
          'const newFront = await createWorkFrontFromVisitInDb({'
        );
      }

      if (id.endsWith('/src/components/Dashboard.tsx') || id.endsWith('\\src\\components\\Dashboard.tsx')) {
        // The dashboard perspective comes only from the authenticated Supabase profile.
        // Keep the original rich dashboard, but remove the manual role simulator.
        next = next.replace(
          "const [selectedRoleView, setSelectedRoleView] = useState<'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO'>(userRoleCategory);",
          "const selectedRoleView = userRoleCategory;\n  const setSelectedRoleView = (_role: 'PROFESIONAL' | 'COORDINADOR' | 'GERENCIA' | 'OPERATIVO') => {};"
        );
        next = next.replace(
          '          {/* Role Perspective Switcher for Initial Team Verification */}\n          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">',
          '          {/* Role is fixed by authenticated user */}\n          <div className="hidden">'
        );
        // Field mode must always start from an assigned visit, never from a generic dashboard shortcut.
        next = next.replaceAll("onClick={() => onNavigate('field-mode')}", "onClick={() => onNavigate('visits')}");
      }

      return next === code ? null : { code: next, map: null };
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [sipreRuntimeFixes(), react(), tailwindcss()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      'process.env.SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
    },
    envPrefix: ['VITE_', 'SUPABASE_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
