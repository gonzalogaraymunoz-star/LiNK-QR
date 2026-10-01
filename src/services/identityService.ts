import {
  Person,
  QrIdentity,
  QrEvent,
  QrEventType,
  QrStatus,
  PersonStatus,
  DashboardMetrics,
  OperatorActor,
} from '../types/index.ts';
import { getSupabaseClient } from './supabaseClient.ts';

const STORAGE_KEYS = {
  PERSONS: 'link_os_persons_v2',
  QRS: 'link_os_qrs_v2',
  EVENTS: 'link_os_events_v3',
};

export const CURRENT_OPERATOR: OperatorActor = {
  id: 'op_admin_link_01',
  nombre: 'Gonzalo Garay (Admin)',
  rol: 'ADMINISTRADOR',
};

// Initial realistic dataset for LINK OS Control Center
const INITIAL_PERSONS: Person[] = [
  {
    id: 'per_01j7x8a2b3',
    nombre: 'Valentina',
    apellido: 'Rivas Alarcón',
    email: 'valentina.rivas@empresa-partner.cl',
    telefono: '+56 9 8452 1109',
    codigoLink: 'LNK-4091',
    estado: 'activo',
    fechaIncorporacion: '2026-08-10T09:30:00.000Z',
    supabaseAuthId: null,
    notas: 'Colaboradora certificada sede Santiago Centro.',
    ultimoEscaneo: '2026-09-21T09:45:00.000Z',
    totalEscaneos: 21,
  },
  {
    id: 'per_01j7x8c4d5',
    nombre: 'Matías',
    apellido: 'Valenzuela Castro',
    email: 'm.valenzuela@redlink.io',
    telefono: '+56 9 7311 9022',
    codigoLink: 'LNK-8824',
    estado: 'activo',
    fechaIncorporacion: '2026-08-14T11:15:00.000Z',
    supabaseAuthId: null,
    notas: 'Operador de infraestructura técnica.',
    ultimoEscaneo: '2026-09-21T11:20:00.000Z',
    totalEscaneos: 27,
  },
  {
    id: 'per_01j7x8e6f7',
    nombre: 'Camila',
    apellido: 'Silva Henríquez',
    email: 'camila.silva@coop-innovacion.org',
    telefono: '+56 9 6189 4431',
    codigoLink: 'LNK-1205',
    estado: 'activo',
    fechaIncorporacion: '2026-08-20T16:40:00.000Z',
    supabaseAuthId: null,
    notas: 'Miembro directivo red cooperativa.',
    ultimoEscaneo: '2026-09-21T10:50:00.000Z',
    totalEscaneos: 13,
  },
  {
    id: 'per_01j7x8g8h9',
    nombre: 'Joaquín',
    apellido: 'Herrera Montes',
    email: 'jherrera@distribuidora-sur.cl',
    telefono: '+56 9 5502 7819',
    codigoLink: 'LNK-9340',
    estado: 'inactivo',
    fechaIncorporacion: '2026-08-28T08:00:00.000Z',
    supabaseAuthId: null,
    notas: 'Identidad pausada por solicitud administrativa.',
    ultimoEscaneo: null,
    totalEscaneos: 0,
  },
  {
    id: 'per_01j7x8i0j1',
    nombre: 'Sofía',
    apellido: 'Pérez Del Solar',
    email: 'sperez@estudios-asoc.cl',
    telefono: '+56 9 4488 3311',
    codigoLink: 'LNK-3158',
    estado: 'activo',
    fechaIncorporacion: '2026-09-01T15:00:00.000Z',
    supabaseAuthId: null,
    notas: 'Incorporación reciente para validación de acceso.',
    ultimoEscaneo: null,
    totalEscaneos: 0,
  },
];

const INITIAL_QRS: QrIdentity[] = [
  {
    id: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tokenPublicoOpaco: 'lnk_qr_8f4a1c9e7b2d4103',
    codigoLink: 'LNK-4091',
    estado: 'activo',
    fechaGeneracion: '2026-08-10T09:31:12.000Z',
    ultimoEscaneo: '2026-09-21T09:45:00.000Z',
    totalEscaneos: 21,
    version: 1,
  },
  {
    id: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tokenPublicoOpaco: 'lnk_qr_3c7d9e1a5b8f6204',
    codigoLink: 'LNK-8824',
    estado: 'activo',
    fechaGeneracion: '2026-08-14T11:16:00.000Z',
    ultimoEscaneo: '2026-09-21T11:20:00.000Z',
    totalEscaneos: 27,
    version: 1,
  },
  {
    id: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tokenPublicoOpaco: 'lnk_qr_5a2b8c9d1e4f7305',
    codigoLink: 'LNK-1205',
    estado: 'activo',
    fechaGeneracion: '2026-08-20T16:41:20.000Z',
    ultimoEscaneo: '2026-09-21T10:50:00.000Z',
    totalEscaneos: 13,
    version: 1,
  },
  {
    id: 'qr_01k9y1d444',
    personaId: 'per_01j7x8g8h9',
    tokenPublicoOpaco: 'lnk_qr_1e9f4a7c2b5d8406',
    codigoLink: 'LNK-9340',
    estado: 'inactivo',
    fechaGeneracion: '2026-08-28T08:02:00.000Z',
    ultimoEscaneo: null,
    totalEscaneos: 0,
    version: 1,
  },
];

const INITIAL_EVENTS: QrEvent[] = [
  // Creation events
  {
    id: 'evt_01m1a1',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'CREACION_IDENTIDAD',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Registro central de persona en Centro de Control',
    notas: 'Registro inicial de identidad Link',
    fecha: '2026-08-10T09:30:00.000Z',
  },
  {
    id: 'evt_01m1a2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'GENERACION_QR',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Generación de token permanente e idempotente',
    notas: 'Token opaco asignado: lnk_qr_8f4a1c9e7b2d4103',
    fecha: '2026-08-10T09:31:12.000Z',
  },
  {
    id: 'evt_01m1b1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'GENERACION_QR',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Emisión centralizada de credencial QR',
    fecha: '2026-08-14T11:16:00.000Z',
  },
  {
    id: 'evt_01m1c1',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'GENERACION_QR',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Emisión de credencial QR activa',
    fecha: '2026-08-20T16:41:20.000Z',
  },
  {
    id: 'evt_01m1d1',
    qrId: 'qr_01k9y1d444',
    personaId: 'per_01j7x8g8h9',
    tipo: 'CAMBIO_ESTADO',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Suspensión temporal por mantenimiento administrativo',
    notas: 'Estado cambiado a inactivo.',
    fecha: '2026-09-02T12:00:00.000Z',
  },

  // Historical Daily Scan Events (Validaciones operativas y lecturas internas)
  // 2026-09-07
  {
    id: 'evt_scan_0907_1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Control de acceso matutino',
    notas: 'Verificación de identidad técnica',
    fecha: '2026-09-07T08:45:00.000Z',
  },
  {
    id: 'evt_scan_0907_2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en torniquete A',
    fecha: '2026-09-07T14:10:00.000Z',
  },

  // 2026-09-08
  {
    id: 'evt_scan_0908_1',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Auditoría presencial sede central',
    fecha: '2026-09-08T09:15:00.000Z',
  },
  {
    id: 'evt_scan_0908_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Calibración óptica de escáner',
    fecha: '2026-09-08T16:30:00.000Z',
  },

  // 2026-09-09
  {
    id: 'evt_scan_0909_1',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en sala de conferencias',
    fecha: '2026-09-09T10:00:00.000Z',
  },
  {
    id: 'evt_scan_0909_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Acceso a centro de cómputo',
    fecha: '2026-09-09T13:20:00.000Z',
  },
  {
    id: 'evt_scan_0909_3',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Comprobación de token opaco',
    fecha: '2026-09-09T18:00:00.000Z',
  },

  // 2026-09-10
  {
    id: 'evt_scan_0910_1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Ingreso a turno matutino',
    fecha: '2026-09-10T08:10:00.000Z',
  },
  {
    id: 'evt_scan_0910_2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en recepción corporativa',
    fecha: '2026-09-10T11:40:00.000Z',
  },
  {
    id: 'evt_scan_0910_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Inspección de credencial activa',
    fecha: '2026-09-10T15:25:00.000Z',
  },
  {
    id: 'evt_scan_0910_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Punto de control 03',
    fecha: '2026-09-10T19:05:00.000Z',
  },

  // 2026-09-11
  {
    id: 'evt_scan_0911_1',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Control vehicular y peatonal',
    fecha: '2026-09-11T09:00:00.000Z',
  },
  {
    id: 'evt_scan_0911_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Auditoría de perímetro técnico',
    fecha: '2026-09-11T14:15:00.000Z',
  },
  {
    id: 'evt_scan_0911_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en módulo de atención',
    fecha: '2026-09-11T17:50:00.000Z',
  },

  // 2026-09-12
  {
    id: 'evt_scan_0912_1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Acceso autorizado sede poniente',
    fecha: '2026-09-12T10:10:00.000Z',
  },
  {
    id: 'evt_scan_0912_2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Prueba de compatibilidad con escáner de alta velocidad',
    fecha: '2026-09-12T12:30:00.000Z',
  },
  {
    id: 'evt_scan_0912_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Control de identidad en ingreso',
    fecha: '2026-09-12T14:40:00.000Z',
  },
  {
    id: 'evt_scan_0912_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Revisión en zona operativa',
    fecha: '2026-09-12T18:20:00.000Z',
  },
  {
    id: 'evt_scan_0912_5',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Salida de sede corporativa',
    fecha: '2026-09-12T20:00:00.000Z',
  },

  // 2026-09-13
  {
    id: 'evt_scan_0913_1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Guardia de fin de semana',
    fecha: '2026-09-13T11:00:00.000Z',
  },
  {
    id: 'evt_scan_0913_2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Verificación periódica de integridad',
    fecha: '2026-09-13T16:15:00.000Z',
  },

  // 2026-09-14
  {
    id: 'evt_scan_0914_1',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación de jornada laboral',
    fecha: '2026-09-14T08:50:00.000Z',
  },
  {
    id: 'evt_scan_0914_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Verificación en garita de control',
    fecha: '2026-09-14T11:20:00.000Z',
  },
  {
    id: 'evt_scan_0914_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Registro de asistencia técnica',
    fecha: '2026-09-14T14:45:00.000Z',
  },
  {
    id: 'evt_scan_0914_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Monitoreo de latencia de lectura',
    fecha: '2026-09-14T17:30:00.000Z',
  },

  // 2026-09-15
  {
    id: 'evt_scan_0915_1',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Punto de control este',
    fecha: '2026-09-15T08:30:00.000Z',
  },
  {
    id: 'evt_scan_0915_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Acceso a infraestructura',
    fecha: '2026-09-15T10:15:00.000Z',
  },
  {
    id: 'evt_scan_0915_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en sede norte',
    fecha: '2026-09-15T12:40:00.000Z',
  },
  {
    id: 'evt_scan_0915_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Prueba de lectura con cámara secundaria',
    fecha: '2026-09-15T15:10:00.000Z',
  },
  {
    id: 'evt_scan_0915_5',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Punto de validación B',
    fecha: '2026-09-15T17:00:00.000Z',
  },
  {
    id: 'evt_scan_0915_6',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Salida de sede operativa',
    fecha: '2026-09-15T19:30:00.000Z',
  },

  // 2026-09-16
  {
    id: 'evt_scan_0916_1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Control perimetral matutino',
    fecha: '2026-09-16T08:20:00.000Z',
  },
  {
    id: 'evt_scan_0916_2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Acceso sala de reuniones principal',
    fecha: '2026-09-16T11:05:00.000Z',
  },
  {
    id: 'evt_scan_0916_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Verificación de credencial operativa',
    fecha: '2026-09-16T14:50:00.000Z',
  },
  {
    id: 'evt_scan_0916_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Testeo de reconocimiento de código LNK-8824',
    fecha: '2026-09-16T18:15:00.000Z',
  },

  // 2026-09-17 (Pico de actividad)
  {
    id: 'evt_scan_0917_1',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Apertura de jornada y control de ingreso',
    fecha: '2026-09-17T08:00:00.000Z',
  },
  {
    id: 'evt_scan_0917_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en garita norte',
    fecha: '2026-09-17T09:30:00.000Z',
  },
  {
    id: 'evt_scan_0917_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Inspección de credenciales en terreno',
    fecha: '2026-09-17T11:15:00.000Z',
  },
  {
    id: 'evt_scan_0917_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Reingreso vespertino a laboratorio',
    fecha: '2026-09-17T14:00:00.000Z',
  },
  {
    id: 'evt_scan_0917_5',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Auditoría de consistencia de hash opaco',
    fecha: '2026-09-17T15:45:00.000Z',
  },
  {
    id: 'evt_scan_0917_6',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en acceso sur',
    fecha: '2026-09-17T17:30:00.000Z',
  },
  {
    id: 'evt_scan_0917_7',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Cierre de guardia y control final',
    fecha: '2026-09-17T20:10:00.000Z',
  },

  // 2026-09-18
  {
    id: 'evt_scan_0918_1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Acceso matutino',
    fecha: '2026-09-18T08:15:00.000Z',
  },
  {
    id: 'evt_scan_0918_2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en recepción central',
    fecha: '2026-09-18T10:40:00.000Z',
  },
  {
    id: 'evt_scan_0918_3',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Auditoría interna de acceso en sede central',
    notas: 'Comprobación de validez operativa. Validación ≠ consumo comercial.',
    fecha: '2026-09-18T14:22:10.000Z',
  },
  {
    id: 'evt_scan_0918_4',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Control de autenticidad en punto exterior',
    fecha: '2026-09-18T16:50:00.000Z',
  },
  {
    id: 'evt_scan_0918_5',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Diagnóstico de respuesta en servidor',
    fecha: '2026-09-18T18:30:00.000Z',
  },

  // 2026-09-19
  {
    id: 'evt_scan_0919_1',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Ingreso matutino a dependencias',
    fecha: '2026-09-19T08:40:00.000Z',
  },
  {
    id: 'evt_scan_0919_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en módulo móvil',
    fecha: '2026-09-19T11:15:00.000Z',
  },
  {
    id: 'evt_scan_0919_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Verificación en sede corporativa',
    fecha: '2026-09-19T14:30:00.000Z',
  },
  {
    id: 'evt_scan_0919_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Prueba de lector interno en Centro de Control',
    notas: 'Lectura de diagnóstico de cámara y reconocimiento óptico.',
    fecha: '2026-09-19T18:05:44.000Z',
  },
  {
    id: 'evt_scan_0919_5',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Control nocturno de salida',
    fecha: '2026-09-19T21:00:00.000Z',
  },

  // 2026-09-20
  {
    id: 'evt_scan_0920_1',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Control de autenticidad en terreno',
    fecha: '2026-09-20T10:12:00.000Z',
  },
  {
    id: 'evt_scan_0920_2',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en acceso oriente',
    fecha: '2026-09-20T12:45:00.000Z',
  },
  {
    id: 'evt_scan_0920_3',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Auditoría en punto de enlace',
    fecha: '2026-09-20T15:20:00.000Z',
  },
  {
    id: 'evt_scan_0920_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Verificación de latencia de red',
    fecha: '2026-09-20T17:50:00.000Z',
  },
  {
    id: 'evt_scan_0920_5',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Registro de salida de turno',
    fecha: '2026-09-20T19:40:00.000Z',
  },

  // 2026-09-21 (Hoy)
  {
    id: 'evt_scan_0921_1',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Validación en torniquete principal',
    fecha: '2026-09-21T08:30:00.000Z',
  },
  {
    id: 'evt_scan_0921_2',
    qrId: 'qr_01k9y1a111',
    personaId: 'per_01j7x8a2b3',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_01', nombre: 'Inspector LINK', rol: 'OPERADOR_LINK' },
    contexto: 'Control de acceso a edificio corporativo',
    fecha: '2026-09-21T09:45:00.000Z',
  },
  {
    id: 'evt_scan_0921_3',
    qrId: 'qr_01k9y1c333',
    personaId: 'per_01j7x8e6f7',
    tipo: 'VALIDACION_OPERATIVA',
    actor: { id: 'op_operador_02', nombre: 'Operador Punto Control', rol: 'OPERADOR_LINK' },
    contexto: 'Inspección en punto de control',
    fecha: '2026-09-21T10:50:00.000Z',
  },
  {
    id: 'evt_scan_0921_4',
    qrId: 'qr_01k9y1b222',
    personaId: 'per_01j7x8c4d5',
    tipo: 'LECTURA_INTERNA',
    actor: { id: 'op_admin_link_01', nombre: 'Gonzalo Garay (Admin)', rol: 'ADMINISTRADOR' },
    contexto: 'Lectura de diagnóstico desde escáner web',
    fecha: '2026-09-21T11:20:00.000Z',
  },
];

// In-memory / local storage helpers
function getLocalPersons(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(INITIAL_PERSONS));
      return INITIAL_PERSONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PERSONS;
  }
}

function saveLocalPersons(persons: Person[]) {
  localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(persons));
}

function getLocalQrs(): QrIdentity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QRS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(INITIAL_QRS));
      return INITIAL_QRS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_QRS;
  }
}

function saveLocalQrs(qrs: QrIdentity[]) {
  localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));
}

function getLocalEvents(): QrEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length < 10) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return parsed;
  } catch {
    return INITIAL_EVENTS;
  }
}

function saveLocalEvents(events: QrEvent[]) {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

// Generate unique Link Code (LNK-XXXX)
function generateLinkCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `LNK-${num}`;
}

// Generate opaque random public token without PII
function generateOpaqueQrToken(): string {
  const chars = '0123456789abcdef';
  let token = 'lnk_qr_';
  for (let i = 0; i < 16; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// ==========================================
// INDEPENDENT SERVICE LAYER (SUPABASE-READY)
// ==========================================

export async function createPerson(data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  notas?: string;
  actor?: OperatorActor;
}): Promise<Person> {
  const actor = data.actor || CURRENT_OPERATOR;
  const persons = getLocalPersons();

  // Generate unique Link Code
  let codigoLink = generateLinkCode();
  while (persons.some((p) => p.codigoLink === codigoLink)) {
    codigoLink = generateLinkCode();
  }

  const now = new Date().toISOString();
  const newPerson: Person = {
    id: `per_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    nombre: data.nombre.trim(),
    apellido: data.apellido.trim(),
    email: data.email.trim().toLowerCase(),
    telefono: data.telefono?.trim() || undefined,
    codigoLink,
    estado: 'activo',
    fechaIncorporacion: now,
    supabaseAuthId: null,
    notas: data.notas?.trim() || undefined,
    ultimoEscaneo: null,
    totalEscaneos: 0,
  };

  persons.unshift(newPerson);
  saveLocalPersons(persons);

  // Synchronize to Supabase if connected
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('personas').insert({
        id: newPerson.id,
        nombre: newPerson.nombre,
        apellido: newPerson.apellido,
        email: newPerson.email,
        telefono: newPerson.telefono,
        codigo_link: newPerson.codigoLink,
        estado: newPerson.estado,
        fecha_incorporacion: newPerson.fechaIncorporacion,
        supabase_auth_id: newPerson.supabaseAuthId,
        notas: newPerson.notas,
      });
    } catch (err) {
      console.warn('Supabase sync warning on createPerson:', err);
    }
  }

  // Register identity creation event
  await registerQrEvent({
    qrId: 'pending',
    personaId: newPerson.id,
    tipo: 'CREACION_IDENTIDAD',
    actor,
    contexto: 'Alta de persona registrada por administrador en Centro de Control',
    notas: `Identidad creada con código ${newPerson.codigoLink}`,
  });

  return newPerson;
}

export async function updatePerson(
  id: string,
  updates: Partial<Pick<Person, 'nombre' | 'apellido' | 'email' | 'telefono' | 'notas'>>,
  actor: OperatorActor = CURRENT_OPERATOR
): Promise<Person | null> {
  const persons = getLocalPersons();
  const index = persons.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = persons[index];
  const updated: Person = {
    ...current,
    ...updates,
  };

  persons[index] = updated;
  saveLocalPersons(persons);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('personas').update({
        nombre: updated.nombre,
        apellido: updated.apellido,
        email: updated.email,
        telefono: updated.telefono,
        notas: updated.notas,
      }).eq('id', id);
    } catch (err) {
      console.warn('Supabase sync warning on updatePerson:', err);
    }
  }

  const qr = await getQrByPersonaId(id);
  await registerQrEvent({
    qrId: qr?.id || 'none',
    personaId: id,
    tipo: 'ACTUALIZACION_DATOS',
    actor,
    contexto: 'Actualización de datos de contacto por administrador',
  });

  return updated;
}

export async function getPerson(id: string): Promise<Person | null> {
  const persons = getLocalPersons();
  return persons.find((p) => p.id === id) || null;
}

export async function getPersonByCode(codigoLink: string): Promise<Person | null> {
  const cleanCode = codigoLink.trim().toUpperCase();
  const persons = getLocalPersons();
  return persons.find((p) => p.codigoLink.toUpperCase() === cleanCode) || null;
}

export async function getAllPersons(): Promise<Person[]> {
  return getLocalPersons();
}

/**
 * Core IDEMPOTENT method:
 * 1 PERSONA = 1 IDENTIDAD LINK = 1 QR ÚNICO Y PERMANENTE
 * If a QR identity already exists for this personId, returns the existing one.
 * If not, generates a unique, opaque, permanent QR token and stores it.
 */
export async function getOrCreateQr(
  personaId: string,
  actor: OperatorActor = CURRENT_OPERATOR
): Promise<QrIdentity> {
  const qrs = getLocalQrs();
  const existing = qrs.find((q) => q.personaId === personaId);
  if (existing) {
    return existing;
  }

  const person = await getPerson(personaId);
  if (!person) {
    throw new Error(`No se encontró la persona con ID ${personaId}`);
  }

  const now = new Date().toISOString();
  let token = generateOpaqueQrToken();
  while (qrs.some((q) => q.tokenPublicoOpaco === token)) {
    token = generateOpaqueQrToken();
  }

  const newQr: QrIdentity = {
    id: `qr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    personaId,
    tokenPublicoOpaco: token,
    codigoLink: person.codigoLink,
    estado: 'activo',
    fechaGeneracion: now,
    ultimoEscaneo: null,
    totalEscaneos: 0,
    version: 1,
  };

  qrs.unshift(newQr);
  saveLocalQrs(qrs);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('identidades_qr').insert({
        id: newQr.id,
        persona_id: newQr.personaId,
        token_publico_opaco: newQr.tokenPublicoOpaco,
        codigo_link: newQr.codigoLink,
        estado: newQr.estado,
        fecha_generacion: newQr.fechaGeneracion,
        version: newQr.version,
      });
    } catch (err) {
      console.warn('Supabase sync warning on getOrCreateQr:', err);
    }
  }

  await registerQrEvent({
    qrId: newQr.id,
    personaId,
    tipo: 'GENERACION_QR',
    actor,
    contexto: 'Emisión de QR permanente único e idempotente',
    notas: `Referencia opaca creada: ${newQr.tokenPublicoOpaco}`,
  });

  return newQr;
}

export async function getQrByPersonaId(personaId: string): Promise<QrIdentity | null> {
  const qrs = getLocalQrs();
  return qrs.find((q) => q.personaId === personaId) || null;
}

/**
 * Resolves a QR from its public opaque token or its human-readable LINK code.
 * Validates identity and returns both the QR identity and the administrative Person record.
 */
export async function resolveQrIdentity(
  qrTokenOrCode: string
): Promise<{ qr: QrIdentity; person: Person } | null> {
  const query = qrTokenOrCode.trim();
  const qrs = getLocalQrs();
  const persons = getLocalPersons();

  // Look up by opaque token or LINK code
  const qr = qrs.find(
    (q) =>
      q.tokenPublicoOpaco.toLowerCase() === query.toLowerCase() ||
      q.codigoLink.toUpperCase() === query.toUpperCase()
  );

  if (!qr) {
    // Check if user entered a LINK code directly for a person whose QR was not generated yet
    const p = persons.find((p) => p.codigoLink.toUpperCase() === query.toUpperCase());
    if (p) {
      const generated = await getOrCreateQr(p.id);
      return { qr: generated, person: p };
    }
    return null;
  }

  const person = persons.find((p) => p.id === qr.personaId);
  if (!person) return null;

  return { qr, person };
}

export async function getQrActivity(qrId: string): Promise<QrEvent[]> {
  const events = getLocalEvents();
  return events
    .filter((e) => e.qrId === qrId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function getPersonActivity(personaId: string): Promise<QrEvent[]> {
  const events = getLocalEvents();
  return events
    .filter((e) => e.personaId === personaId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function getAllActivity(): Promise<QrEvent[]> {
  const events = getLocalEvents();
  return [...events].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

export async function registerQrEvent(data: {
  qrId: string;
  personaId: string;
  tipo: QrEventType;
  actor: OperatorActor;
  contexto: string;
  notas?: string;
  metadata?: Record<string, unknown>;
}): Promise<QrEvent> {
  const events = getLocalEvents();
  const now = new Date().toISOString();

  const newEvent: QrEvent = {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    qrId: data.qrId,
    personaId: data.personaId,
    tipo: data.tipo,
    actor: data.actor,
    contexto: data.contexto,
    notas: data.notas,
    fecha: now,
    metadata: data.metadata,
  };

  events.unshift(newEvent);
  saveLocalEvents(events);

  // If this was an authorized scan or validation, increment scan counter on both QR and Person
  if (data.tipo === 'LECTURA_INTERNA' || data.tipo === 'VALIDACION_OPERATIVA') {
    const qrs = getLocalQrs();
    const qrIdx = qrs.findIndex((q) => q.id === data.qrId);
    if (qrIdx !== -1) {
      qrs[qrIdx].totalEscaneos = (qrs[qrIdx].totalEscaneos || 0) + 1;
      qrs[qrIdx].ultimoEscaneo = now;
      saveLocalQrs(qrs);
    }

    const persons = getLocalPersons();
    const pIdx = persons.findIndex((p) => p.id === data.personaId);
    if (pIdx !== -1) {
      persons[pIdx].totalEscaneos = (persons[pIdx].totalEscaneos || 0) + 1;
      persons[pIdx].ultimoEscaneo = now;
      saveLocalPersons(persons);
    }
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('eventos_qr').insert({
        id: newEvent.id,
        qr_id: newEvent.qrId,
        persona_id: newEvent.personaId,
        tipo: newEvent.tipo,
        actor_id: newEvent.actor.id,
        actor_nombre: newEvent.actor.nombre,
        actor_rol: newEvent.actor.rol,
        contexto: newEvent.contexto,
        notas: newEvent.notas,
        fecha: newEvent.fecha,
        metadata: newEvent.metadata,
      });
    } catch (err) {
      console.warn('Supabase sync warning on registerQrEvent:', err);
    }
  }

  return newEvent;
}

export async function setQrStatus(
  qrId: string,
  status: QrStatus,
  reason: string,
  actor: OperatorActor = CURRENT_OPERATOR
): Promise<QrIdentity> {
  const qrs = getLocalQrs();
  const index = qrs.findIndex((q) => q.id === qrId);
  if (index === -1) {
    throw new Error(`QR no encontrado con ID ${qrId}`);
  }

  const previousStatus = qrs[index].estado;
  qrs[index].estado = status;
  saveLocalQrs(qrs);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('identidades_qr').update({ estado: status }).eq('id', qrId);
    } catch (err) {
      console.warn('Supabase sync warning on setQrStatus:', err);
    }
  }

  await registerQrEvent({
    qrId,
    personaId: qrs[index].personaId,
    tipo: 'CAMBIO_ESTADO',
    actor,
    contexto: `Cambio de estado QR de '${previousStatus}' a '${status}'`,
    notas: `Motivo administrativo: ${reason}`,
  });

  return qrs[index];
}

export async function setPersonStatus(
  personaId: string,
  status: PersonStatus,
  reason: string,
  actor: OperatorActor = CURRENT_OPERATOR
): Promise<Person> {
  const persons = getLocalPersons();
  const index = persons.findIndex((p) => p.id === personaId);
  if (index === -1) {
    throw new Error(`Persona no encontrada con ID ${personaId}`);
  }

  const previousStatus = persons[index].estado;
  persons[index].estado = status;
  saveLocalPersons(persons);

  // Keep QR status in sync if suspended or deactivated
  const qr = await getQrByPersonaId(personaId);
  if (qr) {
    if (status === 'inactivo' || status === 'suspendido') {
      await setQrStatus(qr.id, 'inactivo', `Sincronizado con estado de la persona: ${reason}`, actor);
    } else if (status === 'activo' && qr.estado !== 'revocado') {
      await setQrStatus(qr.id, 'activo', `Reactivación de persona: ${reason}`, actor);
    }
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('personas').update({ estado: status }).eq('id', personaId);
    } catch (err) {
      console.warn('Supabase sync warning on setPersonStatus:', err);
    }
  }

  await registerQrEvent({
    qrId: qr?.id || 'none',
    personaId,
    tipo: 'CAMBIO_ESTADO',
    actor,
    contexto: `Estado de persona modificado de '${previousStatus}' a '${status}'`,
    notas: reason,
  });

  return persons[index];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const persons = getLocalPersons();
  const qrs = getLocalQrs();

  const totalPersonas = persons.length;
  const qrGenerados = qrs.length;
  const qrActivos = qrs.filter((q) => q.estado === 'activo').length;
  const qrInactivos = qrs.filter((q) => q.estado !== 'activo').length;
  const escaneosRegistrados = qrs.reduce((acc, curr) => acc + (curr.totalEscaneos || 0), 0);
  const personasConActividad = persons.filter((p) => (p.totalEscaneos || 0) > 0).length;

  return {
    totalPersonas,
    qrGenerados,
    qrActivos,
    qrInactivos,
    escaneosRegistrados,
    personasConActividad,
  };
}

export function resetDemoData() {
  localStorage.setItem(STORAGE_KEYS.PERSONS, JSON.stringify(INITIAL_PERSONS));
  localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(INITIAL_QRS));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
}

export function generateSupabaseDDL(): string {
  return `-- ================================================================
-- LINK OS QR // ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Arquitectura Compartida: Centro de Control (01) & LINK Beneficios (02)
-- ================================================================

-- 1. TABLA: PERSONAS (Central Identity)
CREATE TABLE IF NOT EXISTS public.personas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  codigo_link TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  fecha_incorporacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  supabase_auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: IDENTIDADES QR (1 Persona = 1 Identidad = 1 QR Idempotente)
CREATE TABLE IF NOT EXISTS public.identidades_qr (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL UNIQUE REFERENCES public.personas(id) ON DELETE CASCADE,
  token_publico_opaco TEXT NOT NULL UNIQUE,
  codigo_link TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'revocado')),
  fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  total_escaneos INTEGER NOT NULL DEFAULT 0,
  ultimo_escaneo TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: EVENTOS Y MOTOR DE COMPORTAMIENTO
-- Distingue estrictamente: ESCANEO ≠ CONSUMO, VALIDACIÓN ≠ COMPRA, EVENTO ≠ COMISIÓN
CREATE TABLE IF NOT EXISTS public.eventos_qr (
  id TEXT PRIMARY KEY,
  qr_id TEXT NOT NULL,
  persona_id TEXT NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'CREACION_IDENTIDAD',
    'GENERACION_QR',
    'LECTURA_INTERNA',
    'VALIDACION_OPERATIVA',
    'CAMBIO_ESTADO',
    'ACTUALIZACION_DATOS'
  )),
  actor_id TEXT NOT NULL,
  actor_nombre TEXT NOT NULL,
  actor_rol TEXT NOT NULL CHECK (actor_rol IN ('ADMINISTRADOR', 'OPERADOR_LINK')),
  contexto TEXT NOT NULL,
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_personas_codigo_link ON public.personas(codigo_link);
CREATE INDEX IF NOT EXISTS idx_identidades_qr_token ON public.identidades_qr(token_publico_opaco);
CREATE INDEX IF NOT EXISTS idx_eventos_qr_persona ON public.eventos_qr(persona_id);
CREATE INDEX IF NOT EXISTS idx_eventos_qr_fecha ON public.eventos_qr(fecha DESC);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identidades_qr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_qr ENABLE ROW LEVEL SECURITY;

-- Política: Operadores y Administradores de LINK OS tienen control completo
CREATE POLICY "Operadores autorizados LINK OS gestionan personas"
  ON public.personas FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Operadores autorizados LINK OS gestionan QRs"
  ON public.identidades_qr FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Operadores autorizados LINK OS auditan eventos"
  ON public.eventos_qr FOR ALL
  USING (auth.role() = 'authenticated');
`;
}
