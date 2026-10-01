export type PersonStatus = 'activo' | 'inactivo' | 'suspendido';
export type QrStatus = 'activo' | 'inactivo' | 'revocado';

export type QrEventType =
  | 'CREACION_IDENTIDAD'
  | 'GENERACION_QR'
  | 'LECTURA_INTERNA'
  | 'VALIDACION_OPERATIVA'
  | 'CAMBIO_ESTADO'
  | 'ACTUALIZACION_DATOS';

export interface Person {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  codigoLink: string;
  estado: PersonStatus;
  fechaIncorporacion: string;
  supabaseAuthId?: string | null;
  notas?: string;
  ultimoEscaneo?: string | null;
  totalEscaneos: number;
}

export interface QrIdentity {
  id: string;
  personaId: string;
  tokenPublicoOpaco: string;
  codigoLink: string;
  estado: QrStatus;
  fechaGeneracion: string;
  ultimoEscaneo?: string | null;
  totalEscaneos: number;
  version: number;
}

export interface OperatorActor {
  id: string;
  nombre: string;
  rol: 'ADMINISTRADOR' | 'OPERADOR_LINK';
}

export interface QrEvent {
  id: string;
  qrId: string;
  personaId: string;
  tipo: QrEventType;
  actor: OperatorActor;
  contexto: string;
  notas?: string;
  fecha: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardMetrics {
  totalPersonas: number;
  qrGenerados: number;
  qrActivos: number;
  qrInactivos: number;
  escaneosRegistrados: number;
  personasConActividad: number;
}

export type NavigationSection =
  | 'resumen'
  | 'personas'
  | 'generador'
  | 'escaner'
  | 'actividad'
  | 'configuracion';
