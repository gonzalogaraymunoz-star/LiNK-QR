import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CircleUserRound,
  Compass,
  Languages,
  MapPin,
  MessageCircle,
  Pencil,
  Route,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { QrCodeRenderer } from './QrCodeRenderer.tsx';
import {
  LinkBusiness,
  LinkInteraction,
  LinkPersonGraph,
  LinkPersonStudy,
  LinkProduct,
  updatePersonProfile,
} from '../services/linkWorldService.ts';

interface Props {
  persons: LinkPersonGraph[];
  studies: LinkPersonStudy[];
  interactions: LinkInteraction[];
  businesses: LinkBusiness[];
  products: LinkProduct[];
  onRefresh?: () => Promise<void>;
}

const fmt = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '—';

const stageLabel = (stage?: LinkPersonGraph['profile_stage']) =>
  ({
    inicial: 'Inicial',
    identificada: 'Identificada',
    enriquecida: 'Enriquecida',
    conocida: 'Conocida',
  })[stage || 'inicial'];

const sourceLabel = (person: LinkPersonGraph, field: string) =>
  person.field_sources?.[field]?.source === 'manual' ? 'confirmado' : 'observado';

const textValue = (value?: string | null) => value?.trim() || '—';

export function PersonsView({
  persons,
  studies,
  interactions,
  businesses,
  products,
  onRefresh,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(persons[0]?.person_id || null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return persons;
    return persons.filter((person) =>
      [
        person.display_name,
        person.universal_code,
        person.email,
        person.phone,
        person.country,
        person.city,
        person.preferred_language,
        person.relationship_type,
        ...(person.interests || []),
        ...(person.detected_channels || []),
        ...person.leads.flatMap((lead) => [
          lead.business_name,
          lead.stage,
          lead.source,
          lead.interested_product,
        ]),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [persons, query]);

  const selected =
    persons.find((person) => person.person_id === selectedId) ||
    filtered[0] ||
    persons[0] ||
    null;

  useEffect(() => {
    if (!selectedId && persons[0]) setSelectedId(persons[0].person_id);
    if (selectedId && !persons.some((person) => person.person_id === selectedId) && persons[0]) {
      setSelectedId(persons[0].person_id);
    }
  }, [persons, selectedId]);

  const study = selected
    ? studies.find((item) => item.person_id === selected.person_id) || null
    : null;

  const personInteractions = useMemo(
    () =>
      selected
        ? interactions
            .filter((item) => item.person_id === selected.person_id)
            .sort((a, b) => +new Date(a.occurred_at) - +new Date(b.occurred_at))
        : [],
    [interactions, selected]
  );

  const graphBusinesses = useMemo(() => {
    if (!selected) return [];
    const ids = new Set<string>();
    selected.leads.forEach((lead) => {
      if (lead.business_id) ids.add(lead.business_id);
    });
    personInteractions.forEach((item) => {
      if (item.business_id) ids.add(item.business_id);
    });
    return [...ids]
      .map((id) => businesses.find((item) => item.id === id))
      .filter(Boolean) as LinkBusiness[];
  }, [selected, personInteractions, businesses]);

  const graphProducts = useMemo(() => {
    const ids = new Set(personInteractions.map((item) => item.product_id).filter(Boolean) as string[]);
    return [...ids]
      .map((id) => products.find((item) => item.id === id))
      .filter(Boolean) as LinkProduct[];
  }, [personInteractions, products]);

  const graphNodes = useMemo(() => {
    const items: Array<{ id: string; label: string; kind: 'business' | 'product'; x: number; y: number }> = [];
    graphBusinesses.forEach((business, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(graphBusinesses.length, 1) - Math.PI / 2;
      items.push({
        id: business.id,
        label: business.name,
        kind: 'business',
        x: 50 + Math.cos(angle) * 34,
        y: 48 + Math.sin(angle) * 31,
      });
    });
    graphProducts.forEach((product, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(graphProducts.length, 1);
      items.push({
        id: product.id,
        label: product.name,
        kind: 'product',
        x: 50 + Math.cos(angle) * 22,
        y: 48 + Math.sin(angle) * 20,
      });
    });
    return items;
  }, [graphBusinesses, graphProducts]);

  const [form, setForm] = useState({
    display_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    preferred_language: '',
    preferred_channel: '',
    relationship_type: '',
    interests: '',
    notes: '',
    next_action: '',
    next_action_at: '',
  });

  useEffect(() => {
    if (!selected) return;
    setForm({
      display_name: selected.display_name || '',
      email: selected.email || '',
      phone: selected.phone || '',
      country: selected.country || '',
      city: selected.city || '',
      preferred_language: selected.preferred_language || '',
      preferred_channel: selected.preferred_channel || '',
      relationship_type: selected.relationship_type || '',
      interests: (selected.interests || []).join(', '),
      notes: selected.notes || '',
      next_action: selected.next_action || '',
      next_action_at: selected.next_action_at
        ? new Date(selected.next_action_at).toISOString().slice(0, 16)
        : '',
    });
    setSaveError(null);
    setEditing(false);
  }, [selected?.person_id]);

  const missingFields = useMemo(() => {
    if (!selected) return [];
    const missing: string[] = [];
    if (!selected.display_name) missing.push('nombre');
    if (!selected.phone && !selected.email) missing.push('contacto');
    if (!selected.country) missing.push('país');
    if (!selected.preferred_language) missing.push('idioma');
    if (!selected.preferred_channel) missing.push('canal preferido');
    if (!selected.relationship_type) missing.push('tipo de relación');
    if (!(selected.interests || []).length) missing.push('intereses');
    if (!selected.next_action) missing.push('siguiente acción');
    return missing;
  }, [selected]);

  const saveProfile = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updatePersonProfile({
        person_id: selected.person_id,
        display_name: form.display_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        preferred_language: form.preferred_language.trim(),
        preferred_channel: form.preferred_channel.trim(),
        relationship_type: form.relationship_type.trim(),
        interests: form.interests
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        notes: form.notes.trim(),
        next_action: form.next_action.trim(),
        next_action_at: form.next_action_at ? new Date(form.next_action_at).toISOString() : null,
      });
      if (onRefresh) await onRefresh();
      setEditing(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message?: unknown }).message || 'No pude guardar la ficha.')
            : String(err);
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66685f]">
            Microscopio del micelio
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Personas LINK</h2>
          <p className="text-sm text-[#66685f] mt-1">
            Una persona, un pasaporte vivo. La ficha se completa con evidencia, interacción y confirmación humana.
          </p>
        </div>
        <div className="text-[11px] text-[#66685f]">
          {persons.length} persona{persons.length === 1 ? '' : 's'} en el micelio
        </div>
      </div>

      <div className="grid xl:grid-cols-[360px_1fr] gap-5">
        <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#e9e2d3]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#66685f]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="buscar persona, ID, negocio o interés"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs outline-none"
              />
            </div>
          </div>
          <div className="max-h-[73vh] overflow-auto p-2">
            {filtered.map((person) => {
              const completion = Number(person.completeness_percent || 0);
              return (
                <button
                  key={person.person_id}
                  onClick={() => setSelectedId(person.person_id)}
                  className={`w-full text-left p-3 rounded-xl border mb-2 ${
                    selected?.person_id === person.person_id
                      ? 'border-[#11120f] bg-white'
                      : 'border-transparent hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold">{person.universal_code}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f4f0e6]">
                      {completion}%
                    </span>
                  </div>
                  <div className="text-xs font-semibold mt-1">
                    {person.display_name || 'Persona LINK'}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="text-[10px] text-[#66685f]">
                      {person.lead_count} entrada{person.lead_count === 1 ? '' : 's'} · {person.interaction_count} interacción{person.interaction_count === 1 ? '' : 'es'}
                    </div>
                    <div className="text-[9px] text-[#66685f]">{stageLabel(person.profile_stage)}</div>
                  </div>
                  <div className="h-1 bg-[#ece6d9] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#11120f]" style={{ width: `${completion}%` }} />
                  </div>
                </button>
              );
            })}
            {!filtered.length && (
              <div className="p-6 text-center text-xs text-[#66685f]">No encontré personas con ese filtro.</div>
            )}
          </div>
        </div>

        {!selected ? (
          <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl min-h-[620px] flex items-center justify-center text-sm text-[#66685f]">
            Todavía no hay personas LINK.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
              <div className="grid lg:grid-cols-[1fr_220px] gap-6 items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">
                      Pasaporte LINK
                    </div>
                    <span className="text-[9px] px-2 py-1 rounded-full bg-[#d8ff58] font-semibold">
                      {stageLabel(selected.profile_stage)}
                    </span>
                    <span className="text-[9px] px-2 py-1 rounded-full bg-[#f4f0e6]">
                      {selected.status}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight mt-2">
                    {selected.display_name || 'Persona LINK'}
                  </h3>
                  <div className="font-mono text-sm mt-2">{selected.universal_code}</div>

                  <div className="mt-5 max-w-2xl">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-[#66685f]">Ficha conocida</div>
                        <div className="text-2xl font-bold">{selected.completeness_percent || 0}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase text-[#66685f]">Negocio de origen</div>
                        <div className="text-xs font-semibold">{selected.primary_business_name || 'Sin definir'}</div>
                      </div>
                    </div>
                    <div className="h-2 bg-[#ece6d9] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[#11120f] transition-all"
                        style={{ width: `${selected.completeness_percent || 0}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {missingFields.slice(0, 6).map((field) => (
                        <span key={field} className="text-[9px] px-2 py-1 rounded-lg bg-[#fff2dc] text-[#7b5a25]">
                          falta {field}
                        </span>
                      ))}
                      {!missingFields.length && (
                        <span className="text-[9px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                          ficha suficientemente completa
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 mt-5">
                    <div className="p-3 rounded-xl bg-[#f4f0e6]">
                      <div className="text-[9px] uppercase text-[#66685f]">Entradas</div>
                      <div className="text-xl font-bold mt-1">{selected.lead_count}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f4f0e6]">
                      <div className="text-[9px] uppercase text-[#66685f]">Interacciones</div>
                      <div className="text-xl font-bold mt-1">{selected.interaction_count}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f4f0e6]">
                      <div className="text-[9px] uppercase text-[#66685f]">Último movimiento</div>
                      <div className="text-xs font-semibold mt-2">{fmt(selected.last_interaction_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <QrCodeRenderer
                    token={selected.qr_token}
                    codigoLink={selected.universal_code}
                    nombrePersona={selected.display_name || undefined}
                    size={180}
                  />
                  <button
                    onClick={() => setEditing((value) => !value)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#11120f] text-[#d8ff58] text-xs font-semibold"
                  >
                    {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                    {editing ? 'Cerrar edición' : 'Completar ficha'}
                  </button>
                </div>
              </div>
            </div>

            {editing && (
              <div className="bg-[#fffdf7] border border-[#11120f] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">
                      Completar / confirmar
                    </div>
                    <h3 className="font-bold text-lg mt-1">Lo que sabemos de esta persona</h3>
                    <p className="text-xs text-[#66685f] mt-1">
                      Lo manual queda marcado como confirmado. El historial observado no se borra.
                    </p>
                  </div>
                  <button onClick={() => setEditing(false)} className="p-2 rounded-lg border border-[#e9e2d3]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[
                    ['Nombre', 'display_name', 'Cómo identificamos a la persona'],
                    ['Teléfono', 'phone', 'Con código de país'],
                    ['Email', 'email', 'Correo de contacto'],
                    ['País', 'country', 'País de origen o residencia útil'],
                    ['Ciudad', 'city', 'Ciudad útil para contexto'],
                    ['Idioma preferido', 'preferred_language', 'Ej: PT-BR, ES, EN'],
                    ['Canal preferido', 'preferred_channel', 'Ej: WhatsApp, Instagram, email'],
                    ['Tipo de relación', 'relationship_type', 'Ej: viajero, huésped, aliado, proveedor'],
                    ['Intereses', 'interests', 'Separados por coma'],
                  ].map(([label, key, placeholder]) => (
                    <label key={key} className="block">
                      <span className="text-[9px] uppercase text-[#66685f]">{label}</span>
                      <input
                        value={String(form[key as keyof typeof form] || '')}
                        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                        placeholder={placeholder}
                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e9e2d3] bg-white text-xs outline-none focus:border-[#11120f]"
                      />
                    </label>
                  ))}
                </div>

                <div className="grid lg:grid-cols-[1fr_260px] gap-3 mt-3">
                  <label className="block">
                    <span className="text-[9px] uppercase text-[#66685f]">Siguiente acción</span>
                    <input
                      value={form.next_action}
                      onChange={(event) => setForm((current) => ({ ...current, next_action: event.target.value }))}
                      placeholder="Ej: enviar itinerario, pedir fechas, hacer seguimiento"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e9e2d3] bg-white text-xs outline-none focus:border-[#11120f]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[9px] uppercase text-[#66685f]">Cuándo</span>
                    <input
                      type="datetime-local"
                      value={form.next_action_at}
                      onChange={(event) => setForm((current) => ({ ...current, next_action_at: event.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e9e2d3] bg-white text-xs outline-none focus:border-[#11120f]"
                    />
                  </label>
                </div>

                <label className="block mt-3">
                  <span className="text-[9px] uppercase text-[#66685f]">Notas útiles</span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Contexto que ayude a continuar la relación. Evita guardar información que no necesitamos."
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e9e2d3] bg-white text-xs outline-none focus:border-[#11120f]"
                  />
                </label>

                {saveError && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                    {saveError}
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#11120f] text-[#d8ff58] text-xs font-semibold disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Guardando…' : 'Guardar en LINK ID'}
                  </button>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">Identidad útil</div>
                <h3 className="font-bold text-lg mt-1">Lo que está disponible ahora</h3>
                <div className="grid sm:grid-cols-2 gap-2 mt-4">
                  {[
                    ['Nombre', textValue(selected.display_name), 'display_name', CircleUserRound],
                    ['Contacto', selected.phone || selected.email || '—', selected.phone ? 'phone' : 'email', MessageCircle],
                    ['Lugar', [selected.city, selected.country].filter(Boolean).join(', ') || '—', 'country', MapPin],
                    ['Idioma', textValue(selected.preferred_language), 'preferred_language', Languages],
                    ['Relación', textValue(selected.relationship_type), 'relationship_type', Compass],
                    ['Canal preferido', textValue(selected.preferred_channel), 'preferred_channel', MessageCircle],
                  ].map(([label, value, field, Icon]) => {
                    const I = Icon as React.ComponentType<{ className?: string }>;
                    return (
                      <div key={String(label)} className="p-3 rounded-xl bg-white border border-[#e9e2d3]">
                        <div className="flex items-center justify-between gap-2">
                          <I className="w-3.5 h-3.5" />
                          <span className="text-[8px] uppercase text-[#999b93]">{sourceLabel(selected, String(field))}</span>
                        </div>
                        <div className="text-[9px] uppercase text-[#66685f] mt-2">{String(label)}</div>
                        <div className="text-xs font-semibold mt-1">{String(value)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <div className="text-[9px] uppercase text-[#66685f]">Intereses conocidos</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(selected.interests || []).map((item) => (
                      <span key={item} className="px-2 py-1 rounded-lg bg-[#d8ff58] text-[10px] font-medium">{item}</span>
                    ))}
                    {!(selected.interests || []).length && <span className="text-[10px] text-[#999b93]">Aún sin intereses confirmados</span>}
                  </div>
                </div>
              </div>

              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">Continuidad</div>
                <h3 className="font-bold text-lg mt-1">Qué hacemos después</h3>

                <div className="mt-4 p-4 rounded-2xl bg-[#11120f] text-white">
                  <div className="text-[9px] uppercase text-[#d8ff58]">Siguiente acción</div>
                  <div className="font-semibold mt-2">{selected.next_action || 'Todavía no definida'}</div>
                  <div className="text-[10px] text-white/60 mt-2">{selected.next_action_at ? fmt(selected.next_action_at) : 'Sin fecha'}</div>
                </div>

                <div className="mt-3">
                  <div className="text-[9px] uppercase text-[#66685f]">Canales detectados</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(selected.detected_channels || []).map((channel) => (
                      <span key={channel} className="px-2 py-1 rounded-lg bg-[#f4f0e6] text-[10px]">{channel}</span>
                    ))}
                    {!(selected.detected_channels || []).length && <span className="text-[10px] text-[#999b93]">Sin canal observado</span>}
                  </div>
                </div>

                {selected.notes && (
                  <div className="mt-4 p-3 rounded-xl border border-[#e9e2d3] bg-white">
                    <div className="text-[9px] uppercase text-[#66685f]">Nota</div>
                    <div className="text-xs leading-5 mt-1">{selected.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">
                Ingeniería del lead
              </div>
              <h3 className="font-bold text-lg mt-1">Qué sabemos para convertir mejor</h3>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-2 mt-4">
                <div className="p-3 rounded-xl bg-[#f4f0e6]">
                  <div className="text-[9px] uppercase text-[#66685f]">Nivel conversión</div>
                  <div className="text-lg font-bold mt-1">{study?.max_conversion_level ?? '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#f4f0e6]">
                  <div className="text-[9px] uppercase text-[#66685f]">Prioridad</div>
                  <div className="text-lg font-bold mt-1">{study?.max_priority_score ?? '—'}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#f4f0e6]">
                  <div className="text-[9px] uppercase text-[#66685f]">Negocios tocados</div>
                  <div className="text-lg font-bold mt-1">{study?.businesses_touched ?? graphBusinesses.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#f4f0e6]">
                  <div className="text-[9px] uppercase text-[#66685f]">Margen estimado</div>
                  <div className="text-lg font-bold mt-1">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(study?.estimated_margin_total || 0)}
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  {[
                    ['Necesidad', 'need'],
                    ['Interés', 'interest'],
                    ['Disparador', 'trigger'],
                    ['Fricción', 'friction'],
                    ['Momento', 'timing'],
                    ['Canal', 'channel_preference'],
                    ['Respuesta', 'response'],
                    ['Valor', 'value'],
                  ].map(([label, key]) => {
                    const values = study?.signals?.[key] || [];
                    return (
                      <div key={key} className="p-3 rounded-xl border border-[#e9e2d3] bg-white">
                        <div className="text-[9px] uppercase text-[#66685f]">{label}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {values.slice(0, 4).map((item, index) => (
                            <span key={index} className="px-2 py-1 rounded-lg bg-[#f4f0e6] text-[10px]">
                              {item.value}
                            </span>
                          ))}
                          {!values.length && <span className="text-[10px] text-[#999b93]">Aún sin señal</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <div className="p-4 rounded-2xl bg-[#11120f] text-white">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-[#d8ff58]">
                      Motor de conversión
                    </div>
                    {study?.conversion_assessments?.length ? (
                      <>
                        <div className="font-bold mt-3">
                          {study.conversion_assessments[0]?.label || 'Evaluación disponible'}
                        </div>
                        <div className="text-xs text-white/70 mt-2 leading-5">
                          {study.conversion_assessments[0]?.reason || 'Sin explicación disponible.'}
                        </div>
                        <div className="mt-4 p-3 rounded-xl bg-white/10">
                          <div className="text-[9px] uppercase text-white/55">Siguiente acción sugerida</div>
                          <div className="text-xs font-semibold mt-1">
                            {study.conversion_assessments[0]?.recommended_action || 'Esperar nueva señal.'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-white/65 mt-3">
                        Todavía no hay evaluación suficiente para esta persona.
                      </div>
                    )}
                  </div>

                  <div className="mt-3 p-4 rounded-2xl border border-[#e9e2d3] bg-white">
                    <div className="text-[9px] uppercase text-[#66685f]">Fuentes que alimentan esta ficha</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(study?.interaction_sources || []).map((source) => (
                        <span key={source} className="px-2 py-1 rounded-lg bg-[#f4f0e6] text-[10px]">{source}</span>
                      ))}
                      {(selected.detected_channels || []).map((source) => (
                        <span key={`channel-${source}`} className="px-2 py-1 rounded-lg bg-[#eef4ff] text-[10px]">{source}</span>
                      ))}
                      {!study?.interaction_sources?.length && !(selected.detected_channels || []).length && (
                        <span className="text-[10px] text-[#999b93]">Sin fuentes aún</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">Grafo</div>
                  <h3 className="font-bold text-lg">Su universo dentro de LINK</h3>
                </div>
                <div className="text-[10px] text-[#66685f]">
                  {graphBusinesses.length} negocio{graphBusinesses.length === 1 ? '' : 's'} · {graphProducts.length} producto{graphProducts.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="relative h-[420px] rounded-2xl bg-[#f4f0e6] overflow-hidden border border-[#e9e2d3]">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {graphNodes.map((node) => (
                    <line
                      key={node.id}
                      x1="50"
                      y1="48"
                      x2={node.x}
                      y2={node.y}
                      stroke="currentColor"
                      strokeOpacity="0.16"
                      strokeWidth="0.35"
                    />
                  ))}
                </svg>

                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-[#11120f] text-white flex flex-col items-center justify-center text-center p-4 shadow-sm"
                  style={{ left: '50%', top: '48%' }}
                >
                  <CircleUserRound className="w-7 h-7 text-[#d8ff58] mb-2" />
                  <div className="text-xs font-bold line-clamp-2">{selected.display_name || 'Persona LINK'}</div>
                  <div className="font-mono text-[8px] text-[#d8ff58] mt-1">{selected.universal_code}</div>
                </div>

                {graphNodes.map((node) => (
                  <div
                    key={node.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-sm px-3 py-2 text-center max-w-36 ${
                      node.kind === 'business'
                        ? 'bg-white border-[#11120f]'
                        : 'bg-[#d8ff58] border-[#11120f]'
                    }`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <div className="flex justify-center mb-1">
                      {node.kind === 'business' ? <Building2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-[10px] font-semibold line-clamp-2">{node.label}</div>
                  </div>
                ))}

                {!graphNodes.length && (
                  <div className="absolute inset-x-0 bottom-6 text-center text-xs text-[#66685f]">
                    El grafo crecerá a medida que esta persona toque negocios y productos.
                  </div>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Route className="w-4 h-4" />
                  <h3 className="font-bold">Ruta observada</h3>
                </div>
                <div className="space-y-3">
                  {personInteractions.map((item, index) => {
                    const business = businesses.find((business) => business.id === item.business_id);
                    const product = products.find((product) => product.id === item.product_id);
                    return (
                      <div key={item.id} className="grid grid-cols-[28px_1fr] gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#11120f] text-[#d8ff58] flex items-center justify-center text-[9px] font-bold">
                            {index + 1}
                          </div>
                          {index < personInteractions.length - 1 && <div className="w-px flex-1 bg-[#d8d2c5] min-h-8" />}
                        </div>
                        <div className="pb-3">
                          <div className="text-xs font-semibold">{item.action_type.replaceAll('_', ' ')}</div>
                          <div className="text-[10px] text-[#66685f] mt-1">
                            {[business?.name, product?.name, item.channel].filter(Boolean).join(' · ') || item.source}
                          </div>
                          <div className="font-mono text-[9px] text-[#8a8b84] mt-1">{fmt(item.occurred_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  {!personInteractions.length && <div className="text-xs text-[#66685f]">Sin movimientos todavía.</div>}
                </div>
              </div>

              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  <h3 className="font-bold">Entradas que formaron esta persona</h3>
                </div>
                <div className="space-y-2">
                  {selected.leads.map((lead) => (
                    <div key={lead.lead_id} className="p-3 rounded-xl bg-white border border-[#e9e2d3]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold">{lead.business_name || 'Sin negocio'}</div>
                          <div className="text-[10px] text-[#66685f] mt-1">
                            {[lead.source, lead.interested_product].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-1 rounded-full bg-[#f4f0e6]">{lead.stage || 'new'}</span>
                      </div>
                    </div>
                  ))}
                  {!selected.leads.length && (
                    <div className="text-xs text-[#66685f]">Aún no hay entradas enlazadas a esta persona.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
