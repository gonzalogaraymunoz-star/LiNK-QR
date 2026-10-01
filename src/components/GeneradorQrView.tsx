import React, { useState, useEffect } from 'react';
import { Person, QrIdentity, QrEvent, QrStatus } from '../types/index.ts';
import { QrCodeRenderer } from './QrCodeRenderer.tsx';
import {
  getOrCreateQr,
  getQrActivity,
  setQrStatus,
} from '../services/identityService.ts';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  History,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface GeneradorQrViewProps {
  persons: Person[];
  preselectedPersonId?: string | null;
  onRefresh: () => void;
  onOpenFicha: (person: Person) => void;
}

export const GeneradorQrView: React.FC<GeneradorQrViewProps> = ({
  persons,
  preselectedPersonId,
  onRefresh,
  onOpenFicha,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    preselectedPersonId || (persons[0]?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentQr, setCurrentQr] = useState<QrIdentity | null>(null);
  const [associatedEvents, setAssociatedEvents] = useState<QrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusReason, setStatusReason] = useState('');

  // Update selected person if preselectedPersonId changes
  useEffect(() => {
    if (preselectedPersonId) {
      setSelectedPersonId(preselectedPersonId);
    }
  }, [preselectedPersonId]);

  // Load or idempotently get QR for selected person
  useEffect(() => {
    if (!selectedPersonId) {
      setCurrentQr(null);
      setAssociatedEvents([]);
      return;
    }

    const loadQr = async () => {
      setLoading(true);
      try {
        // IDEMPOTENT GET OR CREATE
        const qr = await getOrCreateQr(selectedPersonId);
        setCurrentQr(qr);
        const events = await getQrActivity(qr.id);
        setAssociatedEvents(events);
      } catch (err) {
        console.error('Error fetching/generating QR:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQr();
  }, [selectedPersonId]);

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  const handleCopyLinkCode = async () => {
    if (!selectedPerson) return;
    try {
      await navigator.clipboard.writeText(selectedPerson.codigoLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggleQrStatus = async (newStatus: QrStatus) => {
    if (!currentQr) return;
    const reason = statusReason.trim() || `Modificación administrativa de estado a '${newStatus}'`;
    const updated = await setQrStatus(currentQr.id, newStatus, reason);
    setCurrentQr(updated);
    setStatusReason('');
    const events = await getQrActivity(currentQr.id);
    setAssociatedEvents(events);
    onRefresh();
  };

  const filteredPersons = persons.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      p.apellido.toLowerCase().includes(term) ||
      p.codigoLink.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#11120f] text-[#d8ff58] font-mono text-[10px] uppercase font-bold tracking-wider mb-2">
          <Sparkles className="w-3 h-3" />
          MOTOR DE IDENTIDAD PERMANENTE // NÚCLEO DEL SISTEMA
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#11120f]">
          Generador y Administrador de Identidades QR
        </h2>
        <p className="text-xs text-[#66685f]">
          Principio arquitectónico: 1 Persona = 1 Identidad LINK = 1 QR Único y Permanente. Operación idempotente.
        </p>
      </div>

      {/* Main Grid: Selection Sidebar + Generator Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Person Selector */}
        <div className="lg:col-span-4 bg-[#fffdf7] p-4 rounded-xl border border-[#e9e2d3] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase font-bold text-[#11120f]">
              Seleccionar Persona
            </h3>
            <span className="text-[11px] font-mono text-[#66685f]">
              {persons.length} disponibles
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#66685f]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nombre o LNK..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
            />
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredPersons.map((p) => {
              const isSelected = p.id === selectedPersonId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPersonId(p.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#11120f] text-[#fffdf7] border-[#11120f] shadow-xs'
                      : 'bg-[#fffdf7] hover:bg-[#f4f0e6] text-[#11120f] border-[#e9e2d3]'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold truncate">
                      {p.nombre} {p.apellido}
                    </div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-[#d8ff58]' : 'text-[#66685f]'}`}>
                      {p.codigoLink} • {p.email}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      isSelected
                        ? 'bg-[#252820] text-[#d8ff58]'
                        : p.estado === 'activo'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {p.estado}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: QR Administrative Stage */}
        <div className="lg:col-span-8 space-y-4">
          {selectedPerson ? (
            <div className="bg-[#fffdf7] p-6 rounded-xl border border-[#e9e2d3] shadow-xs space-y-6">
              {/* Person Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e9e2d3] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#11120f]">
                      {selectedPerson.nombre} {selectedPerson.apellido}
                    </h3>
                    <span className="font-mono text-xs bg-[#11120f] text-[#d8ff58] px-2 py-0.5 rounded font-bold">
                      {selectedPerson.codigoLink}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                        selectedPerson.estado === 'activo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedPerson.estado}
                    </span>
                  </div>
                  <p className="text-xs text-[#66685f] mt-0.5">
                    {selectedPerson.email} • Incorporado el {new Date(selectedPerson.fechaIncorporacion).toLocaleDateString('es-CL')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenFicha(selectedPerson)}
                  className="px-3 py-1.5 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                >
                  Abrir Ficha 360
                </button>
              </div>

              {/* QR Visualization Stage */}
              {loading ? (
                <div className="py-16 text-center text-xs text-[#66685f]">
                  Cargando / Verificando identidad permanente...
                </div>
              ) : currentQr ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Visual QR Card */}
                  <div className="flex flex-col items-center">
                    <QrCodeRenderer
                      token={currentQr.tokenPublicoOpaco}
                      codigoLink={currentQr.codigoLink}
                      nombrePersona={`${selectedPerson.nombre} ${selectedPerson.apellido}`}
                      size={230}
                      showControls={true}
                    />
                  </div>

                  {/* QR Technical Identity Metadata */}
                  <div className="space-y-4">
                    <div className="bg-[#f4f0e6]/60 p-4 rounded-xl border border-[#e9e2d3] space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#66685f]">Estado QR:</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase ${
                            currentQr.estado === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {currentQr.estado}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#66685f]">Emisión original:</span>
                        <span className="text-[#11120f]">
                          {new Date(currentQr.fechaGeneracion).toLocaleDateString('es-CL')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#66685f]">Validaciones registradas:</span>
                        <span className="text-[#11120f] font-bold">
                          {currentQr.totalEscaneos}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#e9e2d3]">
                        <span className="text-[#66685f] text-[10px] block mb-1">
                          Código LINK asociado:
                        </span>
                        <div className="flex items-center justify-between bg-[#fffdf7] px-2.5 py-1.5 rounded border border-[#e9e2d3]">
                          <span className="font-mono font-bold text-xs text-[#11120f]">
                            {currentQr.codigoLink}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyLinkCode}
                            className="text-[11px] text-[#66685f] hover:text-[#11120f] flex items-center gap-1 cursor-pointer"
                          >
                            {copiedLink ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* QR Status Management (Administrative) */}
                    <div className="p-3 bg-[#fffdf7] border border-[#e9e2d3] rounded-xl space-y-2">
                      <span className="text-xs font-semibold text-[#11120f] block">
                        Control de Estado Administrativo
                      </span>
                      <input
                        type="text"
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                        placeholder="Motivo del cambio de estado..."
                        className="w-full px-2.5 py-1 text-xs bg-[#f4f0e6]/40 border border-[#e9e2d3] rounded-md focus:outline-hidden"
                      />
                      <div className="flex gap-2">
                        {currentQr.estado !== 'activo' && (
                          <button
                            type="button"
                            onClick={() => handleToggleQrStatus('activo')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Activar QR
                          </button>
                        )}
                        {currentQr.estado !== 'inactivo' && (
                          <button
                            type="button"
                            onClick={() => handleToggleQrStatus('inactivo')}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Inactivar QR
                          </button>
                        )}
                        {currentQr.estado !== 'revocado' && (
                          <button
                            type="button"
                            onClick={() => handleToggleQrStatus('revocado')}
                            className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Revocar QR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Associated Events for this QR */}
              <div className="pt-4 border-t border-[#e9e2d3]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#11120f] mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#11120f]" />
                  Eventos de Ciclo de Vida Asociados a este QR
                </h4>
                {associatedEvents.length === 0 ? (
                  <div className="text-xs text-[#66685f]">
                    Sin eventos registrados para este QR.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {associatedEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 bg-[#f4f0e6]/40 border border-[#e9e2d3] rounded-lg text-xs flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#11120f] text-[#d8ff58] rounded">
                              {evt.tipo}
                            </span>
                            <span className="font-medium text-[#11120f]">{evt.contexto}</span>
                          </div>
                          {evt.notas && <p className="text-[11px] text-[#66685f]">{evt.notas}</p>}
                        </div>
                        <span className="text-[10px] font-mono text-[#66685f] shrink-0">
                          {new Date(evt.fecha).toLocaleString('es-CL', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#fffdf7] p-12 rounded-xl border border-[#e9e2d3] text-center text-xs text-[#66685f]">
              Selecciona una persona del listado para generar o administrar su identidad QR.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
