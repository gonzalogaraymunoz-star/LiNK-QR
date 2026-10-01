import React, { useState } from 'react';
import { QrEvent, QrEventType, Person } from '../types/index.ts';
import {
  Activity,
  Filter,
  Search,
  Download,
  Calendar,
  User,
  Shield,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

interface ActividadViewProps {
  events: QrEvent[];
  persons: Person[];
  onOpenFicha: (person: Person) => void;
}

export const ActividadView: React.FC<ActividadViewProps> = ({
  events,
  persons,
  onOpenFicha,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');

  const filteredEvents = events.filter((evt) => {
    const term = searchTerm.toLowerCase();
    const person = persons.find((p) => p.id === evt.personaId);
    const personName = person ? `${person.nombre} ${person.apellido}`.toLowerCase() : '';
    const personCode = person ? person.codigoLink.toLowerCase() : '';

    const matchesSearch =
      evt.contexto.toLowerCase().includes(term) ||
      (evt.notas && evt.notas.toLowerCase().includes(term)) ||
      evt.actor.nombre.toLowerCase().includes(term) ||
      personName.includes(term) ||
      personCode.includes(term);

    const matchesType = selectedType === 'todos' || evt.tipo === selectedType;

    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Tipo', 'Contexto', 'Actor', 'Rol', 'Persona ID', 'Notas'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.fecha,
      e.tipo,
      `"${e.contexto.replace(/"/g, '""')}"`,
      `"${e.actor.nombre.replace(/"/g, '""')}"`,
      e.actor.rol,
      e.personaId,
      `"${(e.notas || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LINK-OS-ACTIVIDAD-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `LINK-OS-ACTIVIDAD-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#11120f] text-[#d8ff58] font-mono text-[10px] uppercase font-bold tracking-wider mb-2">
            <Activity className="w-3 h-3" />
            MOTOR DE COMPORTAMIENTO // LIBRO INMUTABLE
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#11120f]">
            Registro de Actividad y Comportamiento
          </h2>
          <p className="text-xs text-[#66685f]">
            Historial de ciclo de vida, lecturas internas, emisiones y comprobaciones de identidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#fffdf7] hover:bg-[#f4f0e6] text-[#11120f] border border-[#e9e2d3] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#66685f]" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#11120f] text-[#d8ff58] hover:bg-[#252820] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Strict Conceptual Principle Banner */}
      <div className="bg-[#11120f] text-[#fffdf7] p-4 rounded-xl border border-[#11120f] flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#d8ff58] shrink-0"></span>
          <div className="font-mono text-[#e9e2d3]">
            <strong className="text-[#d8ff58]">SEPARACIÓN CONCEPTUAL ESTRICTA:</strong>{' '}
            ESCANEO ≠ CONSUMO &nbsp;|&nbsp; VALIDACIÓN ≠ COMPRA &nbsp;|&nbsp; EVENTO ≠ COMISIÓN
          </div>
        </div>
        <div className="text-[11px] text-[#66685f] font-mono whitespace-nowrap">
          {events.length} registros auditados
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#fffdf7] p-3 rounded-xl border border-[#e9e2d3] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#66685f]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por contexto, persona, código o notas..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#66685f]" />
          <span className="text-[11px] text-[#66685f]">Tipo:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1 text-xs bg-[#f4f0e6] border border-[#e9e2d3] rounded-lg font-mono focus:outline-hidden"
          >
            <option value="todos">Todos los eventos</option>
            <option value="CREACION_IDENTIDAD">CREACION_IDENTIDAD</option>
            <option value="GENERACION_QR">GENERACION_QR</option>
            <option value="LECTURA_INTERNA">LECTURA_INTERNA</option>
            <option value="VALIDACION_OPERATIVA">VALIDACION_OPERATIVA</option>
            <option value="CAMBIO_ESTADO">CAMBIO_ESTADO</option>
            <option value="ACTUALIZACION_DATOS">ACTUALIZACION_DATOS</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#fffdf7] rounded-xl border border-[#e9e2d3] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#11120f] text-[#fffdf7] font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-3">Tipo de Evento</th>
                <th className="py-3 px-3">Persona Asociada</th>
                <th className="py-3 px-3">Contexto y Descripción</th>
                <th className="py-3 px-3">Actor / Operador</th>
                <th className="py-3 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e9e2d3]">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#66685f]">
                    No hay eventos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const person = persons.find((p) => p.id === evt.personaId);
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
                    <tr
                      key={evt.id}
                      className="hover:bg-[#f4f0e6]/50 transition-colors"
                    >
                      {/* Fecha y Hora */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#66685f] whitespace-nowrap">
                        {new Date(evt.fecha).toLocaleString('es-CL', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Tipo de Evento */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${badgeColor}`}>
                          {evt.tipo}
                        </span>
                      </td>

                      {/* Persona Asociada */}
                      <td className="py-3 px-3">
                        {person ? (
                          <div>
                            <span className="font-semibold text-[#11120f] block">
                              {person.nombre} {person.apellido}
                            </span>
                            <span className="font-mono text-[10px] bg-[#f4f0e6] px-1.5 py-0.2 rounded border border-[#e9e2d3]">
                              {person.codigoLink}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-[#66685f]">ID: {evt.personaId}</span>
                        )}
                      </td>

                      {/* Contexto y Descripción */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#11120f]">{evt.contexto}</div>
                        {evt.notas && (
                          <div className="text-[11px] text-[#66685f] mt-0.5">{evt.notas}</div>
                        )}
                      </td>

                      {/* Actor / Operador */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#11120f]">{evt.actor.nombre}</div>
                        <div className="text-[10px] font-mono text-[#66685f] uppercase">
                          {evt.actor.rol}
                        </div>
                      </td>

                      {/* Ficha */}
                      <td className="py-3 px-4 text-right">
                        {person && (
                          <button
                            type="button"
                            onClick={() => onOpenFicha(person)}
                            className="px-2.5 py-1 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded text-[11px] font-medium cursor-pointer"
                          >
                            Ver 360
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 bg-[#f4f0e6]/60 border-t border-[#e9e2d3] flex items-center justify-between text-[11px] text-[#66685f]">
          <span>Mostrando {filteredEvents.length} eventos</span>
          <span className="font-mono">Libro inmutable de auditoría</span>
        </div>
      </div>
    </div>
  );
};
