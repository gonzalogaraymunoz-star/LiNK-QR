import React, { useState, useEffect } from 'react';
import { Person, QrIdentity, QrEvent, PersonStatus, QrStatus } from '../types/index.ts';
import { QrCodeRenderer } from './QrCodeRenderer.tsx';
import {
  getOrCreateQr,
  getPersonActivity,
  setPersonStatus,
  setQrStatus,
  updatePerson,
} from '../services/identityService.ts';
import {
  X,
  User,
  QrCode,
  Activity,
  History,
  Shield,
  Edit2,
  Save,
  Clock,
  Phone,
  Mail,
  Calendar,
  Layers,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface FichaPersonaModalProps {
  person: Person | null;
  onClose: () => void;
  onRefresh: () => void;
  onNavigateToScannerWithToken?: (token: string) => void;
}

export const FichaPersonaModal: React.FC<FichaPersonaModalProps> = ({
  person,
  onClose,
  onRefresh,
  onNavigateToScannerWithToken,
}) => {
  const [activeTab, setActiveTab] = useState<'identidad' | 'qr' | 'comportamiento' | 'historial' | 'administracion'>('identidad');
  const [qr, setQr] = useState<QrIdentity | null>(null);
  const [activity, setActivity] = useState<QrEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editNotas, setEditNotas] = useState('');

  // Status management reason
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    if (!person) return;

    setEditNombre(person.nombre);
    setEditApellido(person.apellido);
    setEditEmail(person.email);
    setEditTelefono(person.telefono || '');
    setEditNotas(person.notas || '');

    const loadData = async () => {
      setLoading(true);
      try {
        const qrRecord = await getOrCreateQr(person.id);
        setQr(qrRecord);
        const events = await getPersonActivity(person.id);
        setActivity(events);
      } catch (err) {
        console.error('Error loading person 360 data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [person]);

  if (!person) return null;

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePerson(person.id, {
      nombre: editNombre,
      apellido: editApellido,
      email: editEmail,
      telefono: editTelefono,
      notas: editNotas,
    });
    setIsEditing(false);
    onRefresh();
  };

  const handleTogglePersonStatus = async (newStatus: PersonStatus) => {
    const reason = statusReason.trim() || `Modificación administrativa a '${newStatus}'`;
    await setPersonStatus(person.id, newStatus, reason);
    setStatusReason('');
    const events = await getPersonActivity(person.id);
    setActivity(events);
    onRefresh();
  };

  const handleToggleQrStatus = async (newStatus: QrStatus) => {
    if (!qr) return;
    const reason = statusReason.trim() || `Ajuste operativo de estado QR a '${newStatus}'`;
    const updated = await setQrStatus(qr.id, newStatus, reason);
    setQr(updated);
    setStatusReason('');
    const events = await getPersonActivity(person.id);
    setActivity(events);
    onRefresh();
  };

  // Behavioral metrics calculation
  const firstEvent = activity.length > 0 ? activity[activity.length - 1] : null;
  const lastScan = activity.find((e) => e.tipo === 'LECTURA_INTERNA' || e.tipo === 'VALIDACION_OPERATIVA');
  const daysActive = Math.max(
    1,
    Math.round((Date.now() - new Date(person.fechaIncorporacion).getTime()) / (1000 * 60 * 60 * 24))
  );
  const scanFrequency = ((person.totalEscaneos / daysActive) * 7).toFixed(1); // scans per week

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#11120f]/80 backdrop-blur-xs">
      <div className="bg-[#fffdf7] w-full max-w-4xl max-h-[90vh] rounded-2xl border-2 border-[#11120f] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Exclusively Administrative */}
        <div className="bg-[#11120f] text-[#fffdf7] px-6 py-4 flex items-center justify-between border-b border-[#33352c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#252820] flex items-center justify-center text-[#d8ff58] font-bold border border-[#3e4235]">
              {person.nombre.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-[#fffdf7]">
                  {person.nombre} {person.apellido}
                </h3>
                <span className="font-mono text-xs bg-[#d8ff58] text-[#11120f] px-2 py-0.5 rounded font-bold">
                  {person.codigoLink}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                    person.estado === 'activo'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {person.estado}
                </span>
              </div>
              <p className="text-xs text-[#66685f]">
                Ficha Administrativa 360 // Control de Identidad y Ciclo de Vida
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#252820] hover:bg-[#33352c] text-[#e9e2d3] flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ficha"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Navigation Tabs within the 360 Record */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#e9e2d3] bg-[#f4f0e6]/50 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('identidad')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'identidad'
                ? 'border-[#11120f] bg-[#fffdf7] text-[#11120f]'
                : 'border-transparent text-[#66685f] hover:text-[#11120f]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Identidad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'qr'
                ? 'border-[#11120f] bg-[#fffdf7] text-[#11120f]'
                : 'border-transparent text-[#66685f] hover:text-[#11120f]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Asignado</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comportamiento')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'comportamiento'
                ? 'border-[#11120f] bg-[#fffdf7] text-[#11120f]'
                : 'border-transparent text-[#66685f] hover:text-[#11120f]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Comportamiento</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'historial'
                ? 'border-[#11120f] bg-[#fffdf7] text-[#11120f]'
                : 'border-transparent text-[#66685f] hover:text-[#11120f]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({activity.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('administracion')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'administracion'
                ? 'border-[#11120f] bg-[#fffdf7] text-[#11120f]'
                : 'border-transparent text-[#66685f] hover:text-[#11120f]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Administración</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#fffdf7]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-[#66685f] gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#11120f]" />
              <span>Cargando datos de identidad...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: IDENTIDAD */}
              {activeTab === 'identidad' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#11120f]">Datos de Identidad Registrada</h4>
                      <p className="text-xs text-[#66685f]">
                        Información administrativa central. No requiere que el cliente inicie sesión en LINK OS.
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded-lg text-xs font-medium cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-4 bg-[#f4f0e6]/40 p-5 rounded-xl border border-[#e9e2d3]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#11120f] mb-1">Nombre</label>
                          <input
                            type="text"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#11120f] mb-1">Apellido</label>
                          <input
                            type="text"
                            value={editApellido}
                            onChange={(e) => setEditApellido(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#11120f] mb-1">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#11120f] mb-1">Teléfono (opcional)</label>
                          <input
                            type="tel"
                            value={editTelefono}
                            onChange={(e) => setEditTelefono(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#11120f] mb-1">Notas Administrativas</label>
                        <textarea
                          rows={2}
                          value={editNotas}
                          onChange={(e) => setEditNotas(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 text-xs text-[#66685f] hover:text-[#11120f] cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#11120f] text-[#d8ff58] rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar Cambios</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7] space-y-3">
                        <div className="flex items-center gap-2 text-xs text-[#66685f]">
                          <Mail className="w-4 h-4 text-[#11120f]" />
                          <span className="font-mono">{person.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#66685f]">
                          <Phone className="w-4 h-4 text-[#11120f]" />
                          <span>{person.telefono || 'Sin teléfono registrado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#66685f]">
                          <Calendar className="w-4 h-4 text-[#11120f]" />
                          <span>Incorporación: {new Date(person.fechaIncorporacion).toLocaleDateString('es-CL')}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7] space-y-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Layers className="w-4 h-4 text-[#11120f]" />
                          <span className="text-[#66685f]">Código LINK:</span>
                          <span className="font-mono font-bold text-[#11120f]">{person.codigoLink}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Shield className="w-4 h-4 text-[#11120f]" />
                          <span className="text-[#66685f]">Vinculación Supabase Auth:</span>
                          <span className="font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            {person.supabaseAuthId || 'Pendiente de portal cliente'}
                          </span>
                        </div>
                        {person.notas && (
                          <div className="text-xs text-[#66685f] bg-[#f4f0e6] p-2.5 rounded-lg">
                            <span className="font-semibold text-[#11120f]">Nota interna: </span>
                            {person.notas}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QR ASIGNADO */}
              {activeTab === 'qr' && (
                <div className="space-y-6">
                  {qr ? (
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
                      <QrCodeRenderer
                        token={qr.tokenPublicoOpaco}
                        codigoLink={qr.codigoLink}
                        nombrePersona={`${person.nombre} ${person.apellido}`}
                        size={220}
                        showControls={true}
                      />

                      <div className="flex-1 space-y-4 w-full">
                        <div className="bg-[#f4f0e6]/50 p-4 rounded-xl border border-[#e9e2d3] space-y-3">
                          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#11120f]">
                            Parámetros Técnicos del QR Permanente
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-[#66685f] block text-[11px]">ID en Base de Datos:</span>
                              <span className="font-mono font-bold text-[#11120f]">{qr.id}</span>
                            </div>
                            <div>
                              <span className="text-[#66685f] block text-[11px]">Estado Actual:</span>
                              <span className="font-mono font-bold uppercase text-[#11120f]">{qr.estado}</span>
                            </div>
                            <div>
                              <span className="text-[#66685f] block text-[11px]">Fecha de Emisión:</span>
                              <span className="font-mono text-[11px] text-[#11120f]">
                                {new Date(qr.fechaGeneracion).toLocaleString('es-CL')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#66685f] block text-[11px]">Total Escaneos:</span>
                              <span className="font-mono font-bold text-[#11120f]">{qr.totalEscaneos}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#e9e2d3]">
                            <span className="text-[#66685f] block text-[11px] mb-1">Referencia Pública Opaca:</span>
                            <div className="font-mono text-xs bg-[#fffdf7] p-2 rounded border border-[#e9e2d3] break-all select-all">
                              {qr.tokenPublicoOpaco}
                            </div>
                          </div>
                        </div>

                        {onNavigateToScannerWithToken && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onNavigateToScannerWithToken(qr.tokenPublicoOpaco);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#11120f] text-[#d8ff58] rounded-xl text-xs font-semibold cursor-pointer hover:bg-[#252820] transition-colors"
                          >
                            <Activity className="w-4 h-4" />
                            <span>Probar en Escáner Interno</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-[#66685f]">
                      No se ha emitido un QR para esta persona todavía.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COMPORTAMIENTO */}
              {activeTab === 'comportamiento' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-[#11120f]">Métricas de Comportamiento Operativo</h4>
                    <p className="text-xs text-[#66685f]">
                      Registro de interacciones, validaciones y actividad técnica. Separado de consumo comercial.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7]">
                      <span className="text-[11px] font-mono text-[#66685f] block">TOTAL ESCANEOS</span>
                      <span className="text-2xl font-bold font-mono text-[#11120f]">{person.totalEscaneos}</span>
                      <span className="text-[10px] text-[#66685f] block mt-1">Operaciones acumuladas</span>
                    </div>

                    <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7]">
                      <span className="text-[11px] font-mono text-[#66685f] block">FRECUENCIA ESTIMADA</span>
                      <span className="text-2xl font-bold font-mono text-[#11120f]">{scanFrequency}</span>
                      <span className="text-[10px] text-[#66685f] block mt-1">Lecturas por semana</span>
                    </div>

                    <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7]">
                      <span className="text-[11px] font-mono text-[#66685f] block">DÍAS EN LINK</span>
                      <span className="text-2xl font-bold font-mono text-[#11120f]">{daysActive}</span>
                      <span className="text-[10px] text-[#66685f] block mt-1">Antigüedad identidad</span>
                    </div>

                    <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7]">
                      <span className="text-[11px] font-mono text-[#66685f] block">TOTAL EVENTOS</span>
                      <span className="text-2xl font-bold font-mono text-[#11120f]">{activity.length}</span>
                      <span className="text-[10px] text-[#66685f] block mt-1">En el libro de auditoría</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f4f0e6]/50 border border-[#e9e2d3] space-y-2 text-xs">
                    <div className="font-semibold text-[#11120f] flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Línea Temporal de Actividad Clave
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-[#66685f] text-[11px] block">Primera Actividad:</span>
                        <span className="font-mono text-[#11120f]">
                          {firstEvent ? new Date(firstEvent.fecha).toLocaleString('es-CL') : 'Sin registros'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#66685f] text-[11px] block">Último Escaneo Registrado:</span>
                        <span className="font-mono text-[#11120f]">
                          {lastScan ? new Date(lastScan.fecha).toLocaleString('es-CL') : 'Sin escaneos'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: HISTORIAL (TIMELINE) */}
              {activeTab === 'historial' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#11120f]">Historial Inmutable de Eventos</h4>
                      <p className="text-xs text-[#66685f]">
                        Timeline cronológico de todas las operaciones realizadas sobre esta persona y su QR
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[#66685f]">{activity.length} eventos</span>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e9e2d3]">
                    {activity.map((evt) => (
                      <div key={evt.id} className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#11120f] border-2 border-[#fffdf7]"></div>
                        <div className="bg-[#fffdf7] p-3.5 rounded-xl border border-[#e9e2d3] shadow-2xs space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#11120f] text-[#d8ff58]">
                              {evt.tipo}
                            </span>
                            <span className="text-[11px] font-mono text-[#66685f]">
                              {new Date(evt.fecha).toLocaleString('es-CL')}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-[#11120f]">{evt.contexto}</div>
                          {evt.notas && <p className="text-xs text-[#66685f]">{evt.notas}</p>}
                          <div className="text-[10px] font-mono text-[#66685f] pt-1">
                            Operador: {evt.actor.nombre} ({evt.actor.rol})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: ADMINISTRACIÓN */}
              {activeTab === 'administracion' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-[#11120f]">Acciones Autorizadas de Control</h4>
                    <p className="text-xs text-[#66685f]">
                      Gestión de estados del ciclo de vida y auditoría de la identidad
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-[#11120f]">
                      Motivo o Justificación Administrativa:
                    </label>
                    <input
                      type="text"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Ej: Mantenimiento anual, solicitud formal, auditoría de acceso..."
                      className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Control Estado Persona */}
                    <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7] space-y-3">
                      <h5 className="text-xs font-bold text-[#11120f]">Estado de la Persona</h5>
                      <p className="text-xs text-[#66685f]">
                        Estado actual: <strong className="uppercase text-[#11120f]">{person.estado}</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {person.estado !== 'activo' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePersonStatus('activo')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Activar Persona
                          </button>
                        )}
                        {person.estado !== 'inactivo' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePersonStatus('inactivo')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Pausar (Inactivo)
                          </button>
                        )}
                        {person.estado !== 'suspendido' && (
                          <button
                            type="button"
                            onClick={() => handleTogglePersonStatus('suspendido')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Suspender
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Control Estado QR */}
                    <div className="p-4 rounded-xl border border-[#e9e2d3] bg-[#fffdf7] space-y-3">
                      <h5 className="text-xs font-bold text-[#11120f]">Estado del QR Permanente</h5>
                      <p className="text-xs text-[#66685f]">
                        Estado actual: <strong className="uppercase text-[#11120f]">{qr?.estado || 'N/A'}</strong>
                      </p>
                      {qr && (
                        <div className="flex flex-wrap gap-2">
                          {qr.estado !== 'activo' && (
                            <button
                              type="button"
                              onClick={() => handleToggleQrStatus('activo')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Activar QR
                            </button>
                          )}
                          {qr.estado !== 'inactivo' && (
                            <button
                              type="button"
                              onClick={() => handleToggleQrStatus('inactivo')}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Inactivar QR
                            </button>
                          )}
                          {qr.estado !== 'revocado' && (
                            <button
                              type="button"
                              onClick={() => handleToggleQrStatus('revocado')}
                              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Revocar QR
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Todas las modificaciones de estado quedan permanentemente registradas en el libro de eventos de LINK OS con el ID del operador que las ejecuta.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f4f0e6] px-6 py-3 border-t border-[#e9e2d3] flex items-center justify-between text-xs text-[#66685f]">
          <span className="font-mono">LINK OS // ID: {person.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#11120f] text-[#fffdf7] hover:bg-[#252820] rounded-lg font-medium cursor-pointer transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
