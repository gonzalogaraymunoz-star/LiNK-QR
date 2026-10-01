import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Building2, Search, Sparkles, UserRound } from 'lucide-react';
import { QrCodeRenderer } from './QrCodeRenderer.tsx';
import {
  LinkBusiness,
  LinkProduct,
  LinkQrRegistryEntry,
  trackRegistryQrEvent,
} from '../services/linkWorldService.ts';

type EntityType = LinkQrRegistryEntry['entity_type'];

interface Props {
  entries: LinkQrRegistryEntry[];
  businesses: LinkBusiness[];
  products: LinkProduct[];
  initialEntityId?: string | null;
  onRefresh: () => Promise<void>;
}

const labels: Record<EntityType, string> = {
  person: 'Personas',
  prospect: 'Entradas',
  business: 'Negocios',
  product: 'Productos',
};

const descriptions: Record<EntityType, string> = {
  person: 'Pasaporte único de cada persona dentro del ecosistema.',
  prospect: 'Solicitudes, contactos y oportunidades. Cada entrada pertenece a una Persona LINK cuando podemos identificarla.',
  business: 'Identidad única de cada célula comercial de LINK World.',
  product: 'Identidad única de cada producto u oferta que vive dentro de un negocio.',
};

const humanStatus = (status?: string | null) => {
  const labels: Record<string, string> = {
    active: 'Activa',
    paused: 'Pausada',
    revoked: 'Revocada',
  };
  return labels[String(status || '').toLowerCase()] || status || 'Sin estado';
};

const metaText = (entry: LinkQrRegistryEntry, key: string) => {
  const value = entry.metadata?.[key];
  return value == null ? '' : String(value);
};

const entityTypeLabel = (type: EntityType) =>
  type === 'prospect' ? 'entrada' : type === 'person' ? 'persona' : type === 'business' ? 'negocio' : 'producto';

export function QrStudioView({
  entries,
  businesses,
  products,
  initialEntityId,
  onRefresh,
}: Props) {
  const [type, setType] = useState<EntityType>('person');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialEntityId) return;
    const match = entries.find((entry) => entry.entity_id === initialEntityId);
    if (match) {
      setType(match.entity_type);
      setSelectedId(match.id);
    }
  }, [initialEntityId, entries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (entry.entity_type !== type) return false;
      if (!needle) return true;
      return [entry.label, entry.universal_code, ...Object.values(entry.metadata || {})]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [entries, type, query]);

  useEffect(() => {
    if (selectedId && filtered.some((entry) => entry.id === selectedId)) return;
    setSelectedId(filtered[0]?.id || null);
  }, [filtered, selectedId]);

  const selected = entries.find((entry) => entry.id === selectedId) || null;
  const business = selected?.business_id
    ? businesses.find((item) => item.id === selected.business_id) || null
    : null;
  const product =
    selected?.entity_type === 'product'
      ? products.find((item) => item.id === selected.entity_id) || null
      : null;

  const counts = useMemo(
    () => ({
      person: entries.filter((entry) => entry.entity_type === 'person').length,
      prospect: entries.filter((entry) => entry.entity_type === 'prospect').length,
      business: entries.filter((entry) => entry.entity_type === 'business').length,
      product: entries.filter((entry) => entry.entity_type === 'product').length,
    }),
    [entries]
  );

  const registerGeneration = async () => {
    if (!selected) return;
    try {
      await trackRegistryQrEvent(
        selected,
        'QR_RENDERED',
        'QR abierto desde LINK ID · QR Studio',
        {
          entity_type: selected.entity_type,
          business_id: selected.business_id,
        }
      );
      setMessage('Generación registrada.');
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const iconFor = (entityType: EntityType) => {
    if (entityType === 'person' || entityType === 'prospect') return <UserRound className="w-4 h-4" />;
    if (entityType === 'business') return <Building2 className="w-4 h-4" />;
    return <Boxes className="w-4 h-4" />;
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66685f]">
          Identidad transversal
        </div>
        <h2 className="text-2xl font-bold tracking-tight">QR Studio</h2>
        <p className="text-sm text-[#66685f] mt-1">
          Un QR único por persona, entrada, negocio y producto. La persona es la identidad; la entrada conserva el contexto de cada contacto.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {(['person', 'prospect', 'business', 'product'] as EntityType[]).map((entityType) => (
          <button
            key={entityType}
            onClick={() => {
              setType(entityType);
              setSelectedId(null);
            }}
            className={`text-left p-4 rounded-2xl border transition-colors ${
              type === entityType
                ? 'bg-[#11120f] text-white border-[#11120f]'
                : 'bg-[#fffdf7] border-[#e9e2d3] hover:border-[#11120f]'
            }`}
          >
            <div className="flex items-center justify-between">
              {iconFor(entityType)}
              <span className={`text-xl font-bold ${type === entityType ? 'text-[#d8ff58]' : ''}`}>
                {counts[entityType]}
              </span>
            </div>
            <div className="font-bold text-sm mt-4">{labels[entityType]}</div>
            <div className={`text-[11px] mt-1 ${type === entityType ? 'text-white/65' : 'text-[#66685f]'}`}>
              {descriptions[entityType]}
            </div>
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-[390px_1fr] gap-5">
        <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#e9e2d3]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#66685f]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Buscar en ${labels[type].toLowerCase()}`}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs outline-none"
              />
            </div>
          </div>

          <div className="max-h-[66vh] overflow-auto p-2">
            {filtered.map((entry) => {
              const entryBusiness = entry.business_id
                ? businesses.find((item) => item.id === entry.business_id)
                : null;
              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={`w-full text-left p-3 rounded-xl border mb-2 ${
                    selected?.id === entry.id
                      ? 'border-[#11120f] bg-white'
                      : 'border-transparent hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold">{entry.universal_code}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d8ff58] text-[#11120f]">
                      {humanStatus(entry.status)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold mt-1">{entry.label}</div>
                  {entry.entity_type === 'prospect' && metaText(entry, 'internal_reference') && (
                    <div className="text-[9px] font-mono text-[#8a8b84] mt-0.5">
                      Ref. {metaText(entry, 'internal_reference')}
                    </div>
                  )}
                  <div className="text-[10px] text-[#66685f] mt-0.5">
                    {entry.entity_type === 'business'
                      ? 'Negocio LINK'
                      : entryBusiness?.name || 'Sin negocio asociado'}
                  </div>
                </button>
              );
            })}
            {!filtered.length && (
              <div className="p-8 text-center text-xs text-[#66685f]">No hay identidades para este filtro.</div>
            )}
          </div>
        </div>

        <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5 sm:p-7 min-h-[620px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-[#66685f]">
              Selecciona una identidad.
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">
                    {entityTypeLabel(selected.entity_type)}
                  </span>
                  <span className="text-[9px] px-2 py-1 rounded-full bg-[#f4f0e6]">
                    QR permanente
                  </span>
                </div>
                <h3 className="text-3xl font-bold tracking-tight mt-2">{selected.label}</h3>
                <div className="font-mono text-sm mt-2">{selected.universal_code}</div>

                <div className="mt-7 grid sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-[#f4f0e6]">
                    <div className="text-[9px] uppercase text-[#66685f]">Negocio</div>
                    <div className="text-sm font-semibold mt-1">
                      {selected.entity_type === 'business' ? selected.label : business?.name || 'Sin negocio'}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f4f0e6]">
                    <div className="text-[9px] uppercase text-[#66685f]">Estado</div>
                    <div className="text-sm font-semibold mt-1">{humanStatus(selected.status)}</div>
                  </div>
                  {selected.entity_type === 'prospect' && (
                    <>
                      <div className="p-4 rounded-2xl bg-white border border-[#e9e2d3]">
                        <div className="text-[9px] uppercase text-[#66685f]">Persona LINK</div>
                        <div className="text-sm font-semibold mt-1">
                          {metaText(selected, 'person_universal_code') || 'Por resolver'}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-[#e9e2d3]">
                        <div className="text-[9px] uppercase text-[#66685f]">Referencia interna</div>
                        <div className="text-sm font-semibold mt-1">
                          {metaText(selected, 'internal_reference') || 'Sin referencia'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {product && (
                  <div className="mt-3 p-4 rounded-2xl border border-[#e9e2d3] bg-white">
                    <div className="text-[9px] uppercase text-[#66685f]">Producto</div>
                    <div className="font-semibold mt-1">{product.name}</div>
                    <div className="text-xs text-[#66685f] mt-1">
                      {[product.code, product.category, product.stage].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 rounded-2xl bg-[#11120f] text-white">
                  <div className="flex items-center gap-2 text-[#d8ff58] text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    Triangulación LINK
                  </div>
                  <div className="text-sm mt-3 leading-6">
                    {selected.entity_type === 'person' && (
                      <>Este es el <b>pasaporte LINK</b>. Responde quién es la persona y acumula su historia a través de múltiples entradas.</>
                    )}
                    {selected.entity_type === 'prospect' && (
                      <>Este QR representa una <b>entrada</b>: una solicitud o contacto concreto. {metaText(selected, 'person_universal_code') ? <>Ya está vinculada al <b>pasaporte LINK</b> de la persona.</> : <>La identidad humana todavía está <b>por resolver</b>.</>}</>
                    )}
                    {selected.entity_type === 'business' && (
                      <>Este QR responde <b>dónde</b>. Puede cruzarse con cualquier prospecto y con los productos de esta célula.</>
                    )}
                    {selected.entity_type === 'product' && (
                      <>Este QR responde <b>qué</b>. Ya conoce su negocio: <b>{business?.name || 'LINK World'}</b>.</>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <QrCodeRenderer
                  token={selected.qr_token}
                  codigoLink={selected.universal_code}
                  nombrePersona={selected.label}
                  size={260}
                />
                <button
                  onClick={registerGeneration}
                  className="mt-5 w-full py-2.5 rounded-xl bg-[#d8ff58] border border-[#11120f] text-xs font-bold"
                >
                  Registrar esta generación
                </button>
                {message && <div className="mt-3 text-[11px] text-[#66685f] text-center">{message}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
