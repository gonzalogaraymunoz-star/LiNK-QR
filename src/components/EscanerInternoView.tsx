import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Person, QrIdentity, OperatorActor } from '../types/index.ts';
import {
  resolveQrIdentity,
  registerQrEvent,
  CURRENT_OPERATOR,
} from '../services/identityService.ts';
import {
  ScanLine,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ShieldCheck,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';

interface EscanerInternoViewProps {
  initialToken?: string | null;
  onOpenFicha: (person: Person) => void;
  onRefresh: () => void;
}

export const EscanerInternoView: React.FC<EscanerInternoViewProps> = ({
  initialToken,
  onOpenFicha,
  onRefresh,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(initialToken || '');
  const [resolvedResult, setResolvedResult] = useState<{
    qr: QrIdentity;
    person: Person;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  // Validation event registering
  const [validationContext, setValidationContext] = useState(
    'Auditoría Interna de Control'
  );
  const [validationNotes, setValidationNotes] = useState('');
  const [eventSuccessMessage, setEventSuccessMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const handleResolve = useCallback(async (tokenOrCode: string) => {
    if (!tokenOrCode.trim()) return;
    setSearching(true);
    setNotFound(false);
    setEventSuccessMessage(null);

    try {
      const result = await resolveQrIdentity(tokenOrCode.trim());
      if (result) {
        setResolvedResult(result);
        setNotFound(false);
      } else {
        setResolvedResult(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error resolving QR:', err);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (initialToken) {
      setManualInput(initialToken);
      handleResolve(initialToken);
    }
  }, [initialToken, handleResolve]);

  // Video scan loop
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleResolve(code.data);
        // Pause camera after successful read
        stopCamera();
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [handleResolve]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Camera access error:', msg);
      setCameraError(
        'No se pudo acceder a la cámara. Puedes usar la entrada manual o probar con identificadores de prueba.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleRegisterInternalValidation = async () => {
    if (!resolvedResult) return;

    try {
      await registerQrEvent({
        qrId: resolvedResult.qr.id,
        personaId: resolvedResult.person.id,
        tipo: 'VALIDACION_OPERATIVA',
        actor: CURRENT_OPERATOR,
        contexto: validationContext,
        notas: validationNotes || 'Validación operativa interna en Centro de Control',
      });

      setEventSuccessMessage(
        'Evento de validación operativa registrado con éxito en el libro inmutable de LINK OS.'
      );
      setValidationNotes('');
      onRefresh();

      // Refresh resolved stats
      handleResolve(resolvedResult.qr.tokenPublicoOpaco);
    } catch (err) {
      console.error('Error registering validation event:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#11120f] text-[#d8ff58] font-mono text-[10px] uppercase font-bold tracking-wider mb-2">
          <ShieldCheck className="w-3 h-3" />
          HERRAMIENTA INTERNA DE VALIDACIÓN Y PRUEBA OPERATIVA
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#11120f]">
          Escáner y Verificación de Identidad
        </h2>
        <p className="text-xs text-[#66685f]">
          Lectura directa de credenciales QR y comprobación de estado. Operación de control técnico interno (Escaneo ≠ Consumo / Validación ≠ Compra).
        </p>
      </div>

      {/* Main Grid: Scanner Stage vs Resolved Identity Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Optical Reader & Manual Input */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#fffdf7] p-5 rounded-xl border border-[#e9e2d3] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9e2d3]">
              <h3 className="text-xs font-mono font-bold uppercase text-[#11120f] flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-[#11120f]" />
                Sensor Óptico de Cámara
              </h3>
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isCameraActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#11120f] text-[#d8ff58] hover:bg-[#252820]'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Detener Cámara</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Iniciar Cámara</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-video bg-[#11120f] rounded-xl overflow-hidden flex items-center justify-center border-2 border-[#11120f]">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-[#d8ff58] rounded-xl relative">
                    <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#d8ff58]"></span>
                    <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#d8ff58]"></span>
                    <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#d8ff58]"></span>
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#d8ff58]"></span>
                    <div className="w-full h-0.5 bg-[#d8ff58]/80 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                  </div>
                </div>
              )}

              {!isCameraActive && (
                <div className="p-6 text-center text-xs text-[#e9e2d3] space-y-2">
                  <Camera className="w-8 h-8 mx-auto text-[#d8ff58] opacity-80" />
                  <p className="font-semibold text-white">Cámara inactiva</p>
                  <p className="text-[#66685f] text-[11px] max-w-xs mx-auto">
                    Haz clic en "Iniciar Cámara" para escanear con tu cámara web o dispositivo móvil.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Manual Entry Fallback */}
            <div className="pt-2 border-t border-[#e9e2d3] space-y-2">
              <label className="block text-xs font-semibold text-[#11120f]">
                Lectura Manual de Referencia o Código LINK:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ej: LNK-4091 o lnk_qr_8f4a1c9e..."
                  className="flex-1 px-3 py-2 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg font-mono focus:outline-hidden focus:border-[#11120f]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleResolve(manualInput);
                  }}
                />
                <button
                  type="button"
                  disabled={searching || !manualInput.trim()}
                  onClick={() => handleResolve(manualInput)}
                  className="px-4 py-2 bg-[#11120f] text-[#d8ff58] hover:bg-[#252820] disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verificar</span>
                </button>
              </div>
            </div>

            {/* Quick Test Identities */}
            <div className="pt-2">
              <span className="text-[11px] font-mono text-[#66685f] block mb-1.5">
                Pruebas rápidas de diagnóstico:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['LNK-4091', 'LNK-8824', 'LNK-1205', 'LNK-9340'].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setManualInput(code);
                      handleResolve(code);
                    }}
                    className="px-2 py-1 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded font-mono text-[10px] font-semibold cursor-pointer border border-[#e9e2d3]"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Identity Verification Result */}
        <div className="lg:col-span-6 space-y-4">
          {searching ? (
            <div className="bg-[#fffdf7] p-12 rounded-xl border border-[#e9e2d3] text-center text-xs text-[#66685f]">
              Buscando e identificando credencial...
            </div>
          ) : notFound ? (
            <div className="bg-[#fffdf7] p-8 rounded-xl border border-red-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-red-900">
                Credencial No Reconocida
              </h4>
              <p className="text-xs text-[#66685f] max-w-sm mx-auto">
                No existe ninguna identidad asignada con el token o código LINK proporcionado. Verifica que haya sido emitido previamente en el Generador QR.
              </p>
            </div>
          ) : resolvedResult ? (
            <div className="bg-[#fffdf7] p-6 rounded-xl border border-[#e9e2d3] shadow-xs space-y-5">
              {/* Validation Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  resolvedResult.qr.estado === 'activo' &&
                  resolvedResult.person.estado === 'activo'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {resolvedResult.qr.estado === 'activo' &&
                resolvedResult.person.estado === 'activo' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-xs">
                    {resolvedResult.qr.estado === 'activo' &&
                    resolvedResult.person.estado === 'activo'
                      ? 'IDENTIDAD VÁLIDA Y ACTIVA'
                      : 'IDENTIDAD CON OBSERVACIONES OPERATIVAS'}
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Estado QR: <strong>{resolvedResult.qr.estado.toUpperCase()}</strong> | Estado Persona: <strong>{resolvedResult.person.estado.toUpperCase()}</strong>
                  </p>
                </div>
              </div>

              {/* Person Summary Card */}
              <div className="bg-[#f4f0e6]/50 p-4 rounded-xl border border-[#e9e2d3] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#11120f]">
                      {resolvedResult.person.nombre} {resolvedResult.person.apellido}
                    </h3>
                    <span className="font-mono text-xs text-[#66685f]">
                      {resolvedResult.person.email}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs bg-[#11120f] text-[#d8ff58] px-2.5 py-1 rounded">
                    {resolvedResult.person.codigoLink}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-[#e9e2d3]">
                  <div>
                    <span className="text-[#66685f] text-[10px] block">Validaciones Previas:</span>
                    <span className="font-mono font-bold text-[#11120f]">
                      {resolvedResult.qr.totalEscaneos} escaneos
                    </span>
                  </div>
                  <div>
                    <span className="text-[#66685f] text-[10px] block">Último Registro:</span>
                    <span className="font-mono text-[11px] text-[#11120f]">
                      {resolvedResult.qr.ultimoEscaneo
                        ? new Date(resolvedResult.qr.ultimoEscaneo).toLocaleDateString('es-CL')
                        : 'Primer registro'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Record Authorized Operational Event */}
              <div className="p-4 rounded-xl bg-[#fffdf7] border border-[#e9e2d3] space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#11120f] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#11120f]" />
                  Registrar Evento de Validación Operativa
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-[#11120f] mb-1">
                    Contexto de la Validación:
                  </label>
                  <select
                    value={validationContext}
                    onChange={(e) => setValidationContext(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg focus:outline-hidden"
                  >
                    <option value="Auditoría Interna de Control">Auditoría Interna de Control</option>
                    <option value="Prueba de Diagnóstico de Lector">Prueba de Diagnóstico de Lector</option>
                    <option value="Control de Acceso Operativo">Control de Acceso Operativo</option>
                    <option value="Verificación de Credencial en Terreno">Verificación de Credencial en Terreno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#11120f] mb-1">
                    Notas del Operador (opcional):
                  </label>
                  <input
                    type="text"
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    placeholder="Observaciones de la lectura técnica..."
                    className="w-full px-3 py-1.5 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRegisterInternalValidation}
                    className="flex items-center gap-2 px-4 py-2 bg-[#11120f] text-[#d8ff58] hover:bg-[#252820] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Registrar Evento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenFicha(resolvedResult.person)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Abrir Ficha 360</span>
                  </button>
                </div>

                {eventSuccessMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg mt-2">
                    {eventSuccessMessage}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#fffdf7] p-12 rounded-xl border border-[#e9e2d3] text-center text-xs text-[#66685f] space-y-2">
              <ScanLine className="w-8 h-8 mx-auto text-[#66685f]" />
              <p className="font-semibold text-[#11120f]">Esperando lectura de credencial</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Apunta la cámara al QR permanente o ingresa manualmente el código LINK para verificar el estado de la persona.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
