import React, { useState } from 'react';
import { Person, PersonStatus } from '../types/index.ts';
import {
  createPerson,
  setPersonStatus,
} from '../services/identityService.ts';
import {
  Search,
  UserPlus,
  QrCode,
  Eye,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Filter,
} from 'lucide-react';

interface PersonasViewProps {
  persons: Person[];
  onRefresh: () => void;
  onOpenFicha: (person: Person) => void;
  onNavigateToGeneratorForPerson: (personId: string) => void;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}

export const PersonasView: React.FC<PersonasViewProps> = ({
  persons,
  onRefresh,
  onOpenFicha,
  onNavigateToGeneratorForPerson,
  isCreateModalOpen,
  onCloseCreateModal,
  onOpenCreateModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | PersonStatus>('todos');

  // Form state for creating a person
  const [newNombre, setNewNombre] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newNotas, setNewNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    try {
      if (!newNombre.trim() || !newApellido.trim() || !newEmail.trim()) {
        throw new Error('Nombre, apellido y correo son obligatorios.');
      }

      await createPerson({
        nombre: newNombre,
        apellido: newApellido,
        email: newEmail,
        telefono: newTelefono || undefined,
        notas: newNotas || undefined,
      });

      // Clear form
      setNewNombre('');
      setNewApellido('');
      setNewEmail('');
      setNewTelefono('');
      setNewNotas('');
      onCloseCreateModal();
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCreateError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatusQuick = async (person: Person) => {
    const nextStatus: PersonStatus = person.estado === 'activo' ? 'inactivo' : 'activo';
    await setPersonStatus(
      person.id,
      nextStatus,
      `Acción rápida en listado de personas (a ${nextStatus})`
    );
    onRefresh();
  };

  const filteredPersons = persons.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.nombre.toLowerCase().includes(term) ||
      p.apellido.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.codigoLink.toLowerCase().includes(term) ||
      (p.telefono && p.telefono.includes(term));

    const matchesStatus = statusFilter === 'todos' || p.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#11120f]">
            Administración Central de Personas
          </h2>
          <p className="text-xs text-[#66685f]">
            Gestión del registro maestro y asignación de identificadores permanentes LINK
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#11120f] text-[#d8ff58] rounded-xl text-xs font-semibold hover:bg-[#252820] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Persona</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#fffdf7] p-3 rounded-xl border border-[#e9e2d3] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#66685f]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, apellido, email o código LNK..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-[#66685f]" />
          <span className="text-[11px] text-[#66685f]">Estado:</span>
          {(['todos', 'activo', 'inactivo', 'suspendido'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#11120f] text-[#d8ff58] font-semibold'
                  : 'bg-[#f4f0e6] text-[#66685f] hover:text-[#11120f]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Persons Data Table */}
      <div className="bg-[#fffdf7] rounded-xl border border-[#e9e2d3] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#11120f] text-[#fffdf7] font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Persona</th>
                <th className="py-3 px-3">Código LINK</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Incorporación</th>
                <th className="py-3 px-3 text-center">Escaneos</th>
                <th className="py-3 px-3">Última Actividad</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e9e2d3]">
              {filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-[#66685f]">
                    No se encontraron personas con los criterios indicados.
                  </td>
                </tr>
              ) : (
                filteredPersons.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#f4f0e6]/50 transition-colors"
                    >
                      {/* Persona */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#e9e2d3] text-[#11120f] font-bold flex items-center justify-center text-xs shrink-0">
                            {p.nombre.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#11120f]">
                              {p.nombre} {p.apellido}
                            </div>
                            <div className="text-[10px] font-mono text-[#66685f]">
                              ID: {p.id.substring(0, 12)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Código LINK */}
                      <td className="py-3 px-3 font-mono font-bold text-[#11120f]">
                        <span className="bg-[#f4f0e6] px-2 py-0.5 rounded border border-[#e9e2d3]">
                          {p.codigoLink}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-3 text-[#66685f]">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[160px]">{p.email}</span>
                        </div>
                        {p.telefono && (
                          <div className="flex items-center gap-1 text-[11px] text-[#66685f] mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{p.telefono}</span>
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            p.estado === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.estado === 'inactivo'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.estado === 'activo'
                                ? 'bg-emerald-600'
                                : p.estado === 'inactivo'
                                ? 'bg-amber-600'
                                : 'bg-red-600'
                            }`}
                          ></span>
                          {p.estado}
                        </span>
                      </td>

                      {/* Fecha de incorporación */}
                      <td className="py-3 px-3 text-[#66685f] font-mono text-[11px]">
                        {new Date(p.fechaIncorporacion).toLocaleDateString('es-CL')}
                      </td>

                      {/* Número de escaneos */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#11120f]">
                        {p.totalEscaneos}
                      </td>

                      {/* Última actividad */}
                      <td className="py-3 px-3 text-[#66685f] text-[11px] font-mono">
                        {p.ultimoEscaneo ? (
                          new Date(p.ultimoEscaneo).toLocaleString('es-CL', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-gray-400">Sin escaneos</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenFicha(p)}
                            className="p-1.5 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded-lg text-xs font-medium cursor-pointer"
                            title="Abrir Ficha Administrativa 360"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateToGeneratorForPerson(p.id)}
                            className="p-1.5 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded-lg text-xs font-medium cursor-pointer"
                            title="Consultar / Administrar QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatusQuick(p)}
                            className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                              p.estado === 'activo'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={p.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          >
                            {p.estado === 'activo' ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 bg-[#f4f0e6]/60 border-t border-[#e9e2d3] flex items-center justify-between text-[11px] text-[#66685f]">
          <span>Mostrando {filteredPersons.length} de {persons.length} personas</span>
          <span className="font-mono">Registro central LINK OS</span>
        </div>
      </div>

      {/* CREATE PERSON MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11120f]/80 backdrop-blur-xs">
          <div className="bg-[#fffdf7] w-full max-w-lg rounded-2xl border-2 border-[#11120f] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9e2d3]">
              <div>
                <h3 className="text-base font-bold text-[#11120f] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#11120f]" />
                  Registrar Persona en Centro de Control
                </h3>
                <p className="text-xs text-[#66685f]">
                  Crea una nueva identidad central. No requiere que el cliente inicie sesión.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseCreateModal}
                className="text-[#66685f] hover:text-[#11120f] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="my-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreatePerson} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11120f] mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Ej: Marcelo"
                    className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#11120f] mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={newApellido}
                    onChange={(e) => setNewApellido(e.target.value)}
                    placeholder="Ej: Soto"
                    className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11120f] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="marcelo.soto@ejemplo.cl"
                  className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                />
                <p className="text-[10px] text-[#66685f] mt-1">
                  Nota: El identificador permanente es el Código LINK generado, no el correo electrónico.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11120f] mb-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={newTelefono}
                  onChange={(e) => setNewTelefono(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11120f] mb-1">Notas Administrativas</label>
                <textarea
                  rows={2}
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  placeholder="Rol institucional, sede de trabajo, observaciones operativas..."
                  className="w-full px-3 py-2 text-xs bg-[#fffdf7] border border-[#e9e2d3] rounded-lg focus:outline-hidden focus:border-[#11120f]"
                />
              </div>

              <div className="pt-3 border-t border-[#e9e2d3] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-3 py-2 text-xs text-[#66685f] hover:text-[#11120f] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#11120f] text-[#d8ff58] rounded-xl text-xs font-semibold hover:bg-[#252820] cursor-pointer transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar Identidad'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
