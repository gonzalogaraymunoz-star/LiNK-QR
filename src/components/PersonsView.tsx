import React, { useMemo, useState } from 'react';
import { Building2, CircleUserRound, Route, Search, Sparkles } from 'lucide-react';
import { QrCodeRenderer } from './QrCodeRenderer.tsx';
import {
  LinkBusiness,
  LinkInteraction,
  LinkPersonGraph,
  LinkProduct,
} from '../services/linkWorldService.ts';

interface Props {
  persons: LinkPersonGraph[];
  interactions: LinkInteraction[];
  businesses: LinkBusiness[];
  products: LinkProduct[];
}

const fmt = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '—';

export function PersonsView({ persons, interactions, businesses, products }: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(persons[0]?.person_id || null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return persons;
    return persons.filter((person) =>
      [
        person.display_name,
        person.universal_code,
        person.email,
        person.phone,
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

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66685f]">
          Microscopio del micelio
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Personas LINK</h2>
        <p className="text-sm text-[#66685f] mt-1">
          Una persona, un pasaporte LINK. Los leads son entradas; la historia vive aquí.
        </p>
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
            {filtered.map((person) => (
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
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#f4f0e6]">{person.status}</span>
                </div>
                <div className="text-xs font-semibold mt-1">
                  {person.display_name || 'Persona LINK'}
                </div>
                <div className="text-[10px] text-[#66685f] mt-1">
                  {person.lead_count} entrada{person.lead_count === 1 ? '' : 's'} · {person.interaction_count} interacción{person.interaction_count === 1 ? '' : 'es'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {!selected ? (
          <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl min-h-[620px] flex items-center justify-center text-sm text-[#66685f]">
            Todavía no hay personas LINK.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
              <div className="grid lg:grid-cols-[1fr_250px] gap-6 items-start">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66685f]">
                    Pasaporte LINK
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight mt-1">
                    {selected.display_name || 'Persona LINK'}
                  </h3>
                  <div className="font-mono text-sm mt-2">{selected.universal_code}</div>

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

                <QrCodeRenderer
                  token={selected.qr_token}
                  codigoLink={selected.universal_code}
                  nombrePersona={selected.display_name || undefined}
                  size={190}
                />
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
                <h3 className="font-bold mb-4">Entradas que formaron esta persona</h3>
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
