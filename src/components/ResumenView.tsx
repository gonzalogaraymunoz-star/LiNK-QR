import React from 'react';
import { DashboardMetrics, QrEvent, NavigationSection } from '../types/index.ts';
import {
  Users,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Activity,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { HistoricoEscaneosChart } from './HistoricoEscaneosChart.tsx';

interface ResumenViewProps {
  metrics: DashboardMetrics;
  recentEvents: QrEvent[];
  onNavigate: (section: NavigationSection) => void;
  onOpenCreatePerson: () => void;
  onSelectPersonById: (personId: string) => void;
}

export const ResumenView: React.FC<ResumenViewProps> = ({
  metrics,
  recentEvents,
  onNavigate,
  onOpenCreatePerson,
  onSelectPersonById,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner: Product Definition */}
      <div className="bg-[#11120f] text-[#fffdf7] rounded-2xl p-6 sm:p-8 border border-[#11120f] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#d8ff58]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#24261f] border border-[#3c3f33] text-xs text-[#d8ff58] font-mono mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d8ff58] animate-pulse"></span>
            HERRAMIENTA INTERNA DE ADMINISTRACIÓN Y OPERACIÓN
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fffdf7]">
            LINK OS QR — Centro de Control
          </h2>
          <p className="mt-2 text-sm text-[#e9e2d3] leading-relaxed">
            Administración centralizada del ciclo de vida de identidades QR y registro inmutable del historial de comportamiento. Sistema aislado de la aplicación pública de clientes.
          </p>

          {/* Quick Operational Access Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenCreatePerson}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#d8ff58] text-[#11120f] rounded-xl text-xs font-semibold hover:bg-[#c9f542] transition-colors cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Persona</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('generador')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#252820] text-[#fffdf7] border border-[#3e4235] rounded-xl text-xs font-medium hover:bg-[#31352a] transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#d8ff58]" />
              <span>Generar QR</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('escaner')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#252820] text-[#fffdf7] border border-[#3e4235] rounded-xl text-xs font-medium hover:bg-[#31352a] transition-colors cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-[#d8ff58]" />
              <span>Escanear QR</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('actividad')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#252820] text-[#fffdf7] border border-[#3e4235] rounded-xl text-xs font-medium hover:bg-[#31352a] transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#d8ff58]" />
              <span>Consultar Actividad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#66685f]">
            Métricas del Sistema en Tiempo Real
          </h3>
          <span className="text-[11px] text-[#66685f] font-mono">
            Separación estricta: Escaneo ≠ Consumo
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* TOTAL PERSONAS */}
          <div className="bg-[#fffdf7] p-4 rounded-xl border border-[#e9e2d3] shadow-xs">
            <div className="flex items-center justify-between text-[#66685f] mb-2">
              <span className="text-[11px] font-mono font-medium">TOTAL PERSONAS</span>
              <Users className="w-4 h-4 text-[#11120f]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#11120f]">
              {metrics.totalPersonas}
            </div>
            <div className="text-[10px] text-[#66685f] mt-1">Registradas en base central</div>
          </div>

          {/* QR GENERADOS */}
          <div className="bg-[#fffdf7] p-4 rounded-xl border border-[#e9e2d3] shadow-xs">
            <div className="flex items-center justify-between text-[#66685f] mb-2">
              <span className="text-[11px] font-mono font-medium">QR GENERADOS</span>
              <QrCode className="w-4 h-4 text-[#11120f]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#11120f]">
              {metrics.qrGenerados}
            </div>
            <div className="text-[10px] text-[#66685f] mt-1">Identidades asignadas</div>
          </div>

          {/* QR ACTIVOS */}
          <div className="bg-[#fffdf7] p-4 rounded-xl border border-[#e9e2d3] shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-[11px] font-mono font-medium">QR ACTIVOS</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-800">
              {metrics.qrActivos}
            </div>
            <div className="text-[10px] text-[#66685f] mt-1">Habilitados para validación</div>
          </div>

          {/* QR INACTIVOS */}
          <div className="bg-[#fffdf7] p-4 rounded-xl border border-[#e9e2d3] shadow-xs">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-[11px] font-mono font-medium">QR INACTIVOS</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-800">
              {metrics.qrInactivos}
            </div>
            <div className="text-[10px] text-[#66685f] mt-1">Pausados o revocados</div>
          </div>

          {/* ESCANEOS REGISTRADOS */}
          <div className="bg-[#fffdf7] p-4 rounded-xl border border-[#e9e2d3] shadow-xs">
            <div className="flex items-center justify-between text-[#66685f] mb-2">
              <span className="text-[11px] font-mono font-medium">ESCANEOS TOTALES</span>
              <ScanLine className="w-4 h-4 text-[#11120f]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#11120f]">
              {metrics.escaneosRegistrados}
            </div>
            <div className="text-[10px] text-[#66685f] mt-1">Eventos de validación</div>
          </div>

          {/* PERSONAS CON ACTIVIDAD */}
          <div className="bg-[#fffdf7] p-4 rounded-xl border border-[#e9e2d3] shadow-xs">
            <div className="flex items-center justify-between text-[#66685f] mb-2">
              <span className="text-[11px] font-mono font-medium">CON ACTIVIDAD</span>
              <Activity className="w-4 h-4 text-[#11120f]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#11120f]">
              {metrics.personasConActividad}
            </div>
            <div className="text-[10px] text-[#66685f] mt-1">Identidades utilizadas</div>
          </div>
        </div>
      </div>

      {/* Visualización de Datos Históricos con Recharts */}
      <HistoricoEscaneosChart events={recentEvents} />

      {/* Two Columns: Recent Events & Operational Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ÚLTIMOS EVENTOS REGISTRADOS */}
        <div className="lg:col-span-2 bg-[#fffdf7] rounded-xl border border-[#e9e2d3] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#e9e2d3]">
            <div>
              <h3 className="text-sm font-bold text-[#11120f] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#11120f]" />
                Últimos Eventos de Identidad y Comportamiento
              </h3>
              <p className="text-xs text-[#66685f]">
                Registro inmutable de lecturas, validaciones y cambios de ciclo de vida
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('actividad')}
              className="text-xs font-medium text-[#11120f] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#e9e2d3] mt-2">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#66685f]">
                No hay eventos registrados aún.
              </div>
            ) : (
              recentEvents.slice(0, 6).map((evt) => {
                const badgeColor =
                  evt.tipo === 'VALIDACION_OPERATIVA'
                    ? 'bg-emerald-100 text-emerald-800'
                    : evt.tipo === 'LECTURA_INTERNA'
                    ? 'bg-blue-100 text-blue-800'
                    : evt.tipo === 'GENERACION_QR'
                    ? 'bg-purple-100 text-purple-800'
                    : evt.tipo === 'CAMBIO_ESTADO'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800';

                return (
                  <div
                    key={evt.id}
                    className="py-3 flex items-start justify-between gap-3 text-xs hover:bg-[#f4f0e6]/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${badgeColor}`}>
                          {evt.tipo}
                        </span>
                        <span className="font-semibold text-[#11120f]">
                          {evt.contexto}
                        </span>
                      </div>
                      {evt.notas && (
                        <p className="text-[#66685f] text-[11px]">{evt.notas}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-[#66685f]">
                        <span>Operador: {evt.actor.nombre}</span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => onSelectPersonById(evt.personaId)}
                          className="font-mono text-[#11120f] hover:underline cursor-pointer"
                        >
                          Ver ficha
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-[#66685f] whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(evt.fecha).toLocaleString('es-CL', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Operational Scope & Architecture Rules */}
        <div className="space-y-4">
          <div className="bg-[#fffdf7] rounded-xl border border-[#e9e2d3] p-5 shadow-xs">
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#11120f] mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#11120f]" />
              Principios Operativos LINK OS
            </h4>
            <ul className="space-y-3 text-xs text-[#66685f] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#11120f] mt-0.5">01</span>
                <div>
                  <strong className="text-[#11120f]">1 Persona = 1 QR Único:</strong> La asignación de credencial QR es idempotente y permanente.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#11120f] mt-0.5">02</span>
                <div>
                  <strong className="text-[#11120f]">Validación ≠ Compra:</strong> El escaneo interno en Centro de Control nunca computa ventas ni consumo.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#11120f] mt-0.5">03</span>
                <div>
                  <strong className="text-[#11120f]">Token Opaco Seguro:</strong> El QR no contiene nombres ni teléfonos. Solo un puntero criptográfico.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#11120f] mt-0.5">04</span>
                <div>
                  <strong className="text-[#11120f]">Aislamiento de Aplicaciones:</strong> LINK Beneficios (portal cliente) operará en su propio frontend sobre Supabase.
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#e9e2d3]/60 rounded-xl p-4 border border-[#e9e2d3] text-xs text-[#11120f]">
            <div className="font-semibold mb-1">Entorno de Producción Destino</div>
            <p className="text-[11px] text-[#66685f] leading-relaxed">
              Compatible con GitHub + Vercel + Supabase. Base de datos relacional PostgreSQL con Row-Level Security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
