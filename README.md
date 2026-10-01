# LINK ID

Dashboard interno de **LINK World** para mapear leads con una identidad universal, QR permanente y trazabilidad transversal entre negocios.

## Qué hace

- Lee los leads centrales desde Supabase.
- Mantiene los códigos y etiquetas propios de cada negocio.
- Agrega un código universal `LNK-LD-...`.
- Genera y escanea QR opacos sin exponer datos personales.
- Registra eventos de generación y escaneo.
- Gestiona beneficios y consumos de LINK Cupones.
- Separa explícitamente **escaneo** de **consumo/venta**.

## Fuente de verdad

Proyecto Supabase: `zgbnjlrxzvzpigmwidsp`

Tablas principales:

- `sales_leads`
- `link_lead_identities`
- `link_qr_events`
- `link_coupon_offers`
- `link_coupon_redemptions`
- `link_world_businesses`

Vista de lectura:

- `link_lead_identity_v`

El acceso está protegido con Supabase Auth + RLS y la membresía de LINK World.

## Desarrollo

```bash
bun install
bun run dev
```

Validación:

```bash
bun run build
```

## Vercel

El repositorio incluye `vercel.json` para Vite. El frontend usa únicamente la URL y la **publishable key** de Supabase; no hay `service_role` ni secretos privados en el cliente.
