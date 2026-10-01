import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { QrEvent } from '../types/index.ts';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  CheckCircle2,
  ScanLine,
  ArrowUpRight,
  Info,
} from 'lucide-react';

interface HistoricoEscaneosChartProps {
  events: QrEvent[];
}

type TimeframeOption = '7d' | '14d' | '30d' | 'all';
type ChartType = 'area' | 'bar';

interface DailyDataPoint {
  dateKey: string;
  displayDate: string;
  fullDate: string;
  validaciones: number;
  lecturas: number;
  total: number;
}

export const HistoricoEscaneosChart: React.FC<HistoricoEscaneosChartProps> = ({ events }) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('14d');
  const [chartType, setChartType] = useState<ChartType>('area');

  // Filter only scan-type events (validations and internal reads)
  const scanEvents = useMemo(() => {
    return events.filter(
      (e) => e.tipo === 'VALIDACION_OPERATIVA' || e.tipo === 'LECTURA_INTERNA'
    );
  }, [events]);

  // Aggregate by calendar day in continuous chronological order
  const { chartData, stats } = useMemo(() => {
    // Current anchor date (using local date or latest event date)
    const now = new Date('2026-09-21T12:00:00.000Z');

    let daysToInclude = 14;
    if (timeframe === '7d') daysToInclude = 7;
    else if (timeframe === '30d') daysToInclude = 30;
    else if (timeframe === 'all') {
      // Find earliest event or default to 30 days
      if (scanEvents.length > 0) {
        const timestamps = scanEvents.map((e) => new Date(e.fecha).getTime());
        const minTime = Math.min(...timestamps);
        const diffDays = Math.ceil((now.getTime() - minTime) / (1000 * 60 * 60 * 24));
        daysToInclude = Math.max(diffDays + 1, 7);
      } else {
        daysToInclude = 14;
      }
    }

    // Build continuous map of all days in the range
    const dailyMap = new Map<string, { validaciones: number; lecturas: number; dateObj: Date }>();

    for (let i = daysToInclude - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { validaciones: 0, lecturas: 0, dateObj: d });
    }

    // Populate events into daily buckets
    scanEvents.forEach((evt) => {
      const evtDate = new Date(evt.fecha);
      const key = evtDate.toISOString().split('T')[0];
      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key)!;
        if (evt.tipo === 'VALIDACION_OPERATIVA') {
          entry.validaciones += 1;
        } else if (evt.tipo === 'LECTURA_INTERNA') {
          entry.lecturas += 1;
        }
      }
    });

    // Format array for recharts
    const points: DailyDataPoint[] = [];
    let totalValidaciones = 0;
    let totalLecturas = 0;
    let maxScansInOneDay = 0;
    let peakDayLabel = 'N/A';

    dailyMap.forEach((val, key) => {
      const total = val.validaciones + val.lecturas;
      totalValidaciones += val.validaciones;
      totalLecturas += val.lecturas;

      const displayDate = val.dateObj.toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'short',
      });

      const fullDate = val.dateObj.toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (total > maxScansInOneDay) {
        maxScansInOneDay = total;
        peakDayLabel = `${displayDate} (${total})`;
      }

      points.push({
        dateKey: key,
        displayDate,
        fullDate,
        validaciones: val.validaciones,
        lecturas: val.lecturas,
        total,
      });
    });

    const totalScansInRange = totalValidaciones + totalLecturas;
    const dailyAverage = (totalScansInRange / Math.max(points.length, 1)).toFixed(1);

    return {
      chartData: points,
      stats: {
        totalScans: totalScansInRange,
        totalValidaciones,
        totalLecturas,
        dailyAverage,
        peakDay: maxScansInOneDay > 0 ? peakDayLabel : 'Sin datos',
        peakScans: maxScansInOneDay,
      },
    };
  }, [scanEvents, timeframe]);

  return (
    <div id="historico-escaneos-section" className="bg-[#fffdf7] rounded-xl border border-[#e9e2d3] p-5 sm:p-6 shadow-xs">
      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e9e2d3]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#11120f] text-[#d8ff58]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-[#11120f] tracking-tight">
              Tendencia Histórica de Escaneos Registrados
            </h3>
          </div>
          <p className="text-xs text-[#66685f]">
            Registro diario consolidado de eventos de verificación interna y validación operativa de identidades QR.
          </p>
        </div>

        {/* Controls: Timeframe & Chart Type Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="inline-flex rounded-lg bg-[#f4f0e6] p-0.5 border border-[#e9e2d3] text-xs">
            <button
              type="button"
              onClick={() => setTimeframe('7d')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                timeframe === '7d'
                  ? 'bg-[#11120f] text-[#fffdf7] shadow-xs'
                  : 'text-[#66685f] hover:text-[#11120f]'
              }`}
            >
              7 días
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('14d')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                timeframe === '14d'
                  ? 'bg-[#11120f] text-[#fffdf7] shadow-xs'
                  : 'text-[#66685f] hover:text-[#11120f]'
              }`}
            >
              14 días
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                timeframe === '30d'
                  ? 'bg-[#11120f] text-[#fffdf7] shadow-xs'
                  : 'text-[#66685f] hover:text-[#11120f]'
              }`}
            >
              30 días
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-[#11120f] text-[#fffdf7] shadow-xs'
                  : 'text-[#66685f] hover:text-[#11120f]'
              }`}
            >
              Todo
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="inline-flex rounded-lg bg-[#f4f0e6] p-0.5 border border-[#e9e2d3] text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              title="Gráfico de Área"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-[#11120f] text-[#fffdf7] shadow-xs'
                  : 'text-[#66685f] hover:text-[#11120f]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Gráfico de Barras Apiladas"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#11120f] text-[#fffdf7] shadow-xs'
                  : 'text-[#66685f] hover:text-[#11120f]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Performance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Total período */}
        <div className="bg-[#f4f0e6]/60 rounded-lg p-3 border border-[#e9e2d3]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#66685f] flex items-center justify-between">
            <span>Escaneos Período</span>
            <ScanLine className="w-3 h-3 text-[#11120f]" />
          </div>
          <div className="text-xl font-mono font-bold text-[#11120f] mt-1">
            {stats.totalScans}
          </div>
          <div className="text-[10px] text-[#66685f] mt-0.5">
            {timeframe === '7d' ? 'Últimos 7 días' : timeframe === '14d' ? 'Últimos 14 días' : timeframe === '30d' ? 'Últimos 30 días' : 'Todo el registro'}
          </div>
        </div>

        {/* Promedio diario */}
        <div className="bg-[#f4f0e6]/60 rounded-lg p-3 border border-[#e9e2d3]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#66685f] flex items-center justify-between">
            <span>Promedio Diario</span>
            <Calendar className="w-3 h-3 text-[#11120f]" />
          </div>
          <div className="text-xl font-mono font-bold text-[#11120f] mt-1">
            {stats.dailyAverage}
          </div>
          <div className="text-[10px] text-[#66685f] mt-0.5">Escaneos por día</div>
        </div>

        {/* Día pico */}
        <div className="bg-[#f4f0e6]/60 rounded-lg p-3 border border-[#e9e2d3]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#66685f] flex items-center justify-between">
            <span>Día Pico</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-700" />
          </div>
          <div className="text-xl font-mono font-bold text-[#11120f] mt-1 truncate">
            {stats.peakDay}
          </div>
          <div className="text-[10px] text-[#66685f] mt-0.5">Mayor concurrencia</div>
        </div>

        {/* Desglose por tipo */}
        <div className="bg-[#f4f0e6]/60 rounded-lg p-3 border border-[#e9e2d3]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#66685f] flex items-center justify-between">
            <span>Desglose Tipo</span>
            <Layers className="w-3 h-3 text-[#11120f]" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono font-semibold text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              {stats.totalValidaciones} Val
            </span>
            <span className="text-[#66685f]">•</span>
            <span className="text-xs font-mono font-semibold text-[#11120f] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#11120f]"></span>
              {stats.totalLecturas} Lec
            </span>
          </div>
          <div className="text-[10px] text-[#66685f] mt-0.5">Operativa vs Interna</div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full h-72 pt-2">
        {chartData.length === 0 || stats.totalScans === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-[#f4f0e6]/30 rounded-lg border border-dashed border-[#e9e2d3]">
            <ScanLine className="w-8 h-8 text-[#66685f] mb-2 opacity-50" />
            <p className="text-xs font-medium text-[#11120f]">No hay escaneos registrados en este período</p>
            <p className="text-[11px] text-[#66685f] mt-1 max-w-sm">
              Utiliza el escáner interno o registra validaciones operativas para alimentar la curva histórica en tiempo real.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Subtle, craft-compliant gradient fills */}
                  <linearGradient id="colorValidaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLecturas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#11120f" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#11120f" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9e2d3" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#66685f' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e9e2d3' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#66685f' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e9e2d3' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DailyDataPoint;
                      return (
                        <div className="bg-[#11120f] text-[#fffdf7] p-3 rounded-xl border border-[#272922] shadow-lg text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-semibold capitalize text-[#e9e2d3] border-b border-[#2a2d24] pb-1">
                            {data.fullDate}
                          </div>
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Validaciones:
                            </span>
                            <span className="font-mono font-bold">{data.validaciones}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[#e9e2d3]">
                              <span className="w-2 h-2 rounded-full bg-[#d8ff58]"></span>
                              Lecturas Internas:
                            </span>
                            <span className="font-mono font-bold">{data.lecturas}</span>
                          </div>
                          <div className="border-t border-[#2a2d24] pt-1.5 flex items-center justify-between font-bold">
                            <span className="text-[#d8ff58]">Total del día:</span>
                            <span className="font-mono text-[#d8ff58] text-sm">{data.total}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-[#66685f]">
                      {value === 'validaciones' ? 'Validación Operativa' : 'Lectura Interna'}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="validaciones"
                  name="validaciones"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValidaciones)"
                />
                <Area
                  type="monotone"
                  dataKey="lecturas"
                  name="lecturas"
                  stroke="#11120f"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLecturas)"
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9e2d3" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#66685f' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e9e2d3' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#66685f' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e9e2d3' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DailyDataPoint;
                      return (
                        <div className="bg-[#11120f] text-[#fffdf7] p-3 rounded-xl border border-[#272922] shadow-lg text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-semibold capitalize text-[#e9e2d3] border-b border-[#2a2d24] pb-1">
                            {data.fullDate}
                          </div>
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Validaciones:
                            </span>
                            <span className="font-mono font-bold">{data.validaciones}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[#e9e2d3]">
                              <span className="w-2 h-2 rounded-full bg-[#11120f] border border-[#3e4235]"></span>
                              Lecturas Internas:
                            </span>
                            <span className="font-mono font-bold">{data.lecturas}</span>
                          </div>
                          <div className="border-t border-[#2a2d24] pt-1.5 flex items-center justify-between font-bold">
                            <span className="text-[#d8ff58]">Total del día:</span>
                            <span className="font-mono text-[#d8ff58] text-sm">{data.total}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-[#66685f]">
                      {value === 'validaciones' ? 'Validación Operativa' : 'Lectura Interna'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="validaciones"
                  name="validaciones"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="lecturas"
                  name="lecturas"
                  stackId="a"
                  fill="#11120f"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Audit & Compliance Footer Note */}
      <div className="mt-4 pt-3 border-t border-[#e9e2d3] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#66685f]">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#11120f]" />
          <span>
            Cada punto representa lecturas operativas procesadas y firmadas por operadores del Centro de Control.
          </span>
        </div>
        <div className="font-mono text-[10px] text-[#11120f] font-medium">
          INMUTABILIDAD: LOG CRONOLÓGICO GARANTIZADO
        </div>
      </div>
    </div>
  );
};
