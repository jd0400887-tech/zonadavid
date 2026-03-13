export interface QAQuestion {
  id: string;
  text: string;
  category: string;
  isCritical?: boolean;
}

export interface QATemplate {
  id: string;
  title: string;
  description: string;
  questions: QAQuestion[];
}

export const QA_TEMPLATES: QATemplate[] = [
  {
    id: 'staff',
    title: 'Auditoría de Presentación Personal',
    description: 'Evaluación de imagen corporativa e higiene del trabajador.',
    questions: [
      { id: 's1', text: 'Uniforme completo, limpio y planchado', category: 'Uniformidad', isCritical: true },
      { id: 's2', text: 'Zapatos de seguridad reglamentarios y limpios', category: 'Uniformidad' },
      { id: 's3', text: 'Gafete / ID visible y en buen estado', category: 'Uniformidad' },
      { id: 's4', text: 'Uñas cortas, limpias y sin esmalte llamativo', category: 'Higiene', isCritical: true },
      { id: 's5', text: 'Cabello recogido o bien arreglado', category: 'Higiene' },
      { id: 's6', text: 'Higiene personal general impecable', category: 'Higiene', isCritical: true },
      { id: 's7', text: 'Sin joyería excesiva o colgante', category: 'Seguridad' },
      { id: 's8', text: 'Uso de guantes / protección si aplica', category: 'Seguridad' },
      { id: 's9', text: 'Puntualidad en el inicio de jornada', category: 'Actitud' },
      { id: 's10', text: 'Disposición y cortesía inicial', category: 'Actitud' },
    ]
  },
  {
    id: 'room',
    title: 'Auditoría de Calidad Técnica',
    description: 'Inspección detallada de limpieza y montaje de habitación.',
    questions: [
      { id: 'r1', text: 'Sábanas estiradas, centradas y sin manchas', category: 'Área de Cama', isCritical: true },
      { id: 'r2', text: 'Almohadas uniformes y bien formadas', category: 'Área de Cama' },
      { id: 'r3', text: 'Edredón / Colcha alineada correctamente', category: 'Área de Cama' },
      { id: 'r4', text: 'Inodoro higienizado y sin manchas', category: 'Baño', isCritical: true },
      { id: 'r5', text: 'Ducha libre de cabellos y sarro', category: 'Baño', isCritical: true },
      { id: 'r6', text: 'Espejos y grifería brillantes (sin huellas)', category: 'Baño' },
      { id: 'r7', text: 'Piso del baño impecable y seco', category: 'Baño' },
      { id: 'r8', text: 'Muebles y TV sin rastro de polvo', category: 'Superficies' },
      { id: 'r9', text: 'Interior de cajones y armarios limpios', category: 'Superficies' },
      { id: 'r10', text: 'Alfombra perfectamente aspirada (bordes incluídos)', category: 'Pisos', isCritical: true },
      { id: 'r11', text: 'Reposición correcta de amenidades', category: 'Montaje' },
      { id: 'r12', text: 'Toallas dobladas y colocadas según estándar', category: 'Montaje' },
    ]
  },
  {
    id: 'hotel',
    title: 'Percepción de Ambiente y Recursos',
    description: 'Evaluación del entorno de trabajo y relación con el hotel.',
    questions: [
      { id: 'h1', text: '¿El hotel provee químicos y materiales suficientes?', category: 'Insumos' },
      { id: 'h2', text: '¿Las aspiradoras y carritos están en buen estado?', category: 'Insumos' },
      { id: 'h3', text: '¿Hay suficiente lencería (sábanas/toallas) disponible?', category: 'Insumos' },
      { id: 'h4', text: '¿El trato del personal del hotel es digno y cordial?', category: 'Relaciones' },
      { id: 'h5', text: '¿Existe comunicación efectiva con el Ama de Llaves?', category: 'Relaciones' },
      { id: 'h6', text: '¿El número de habitaciones asignadas es justo?', category: 'Carga Laboral' },
      { id: 'h7', text: '¿Cuenta con áreas de descanso adecuadas?', category: 'Entorno' },
    ]
  }
];
