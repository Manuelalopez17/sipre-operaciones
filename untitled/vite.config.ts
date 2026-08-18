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

      if (id.endsWith('/src/components/FieldModeView.tsx') || id.endsWith('\\src\\components\\FieldModeView.tsx')) {
        // 1) Keep the camera/video/audio/document inputs mounted for every field step.
        // Previously they only existed in Step 7, so Step 5 buttons were clicking null refs.
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

        // 2) Show upload errors in every field step, not only in Step 7.
        if (!next.includes('id="field-media-error-global"')) {
          next = next.replace(
            '      {/* 10-Step Progress Indicator */}',
            `      {mediaError && (\n        <div id="field-media-error-global" className="p-3.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs">\n          {mediaError}\n        </div>\n      )}\n\n      {/* 10-Step Progress Indicator */}`
          );
        }

        // 3) Work fronts created from a visit must be written to Supabase, not only localStorage.
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

      if (id.endsWith('/src/App.tsx') || id.endsWith('\\src\\App.tsx')) {
        // Replace the legacy localStorage work-front screen with the Supabase-backed screen.
        next = next.replace(
          "import { WorkFrontsView } from './components/WorkFrontsView';",
          "import { WorkFrontsView } from './components/WorkFrontsRemoteView';"
        );

        if (!next.includes("from './lib/workFrontRemote'")) {
          next = next.replace(
            "import { subscribeToOperationalRealtime } from './lib/supabaseService';",
            "import { subscribeToOperationalRealtime } from './lib/supabaseService';\nimport { syncWorkFrontCacheFromDb } from './lib/workFrontRemote';"
          );
        }

        // Refresh the local dashboard cache from Supabase on app startup.
        next = next.replace(
          '    const loaded = getInspections();\n    setInspections(loaded);',
          "    const loaded = getInspections();\n    setInspections(loaded);\n    syncWorkFrontCacheFromDb().then(() => setInspections(prev => [...prev]));"
        );

        // When Realtime reports a change, refresh the work-front cache before re-rendering Dashboard.
        next = next.replace(
          '      refreshData();\n    });',
          '      syncWorkFrontCacheFromDb().finally(() => refreshData());\n    });'
        );
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
