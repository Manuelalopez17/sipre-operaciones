import { TechnicalReference } from '../types';
export type { TechnicalReference };

export const APPROVED_TECHNICAL_REFERENCES: TechnicalReference[] = [
  {
    id: 'REF-NSR10-A',
    title: 'Reglamento Colombiano de Construcción Sismo Resistente NSR-10',
    organization: 'Comisión Asesora Permanente para el Régimen de Construcciones Sismo Resistentes',
    standard: 'NSR-10',
    section: 'Título A - Requisitos Generales de Diseño y Construcción Sismo Resistente',
    year: '2010',
    url: 'https://www.asociacioncolombianadeingenieriasismica.org.co/nsr-10/',
    relevantExcerpt: 'Establece los niveles de amenaza sísmica, espectros de diseño y los criterios para garantizar la integridad estructural y la protección de la vida en edificaciones.',
    inspectorNote: 'Referencia fundamental para tipologías estructurales y demandas sísmicas en Colombia.'
  },
  {
    id: 'REF-NSR10-C',
    title: 'NSR-10 Título C - Concreto Estructural',
    organization: 'Asociación Colombiana de Ingeniería Sísmica (AIS)',
    standard: 'NSR-10',
    section: 'Título C.21 - Disposiciones Especiales para Diseño Sísmico',
    year: '2010',
    url: 'https://www.asociacioncolombianadeingenieriasismica.org.co',
    relevantExcerpt: 'Requisitos de confinamiento en zonas críticas de columnas, cuantías mínimas y máximas de acero, anclaje de estribos y prevención de falla frágil por cortante.',
    inspectorNote: 'Aplicable a evaluación de nudos viga-columna y columnas con desprendimiento de recubrimiento.'
  },
  {
    id: 'REF-NSR10-D',
    title: 'NSR-10 Título D - Mampostería Estructural',
    organization: 'Comisión Asesora Permanente NSR',
    standard: 'NSR-10',
    section: 'Título D.1 - Requisitos para Mampostería Confinada y Muros de Carga',
    year: '2010',
    url: 'https://www.asociacioncolombianadeingenieriasismica.org.co',
    relevantExcerpt: 'Espaciamiento máximo de columnetas y vigas de amarre, aparejos, confinamiento de vanos y comportamiento ante fuerzas coplanares y perpendiculares al plano.',
    inspectorNote: 'Esencial para evaluar agrietamientos en escalerilla y separación muro-columna.'
  },
  {
    id: 'REF-AIS-410',
    title: 'Manual de Evaluación y Rehabilitación Sísmica de Edificaciones',
    organization: 'Asociación Colombiana de Ingeniería Sísmica (AIS)',
    standard: 'AIS 410',
    section: 'Capítulo 3: Inspección de Daños Post-Sismo y Formatos de Evaluación Rápida',
    year: '2020',
    url: 'https://www.asociacioncolombianadeingenieriasismica.org.co',
    relevantExcerpt: 'Criterios para clasificación rápida en etiquetas Verde (Inspeccionado/Habitable), Amarillo (Acceso Restringido) y Rojo (Inseguro/Peligro de Colapso).',
    inspectorNote: 'Norma colombiana rectora para triaje e inspección de emergencia post-sismo.'
  },
  {
    id: 'REF-FEMA-ATC20',
    title: 'Procedures for Postearthquake Safety Evaluation of Buildings',
    organization: 'Applied Technology Council / FEMA',
    standard: 'ATC-20 / FEMA P-2055',
    section: 'Chapter 2: Rapid & Detailed Evaluation Placarding System',
    year: '2019',
    url: 'https://www.atcouncil.org/atc-20',
    relevantExcerpt: 'Metodología estandarizada internacional para evaluación de seguridad estructural de emergencia, identificación de pisos blandos, pandeo de columnas y peligro de caída de elementos no estructurales.',
    inspectorNote: 'Criterio para asignación de prioridades Verde, Amarillo y Rojo.'
  },
  {
    id: 'REF-ACI-318',
    title: 'Building Code Requirements for Structural Concrete and Commentary',
    organization: 'American Concrete Institute (ACI)',
    standard: 'ACI 318-19',
    section: 'Chapter 18: Earthquake-Resistant Structures',
    year: '2019',
    url: 'https://www.concrete.org',
    relevantExcerpt: 'Parámetros de cortante por fricción, detallado sísmico y comportamiento dúctil de pórticos de concreto.',
    inspectorNote: 'Referencia técnica para diagnóstico de mecanismos de falla por cortante y pérdida de confinamiento.'
  },
  {
    id: 'REF-ACI-562',
    title: 'Assessment, Repair, and Rehabilitation of Existing Concrete Structures',
    organization: 'American Concrete Institute (ACI)',
    standard: 'ACI 562-21',
    section: 'Chapter 5: Investigation and Evaluation',
    year: '2021',
    url: 'https://www.concrete.org',
    relevantExcerpt: 'Metodología para investigación patológica de concreto degradado, evaluación de anchos de fisura permisibles según ambiente y criterios de apuntalamiento de emergencia.',
    inspectorNote: 'Guía técnica para prescripción de ensayos no destructivos y apuntalamientos provisionales.'
  },
  {
    id: 'REF-ASCE-41',
    title: 'Seismic Evaluation and Retrofit of Existing Buildings',
    organization: 'American Society of Civil Engineers (ASCE)',
    standard: 'ASCE 41-17',
    section: 'Chapter 7: Evaluation of Existing Concrete and Masonry Elements',
    year: '2017',
    url: 'https://www.asce.org',
    relevantExcerpt: 'Niveles de desempeño sísmico: Seguridad de Vida (Life Safety), Ocupación Inmediata (Immediate Occupancy) y Prevención del Colapso (Collapse Prevention).',
    inspectorNote: 'Base para formulación de estudios estructurales detallados y modelación no lineal.'
  }
];

export function searchTechnicalReferences(query: string): TechnicalReference[] {
  if (!query || query.trim() === '') return APPROVED_TECHNICAL_REFERENCES;
  const q = query.toLowerCase();
  return APPROVED_TECHNICAL_REFERENCES.filter(
    (ref) =>
      ref.title.toLowerCase().includes(q) ||
      ref.standard.toLowerCase().includes(q) ||
      ref.section.toLowerCase().includes(q) ||
      ref.relevantExcerpt.toLowerCase().includes(q) ||
      ref.organization.toLowerCase().includes(q)
  );
}
