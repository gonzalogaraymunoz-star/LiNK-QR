import { getSupabaseClient } from './supabaseClient.ts';

export interface LinkBusiness {
  id: string;
  name: string;
  slug: string;
  global_id: string | null;
  verification_status: string | null;
}

export interface LinkLeadIdentity {
  identity_id: string;
  lead_id: string;
  universal_code: string;
  qr_token: string;
  qr_status: 'active' | 'paused' | 'revoked';
  identity_created_at: string;
  identity_updated_at: string;
  business_id: string | null;
  business_name: string | null;
  business_slug: string | null;
  business_global_id: string | null;
  project_id: string | null;
  project_name: string | null;
  project_slug: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  source_page: string | null;
  source_cta: string | null;
  external_ref: string | null;
  stage: string;
  score: number;
  interested_pack: string | null;
  interested_product: string | null;
  lead_created_at: string;
  lead_updated_at: string;
  tags: Record<string, string | number | boolean | null>;
}

export interface LinkQrEvent {
  id: string;
  identity_id: string;
  lead_id: string;
  business_id: string | null;
  event_type: string;
  actor_user_id: string | null;
  context: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export interface LinkCouponOffer {
  id: string;
  business_id: string;
  offer_code: string;
  name: string;
  description: string | null;
  benefit_type: 'percent' | 'fixed' | 'price' | 'custom';
  benefit_value: number | null;
  sale_price: number | null;
  currency: string;
  terms: string | null;
  status: 'draft' | 'active' | 'paused' | 'expired';
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  per_lead_limit: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LinkCouponRedemption {
  id: string;
  offer_id: string;
  identity_id: string;
  lead_id: string;
  business_id: string;
  sale_amount: number;
  currency: string;
  commission_percent: number;
  honorarios_fee_percent: number;
  link_commission: number;
  honorarios_fee: number;
  total_link_due: number;
  status: 'confirmed' | 'cancelled' | 'refunded';
  redeemed_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}

export async function getBusinesses(): Promise<LinkBusiness[]> {
  const { data, error } = await client()
    .from('link_world_businesses')
    .select('id,name,slug,global_id,verification_status')
    .order('name');
  if (error) throw error;
  return (data || []) as LinkBusiness[];
}

export async function getLeadIdentities(): Promise<LinkLeadIdentity[]> {
  const { data, error } = await client()
    .from('link_lead_identity_v')
    .select('*')
    .order('lead_created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as LinkLeadIdentity[];
}

export async function getQrEvents(limit = 250): Promise<LinkQrEvent[]> {
  const { data, error } = await client()
    .from('link_qr_events')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as LinkQrEvent[];
}

export async function trackQrEvent(
  identity: LinkLeadIdentity,
  eventType: string,
  context: string,
  metadata: Record<string, unknown> = {}
): Promise<LinkQrEvent> {
  const supabase = client();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Debes iniciar sesión para registrar actividad.');

  const { data, error } = await supabase
    .from('link_qr_events')
    .insert({
      identity_id: identity.identity_id,
      lead_id: identity.lead_id,
      business_id: identity.business_id,
      event_type: eventType,
      actor_user_id: userData.user.id,
      context,
      metadata,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as LinkQrEvent;
}

export async function getCouponOffers(): Promise<LinkCouponOffer[]> {
  const { data, error } = await client()
    .from('link_coupon_offers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as LinkCouponOffer[];
}

export async function createCouponOffer(input: {
  business_id: string;
  name: string;
  description?: string;
  benefit_type: LinkCouponOffer['benefit_type'];
  benefit_value?: number | null;
  sale_price?: number | null;
  currency?: string;
  terms?: string;
}): Promise<LinkCouponOffer> {
  const { data, error } = await client()
    .from('link_coupon_offers')
    .insert({
      business_id: input.business_id,
      name: input.name,
      description: input.description || null,
      benefit_type: input.benefit_type,
      benefit_value: input.benefit_value ?? null,
      sale_price: input.sale_price ?? null,
      currency: input.currency || 'CLP',
      terms: input.terms || null,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as LinkCouponOffer;
}

export async function getCouponRedemptions(limit = 250): Promise<LinkCouponRedemption[]> {
  const { data, error } = await client()
    .from('link_coupon_redemptions')
    .select('*')
    .order('redeemed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as LinkCouponRedemption[];
}

export async function redeemCoupon(input: {
  offer: LinkCouponOffer;
  identity: LinkLeadIdentity;
  sale_amount: number;
}): Promise<LinkCouponRedemption> {
  const { data, error } = await client()
    .from('link_coupon_redemptions')
    .insert({
      offer_id: input.offer.id,
      identity_id: input.identity.identity_id,
      lead_id: input.identity.lead_id,
      business_id: input.offer.business_id,
      sale_amount: input.sale_amount,
      currency: input.offer.currency || 'CLP',
      commission_percent: 25,
      honorarios_fee_percent: 15,
      status: 'confirmed',
      metadata: {
        source: 'link-qr',
        universal_code: input.identity.universal_code,
      },
    })
    .select('*')
    .single();

  if (error) throw error;

  await trackQrEvent(
    input.identity,
    'COUPON_REDEEMED',
    `Cupón ${input.offer.offer_code} consumido`,
    {
      offer_id: input.offer.id,
      offer_code: input.offer.offer_code,
      sale_amount: input.sale_amount,
      redemption_id: data.id,
      redemption_business_id: input.offer.business_id,
    }
  );

  return data as LinkCouponRedemption;
}

export function resolveIdentity(
  identities: LinkLeadIdentity[],
  tokenOrCode: string
): LinkLeadIdentity | null {
  const query = tokenOrCode.trim().toLowerCase();
  if (!query) return null;

  return (
    identities.find(
      (item) =>
        item.qr_token.toLowerCase() === query ||
        item.universal_code.toLowerCase() === query ||
        (item.external_ref || '').toLowerCase() === query
    ) || null
  );
}

export interface LinkProduct {
  id: string;
  business_id: string;
  name: string;
  code: string | null;
  category: string | null;
  stage: string;
  currency: string;
  public_price: number | null;
  global_id: string;
}

export interface LinkQrRegistryEntry {
  id: string;
  entity_type: 'prospect' | 'business' | 'product';
  entity_id: string;
  business_id: string | null;
  universal_code: string;
  qr_token: string;
  label: string;
  status: 'active' | 'paused' | 'revoked';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LinkQrRegistryEvent {
  id: string;
  qr_registry_id: string;
  event_type: string;
  actor_user_id: string | null;
  context: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export async function getProducts(): Promise<LinkProduct[]> {
  const { data, error } = await client()
    .from('link_world_products')
    .select('id,business_id,name,code,category,stage,currency,public_price,global_id')
    .order('name');
  if (error) throw error;
  return (data || []) as LinkProduct[];
}

export async function getQrRegistry(): Promise<LinkQrRegistryEntry[]> {
  const { data, error } = await client()
    .from('link_qr_registry')
    .select('*')
    .order('entity_type')
    .order('label');
  if (error) throw error;
  return (data || []) as LinkQrRegistryEntry[];
}

export async function trackRegistryQrEvent(
  entry: LinkQrRegistryEntry,
  eventType: string,
  context: string,
  metadata: Record<string, unknown> = {}
): Promise<LinkQrRegistryEvent> {
  const supabase = client();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Debes iniciar sesión para registrar actividad.');

  const { data, error } = await supabase
    .from('link_qr_registry_events')
    .insert({
      qr_registry_id: entry.id,
      event_type: eventType,
      actor_user_id: userData.user.id,
      context,
      metadata,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as LinkQrRegistryEvent;
}

export function resolveQrRegistryEntry(
  entries: LinkQrRegistryEntry[],
  tokenOrCode: string
): LinkQrRegistryEntry | null {
  const query = tokenOrCode.trim().toLowerCase();
  if (!query) return null;

  return (
    entries.find(
      (item) =>
        item.qr_token.toLowerCase() === query ||
        item.universal_code.toLowerCase() === query
    ) || null
  );
}

