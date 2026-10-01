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
  entity_type: 'person' | 'prospect' | 'business' | 'product';
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

export interface LinkPersonLeadNode {
  lead_id: string;
  business_id: string | null;
  business_name: string | null;
  business_global_id: string | null;
  stage: string | null;
  source: string | null;
  source_page: string | null;
  interested_product: string | null;
  created_at: string | null;
}

export interface LinkPersonGraph {
  person_id: string;
  universal_code: string;
  qr_token: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  status: 'provisional' | 'verified' | 'merged' | 'inactive';
  primary_business_id: string | null;
  primary_business_name?: string | null;
  person_created_at: string;
  lead_count: number;
  interaction_count: number;
  last_interaction_at: string | null;
  leads: LinkPersonLeadNode[];
  country?: string | null;
  city?: string | null;
  preferred_language?: string | null;
  preferred_channel?: string | null;
  relationship_type?: string | null;
  interests?: string[];
  notes?: string | null;
  next_action?: string | null;
  next_action_at?: string | null;
  field_sources?: Record<string, { source?: string; updated_at?: string }>;
  profile_updated_at?: string | null;
  detected_channels?: string[];
  completeness_percent?: number;
  profile_stage?: 'inicial' | 'identificada' | 'enriquecida' | 'conocida';
}

export interface LinkInteraction {
  id: string;
  person_id: string;
  business_id: string | null;
  product_id: string | null;
  lead_id: string | null;
  action_type: string;
  channel: string | null;
  source: string;
  margin_estimated: number | null;
  currency: string;
  confidence: 'observed' | 'inferred' | 'estimated';
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export async function getPersonGraph(): Promise<LinkPersonGraph[]> {
  const { data, error } = await client()
    .from('link_person_profile_v')
    .select('*')
    .neq('status', 'merged')
    .order('last_interaction_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []) as LinkPersonGraph[];
}

export async function updatePersonProfile(input: {
  person_id: string;
  display_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  preferred_language: string;
  preferred_channel: string;
  relationship_type: string;
  interests: string[];
  notes: string;
  next_action: string;
  next_action_at: string | null;
}): Promise<void> {
  const { error } = await client().rpc('link_update_person_profile_v1', {
    p_person_id: input.person_id,
    p_display_name: input.display_name,
    p_email: input.email,
    p_phone: input.phone,
    p_country: input.country,
    p_city: input.city,
    p_preferred_language: input.preferred_language,
    p_preferred_channel: input.preferred_channel,
    p_relationship_type: input.relationship_type,
    p_interests: input.interests,
    p_notes: input.notes,
    p_next_action: input.next_action,
    p_next_action_at: input.next_action_at,
  });
  if (error) throw error;
}

export async function getInteractions(limit = 500): Promise<LinkInteraction[]> {
  const { data, error } = await client()
    .from('link_interactions')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as LinkInteraction[];
}

export async function createInteraction(input: {
  person_id: string;
  business_id?: string | null;
  product_id?: string | null;
  action_type: string;
  channel?: string | null;
  source?: string;
  margin_estimated?: number | null;
  currency?: string;
  confidence?: LinkInteraction['confidence'];
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await client().rpc('link_ingest_interaction_v1', {
    p_person_id: input.person_id,
    p_business_id: input.business_id ?? null,
    p_product_id: input.product_id ?? null,
    p_action_type: input.action_type,
    p_channel: input.channel ?? null,
    p_source: input.source || 'link-id',
    p_margin_estimated: input.margin_estimated ?? null,
    p_currency: input.currency || 'CLP',
    p_confidence: input.confidence || 'observed',
    p_metadata: input.metadata || {},
    p_occurred_at: new Date().toISOString(),
  });
  if (error) throw error;
  return String(data);
}

export interface LinkPersonStudy {
  person_id: string;
  universal_code: string;
  display_name: string | null;
  status: string;
  primary_business_id: string | null;
  interaction_count: number;
  businesses_touched: number;
  products_touched: number;
  estimated_margin_total: number;
  last_interaction_at: string | null;
  interaction_sources: string[];
  channels: string[];
  signals: Record<string, Array<{
    value: string;
    confidence: string;
    source: string;
    observed_at: string;
  }>>;
  max_conversion_level: number | null;
  max_priority_score: number | null;
  conversion_assessments: Array<{
    lead_id: string;
    level: number | null;
    label: string | null;
    priority: number | null;
    reason: string | null;
    recommended_action: string | null;
    active: boolean | null;
    assessed_at: string | null;
  }>;
}

export async function getPersonStudies(): Promise<LinkPersonStudy[]> {
  const { data, error } = await client()
    .from('link_person_study_v')
    .select('*')
    .order('last_interaction_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []) as LinkPersonStudy[];
}

