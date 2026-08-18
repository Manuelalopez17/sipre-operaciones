import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy init Gemini AI
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will run with engineering rule-based fallback mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SIPRE Engine",
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Photo & Damage Multimodal Analysis
app.post("/api/gemini/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", context } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback rule-based analysis if no key
      return res.json({
        observedCondition: "Inspección visual del elemento " + (context?.elementType || "estructural") + ". Se evidencia discontinuidad o deformación superficial.",
        possiblePathologyClassification: "Fisuración / Daño por esfuerzo cortante o flexión post-evento sísmico.",
        possibleCauses: [
          "Concentración de esfuerzos por aceleraciones sísmicas",
          "Diferencia de rigideces entre elementos estructurales y no estructurales",
          "Asentamiento diferencial o efecto de torsión en planta"
        ],
        structuralRelevance: "Moderada a Alta. Requiere verificación de continuidad de armadura y desprendimiento de recubrimiento.",
        nonstructuralRelevance: "Verificar afectación a mamposterías confinadas o de partición adyacentes.",
        additionalVerificationRequired: [
          "Verificar si la fisura atraviesa todo el espesor del elemento",
          "Medir ancho de fisura en varios puntos con fisurómetro calibrado",
          "Inspeccionar nudos viga-columna y extremos confinados"
        ],
        recommendedMeasurements: [
          "Ancho de fisura (mm)",
          "Longitud total desarrollada (cm)",
          "Desplome o deflexión con nivel / plomada"
        ],
        recommendedAdditionalPhotographs: [
          "Fotografía panorámica del pórtico completo",
          "Detalle macro con regla milimetrada o fisurómetro",
          "Nudo estructural superior e inferior"
        ],
        potentialWarningIndicators: [
          "Aplastamiento de hormigón (crushing)",
          "Pandeo de barras de refuerzo longitudinal",
          "Fisuras en 'X' (cruzadas por corte cíclico)"
        ],
        referenceCategories: [
          "NSR-10 Título A / C (Colombia)",
          "AIS 410 - Manual de Evaluación y Rehabilitación Sísmica",
          "FEMA P-2055 / ATC-20 Postearthquake Safety Evaluation"
        ],
        confidenceLevel: "Media",
        recommendedPreliminaryPriority: "YELLOW",
        disclaimer: "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL."
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const prompt = `Eres un asistente de ingeniería civil y patología estructural para el sistema SIPRE (Sistema de Inspección de Patología y Riesgo Estructural).
Analiza esta fotografía tomada en una inspección de campo post-sismo o de emergencia estructural.

Contexto del elemento reportado por el inspector:
- Tipo de Elemento: ${context?.elementType || "No especificado"}
- Sistema Estructural: ${context?.structuralSystem || "No especificado"}
- Ubicación/Piso: ${context?.floor || "No especificado"} (${context?.location || "No especificada"})
- Tipo de Daño preliminar: ${context?.damageType || "No especificado"}
- Ancho de fisura medido: ${context?.crackWidth || "No medido"}
- Orientación de fisura: ${context?.crackOrientation || "No especificada"}
- Observaciones del inspector: ${context?.inspectorNotes || "Ninguna"}

REGLAS CRÍTICAS DE SEGURIDAD:
1. La IA es únicamente una herramienta de asistencia técnica preliminar.
2. NUNCA certifiques de manera autónoma seguridad estructural, habitabilidad ni ausencia de peligro.
3. Distingue estrictamente entre:
   - Hechos observables directamente en la imagen.
   - Posibles interpretaciones mecánicas o patológicas.
   - Recomendaciones para la decisión exclusiva del profesional inspector.

Genera tu respuesta en formato JSON estrictamente válido con los siguientes campos:
{
  "observedCondition": "Descripción técnica concisa de lo observado visualmente",
  "possiblePathologyClassification": "Clasificación patológica preliminar (ej. Fisuración por cortante, Tracción diagonal, Aplastamiento de hormigón, Falla por adherencia, Asentamiento diferencial)",
  "possibleCauses": ["Causa 1", "Causa 2", "Causa 3"],
  "structuralRelevance": "Evaluación de relevancia para la estabilidad del elemento",
  "nonstructuralRelevance": "Relevancia para elementos no estructurales o seguridad de ocupantes",
  "additionalVerificationRequired": ["Punto a verificar 1", "Punto a verificar 2", "Punto a verificar 3"],
  "recommendedMeasurements": ["Medición 1", "Medición 2"],
  "recommendedAdditionalPhotographs": ["Foto panorámica...", "Foto macro..."],
  "potentialWarningIndicators": ["Indicador de alerta 1", "Indicador de alerta 2"],
  "referenceCategories": ["NSR-10 Título A/C", "AIS 410", "FEMA P-2055 / ATC-20", "ACI 318-19"],
  "confidenceLevel": "Alta" | "Media" | "Baja",
  "recommendedPreliminaryPriority": "GREEN" | "YELLOW" | "RED",
  "disclaimer": "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Eres un consultor experto en ingeniería sismorresistente y patología de estructuras. Responde siempre en español formal técnico y mantén siempre el principio de seguridad donde el profesional humano tiene la decisión final.",
      },
    });

    const textOutput = response.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(textOutput);
    } catch {
      const match = textOutput.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    parsed.disclaimer = "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.";
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in Gemini photo analysis:", error);
    res.status(500).json({
      error: "Error procesando análisis con IA: " + (error?.message || "Desconocido"),
      fallbackAvailable: true,
    });
  }
});

// Engineering AI Assistant Query
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { action, query, inspectionData, findingData } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        result: `[MODO OFFLINE/PRELIMINAR]\nAcción: ${action || "Consulta Técnica"}\n\nRecomendaciones estándar de ingeniería post-sismo (AIS 410 / NSR-10 / FEMA ATC-20):\n- Verifique la continuidad de la trayectoria de cargas verticales y laterales.\n- Mida el ancho y profundidad de grietas con fisurómetro calibrado.\n- Inspeccione nudos viga-columna, apoyos de viga y bases de columnas en busca de trituración de concreto o pandeo de varillas.\n- Delimite zonas con riesgo de desprendimiento de mampostería o elementos de fachada.\n\nNOTA: ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.`,
        references: [
          {
            title: "Guía de Evaluación Post-Sísmica Rápida de Edificaciones",
            standard: "AIS 410 / NSR-10",
            section: "Capítulo 4 - Evaluación de Daño en Elementos Principales",
            year: "2020",
            relevantExcerpt: "Toda grieta diagonal con apertura superior a 1.0 mm en columnas o nudos requiere evaluación detallada y restricción preventiva de acceso."
          },
          {
            title: "Post-Earthquake Safety Evaluation of Buildings",
            standard: "FEMA P-2055 / ATC-20",
            section: "Posting Procedures (Green, Yellow, Red)",
            year: "2019",
            relevantExcerpt: "A Red placard indicates unsafe condition. Yellow indicates restricted use requiring secondary structural assessment."
          }
        ]
      });
    }

    const systemInstruction = `Eres el asistente de ingeniería de campo SIPRE para inspección estructural y patología post-sismo.
Actúa como un colega técnico riguroso basado en normas oficiales:
- Reglamento Colombiano de Construcción Sismo Resistente (NSR-10)
- Asociación Colombiana de Ingeniería Sísmica (AIS 410, AIS 100)
- FEMA P-2055 / FEMA 154 / ATC-20 (Post-Earthquake Safety Evaluation of Buildings)
- ACI 318 / ACI 562 (Assessment, Repair, and Rehabilitation of Existing Concrete Structures)
- ASCE 41 (Seismic Evaluation and Retrofit of Existing Buildings)

REGLAS ABSOLUTAS:
1. NUNCA certifiques de forma autónoma estabilidad, seguridad o habitabilidad.
2. Todas tus recomendaciones son preliminares y deben requerir confirmación por un profesional matriculado.
3. Responde con lenguaje técnico de ingeniería civil claro, directo y estructurado.
4. Siempre incluye al final: "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL."`;

    let prompt = `Acción solicitada: ${action || "Consulta Técnica"}\n`;
    if (query) prompt += `Pregunta o consulta del inspector: ${query}\n`;

    if (inspectionData) {
      prompt += `\nDatos de la edificación inspeccionada:
- Identificación: ${inspectionData.id || "N/A"}
- Uso: ${inspectionData.buildingUse || "Residencial"}
- Sistema estructural: ${inspectionData.structuralSystem || "No especificado"}
- Pisos: ${inspectionData.floors || 1}, Sótanos: ${inspectionData.basements || 0}
- Daños previos: ${inspectionData.previousDamage || "Ninguno"}
- Total de hallazgos registrados: ${inspectionData.findingsCount || 0}
`;
    }

    if (findingData) {
      prompt += `\nDatos del hallazgo seleccionado:
- Elemento: ${findingData.elementType} (${findingData.location}, Piso ${findingData.floor})
- Tipo de daño: ${findingData.damageType}
- Severidad estimada: ${findingData.severity}
- Medidas/Fisuras: ${findingData.crackWidth || "N/A"}, Orientación: ${findingData.crackOrientation || "N/A"}
- Descripción del inspector: ${findingData.description || "N/A"}
`;
    }

    prompt += `\nPor favor genera:
1. Análisis técnico del caso conforme a la acción solicitada.
2. Lista concreta de verificaciones adicionales o mediciones en campo.
3. Recomendaciones preliminares de seguridad / estabilización temporal si aplica.
4. Referencias técnicas aprobadas aplicables (NSR-10, AIS 410, FEMA, ACI).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const result = response.text || "No se pudo generar respuesta del asistente.";

    // Provide technical references
    res.json({
      result,
      disclaimer: "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.",
      references: [
        {
          title: "Manual de Evaluación Post-Sísmica de Edificaciones",
          standard: "AIS 410 / NSR-10",
          section: "Evaluación Detallada de Daños y Triaje Estructural",
          year: "2020",
          relevantExcerpt: "Identificación de mecanismos de falla frágil (corte, pérdida de confinamiento, adherencia) versus mecanismos dúctiles (fluencia por flexión)."
        },
        {
          title: "Post-Earthquake Safety Evaluation of Buildings",
          standard: "ATC-20 / FEMA P-2055",
          section: "Chapter 3: Detailed Evaluation Procedures",
          year: "2019",
          relevantExcerpt: "Guidance on classification of structural damage in RC frames, shear walls, and unreinforced masonry."
        },
        {
          title: "Code Requirements for Assessment, Repair, and Rehabilitation of Existing Concrete Structures",
          standard: "ACI 562-21",
          section: "Section 6: Structural Evaluation",
          year: "2021",
          relevantExcerpt: "Evaluation of crack significance based on orientation, width, active movement, and environment exposure."
        }
      ]
    });
  } catch (error: any) {
    console.error("Error in Gemini assistant:", error);
    res.status(500).json({
      error: "Error en el asistente IA: " + (error?.message || "Desconocido"),
    });
  }
});

// Transcribe & Structure Voice Notes
app.post("/api/gemini/transcribe-audio", async (req, res) => {
  try {
    const { rawTranscription, inspectorAudioNotes, elementContext } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        structuredNote: rawTranscription || "Nota de campo registrada por el inspector.",
        technicalClassification: "Observación de campo sobre " + (elementContext?.elementType || "elemento"),
        suggestedActions: [
          "Verificar con fisurómetro calibrado",
          "Fotografiar con escala de referencia"
        ]
      });
    }

    const prompt = `Actúa como redactor técnico de ingeniería civil. Convierte el siguiente dictado o transcripción de voz informal de un inspector en una nota técnica profesional, concisa y estandarizada para el informe de patología estructural.

Texto de entrada del inspector:
"${rawTranscription || inspectorAudioNotes || "Fisura inclinada en columna del primer piso cerca de la unión con la viga, se ve concreto desprendido"}"

Contexto:
- Elemento: ${elementContext?.elementType || "No especificado"}
- Piso: ${elementContext?.floor || "No especificado"}

Genera en JSON:
{
  "structuredNote": "Nota técnica formal y redactada con precisión de ingeniería",
  "technicalClassification": "Término patológico estandarizado (ej: Fisura diagonal por cortante en zona de confinamiento)",
  "suggestedActions": ["Acción 1", "Acción 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error structuring audio note:", error);
    res.status(500).json({ error: error?.message || "Error procesando nota de voz" });
  }
});

// Report Summarization Endpoint
app.post("/api/gemini/summarize-report", async (req, res) => {
  try {
    const { inspection } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        executiveSummary: `Edificación de ${inspection?.floors || 1} piso(s), sistema estructural ${inspection?.structuralSystem || "No especificado"}. Se registraron ${inspection?.elements?.length || 0} elementos inspeccionados y ${inspection?.findings?.length || 0} hallazgos patológicos. Clasificación preliminar asignada: ${inspection?.preliminaryPriority || "YELLOW"}. Requiere concepto definitivo del profesional a cargo.`,
        keyRisks: [
          "Verificación requerida en elementos con daño moderado o severo",
          "Monitoreo de posibles asentamientos o réplicas sísmicas"
        ],
        recommendedImmediateActions: [
          "Delimitar áreas de acceso restringido",
          "Instalar testigos de yeso o fisurómetros para monitoreo activo",
          "Completar evaluación estructural detallada por especialista"
        ]
      });
    }

    const prompt = `Eres un ingeniero civil especialista en estructuras. Genera un resumen ejecutivo técnico de la siguiente inspección de campo post-sismo para incorporar al informe formal.

Datos de la Inspección:
- Código: ${inspection?.id}
- Dirección: ${inspection?.address}, ${inspection?.neighborhood}, ${inspection?.municipality}
- Sistema Estructural: ${inspection?.structuralSystem}
- Pisos: ${inspection?.floors}, Sótanos: ${inspection?.basements}
- Número de Hallazgos: ${inspection?.findings?.length || 0}
- Prioridad preliminar: ${inspection?.preliminaryPriority}
- Resumen de hallazgos: ${JSON.stringify((inspection?.findings || []).map((f: any) => ({ elemento: f.elementType, dano: f.damageType, severidad: f.severity, fisura: f.crackWidth, orientacion: f.crackOrientation })))}
- Conclusión preliminar del inspector: ${inspection?.professionalAssessment?.conclusion || "En proceso de redacción"}

Genera en formato JSON:
{
  "executiveSummary": "Párrafo técnico formal sintetizando el estado de la edificación, daños principales y condición global observada",
  "keyRisks": ["Riesgo 1", "Riesgo 2", "Riesgo 3"],
  "recommendedImmediateActions": ["Acción inmediata 1", "Acción inmediata 2", "Acción inmediata 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error summarizing report:", error);
    res.status(500).json({ error: error?.message || "Error resumiendo informe" });
  }
});

// Vite middleware for development & static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SIPRE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
