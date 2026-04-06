// Tipos de dominio del proyecto GeoPuzzle

export interface Solicitud {
  id?: string;
  nombre: string;
  email: string;
  telefono: string;
  centroeducativo: string;
  codigoCentro?: string;
  localidad: string;
  provincia: string;
  departamento: 'geografia' | 'tecnologia' | 'plastica' | 'otro';
  motivacion: string;
  experiencia3d: boolean;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  uid?: string;
  creadoEn: Date | null;
  actualizadoEn?: Date | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  centroeducativo: string;
  provincia: string;
  rol: 'pendiente' | 'aprobado' | 'rechazado' | 'admin';
  creadoEn: Date | null;
}

export interface ForumThread {
  id?: string;
  titulo: string;
  contenido: string;
  autorId: string;
  autorNombre: string;
  centroeducativo: string;
  creadoEn: Date | null;
  tags: string[];
  numRespuestas: number;
}

export interface ForumReply {
  id?: string;
  contenido: string;
  autorId: string;
  autorNombre: string;
  centroeducativo: string;
  creadoEn: Date | null;
}

export interface Cuadrante {
  id: string;        // e.g. "F1-C1"
  fila: number;
  columna: number;
  etiqueta: string;  // e.g. "Sierra Nevada"
  provincia: string;
  asignado: boolean;
  centroId?: string;
  centroNombre?: string;
  fechaAsignacion?: Date | null;
}
