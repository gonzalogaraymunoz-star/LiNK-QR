import React from 'react';
import { NavigationSection } from '../types/index.ts';
import {
  LayoutDashboard,
  Users,
  QrCode,
  ScanLine,
  Activity,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface NavigationProps {
  currentSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  metricsSummary?: {
    totalPersonas: number;
    qrActivos: number;
    escaneos: number;
  };
}

const NAV_ITEMS: { id: NavigationSection; label: string; number: string; icon: React.ElementType }[] = [
  { id: 'resumen', label: 'Resumen', number: '01', icon: LayoutDashboard },
  { id: 'personas', label: 'Personas', number: '02', icon: Users },
  { id: 'generador', label: 'Generador QR', number: '03', icon: QrCode },
  { id: 'escaner', label: 'Escáner / Validación', number: '04', icon: ScanLine },
  { id: 'actividad', label: 'Actividad', number: '05', icon: Activity },
  { id: 'configuracion', label: 'Configuración', number: '06', icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentSection,
  onSelectSection,
  metricsSummary,
}) => {
  return (
    <header className="border-b border-[#e9e2d3] bg-[#fffdf7] sticky top-0 z-30">
      {/* Top operational status strip */}
      <div className="border-b border-[#e9e2d3] px-4 sm:px-6 py-2 bg-[#11120f] text-[#fffdf7] text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#d8ff58] animate-pulse"></span>
          <span className="font-mono tracking-wider font-semibold text-[#d8ff58]">LINK OS // SISTEMA ACTIVO</span>
          <span className="text-[#66685f]">|</span>
          <span className="text-gray-300 font-medium">Centro de Control de Identidades y Comportamiento</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          {metricsSummary && (
            <div className="hidden md:flex items-center gap-3 text-gray-400">
              <span>{metricsSummary.totalPersonas} personas</span>
              <span>•</span>
              <span>{metricsSummary.qrActivos} QR activos</span>
              <span>•</span>
              <span>{metricsSummary.escaneos} validaciones</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-[#1d1f19] px-2.5 py-1 rounded border border-[#33352c] text-[#d8ff58]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OPERADOR AUTORIZADO</span>
          </div>
        </div>
      </div>

      {/* Main Bar with Brand & Clean Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#11120f] rounded-lg flex items-center justify-center text-[#d8ff58] font-bold text-lg shadow-sm border border-[#11120f]">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-[#11120f]">
                LINK <span className="font-mono text-xs bg-[#11120f] text-[#d8ff58] px-1.5 py-0.5 rounded">OS QR</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#e9e2d3] text-[#11120f] rounded font-semibold tracking-wider">
                ADMIN & OPS
              </span>
            </div>
            <p className="text-xs text-[#66685f]">Centro de Control Centralizado</p>
          </div>
        </div>

        {/* Exclusively 6 Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#11120f] text-[#fffdf7] shadow-sm'
                    : 'text-[#66685f] hover:text-[#11120f] hover:bg-[#e9e2d3]/50'
                }`}
              >
                <span
                  className={`font-mono text-[10px] ${
                    isActive ? 'text-[#d8ff58]' : 'text-[#66685f]'
                  }`}
                >
                  {item.number}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#d8ff58]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
