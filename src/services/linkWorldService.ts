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
  person_id?: string | null;
  person_universal_code?: string | null;
  person_display_name?: string | null;
  identity_label?: string | null;
  identity_basis?: 'person_name' | 'lead_name' | 'email' | 'phone' | 'unresolved' | null;
  internal_reference?: string | null;
  natural_name?: string | null;
  contact_point?: string | null;
  contact_channel?: string | null;
  quality_state?: 'usable' | 'missing_natural_name' | 'missing_contact' | 'missing_name_and_contact' | null;
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

export interface LinkLeadWorkboard {
  identity_id: string;
  lead_id: string;
  universal_code: string;
  person_id: string | null;
  person_universal_code: string | null;
  identity_label: string | null;
  identity_basis: string | null;
  internal_reference: string | null;
  natural_name?: string | null;
  contact_point?: string | null;
  contact_channel?: string | null;
  quality_state?: string | null;
  business_id: string | null;
  business_name: string | null;
  source: string | null;
  source_page: string | null;
  source_cta: string | null;
  stage: string;
  score: number;
  interested_pack: string | null;
  interested_product: string | null;
  lead_created_at: string;
  lead_updated_at: string;
  last_activity_at: string;
  interaction_count: number;
  social_interactions: number;
  days_idle: number;
  engine_priority: number | null;
  conversion_level: number | null;
  conversion_label: string | null;
  recommended_action: string | null;
  assessed_at: string | null;
  manual_priority: number | null;
  pinned: boolean;
  priority_note: string | null;
  effective_priority: number;
  relevance_state: 'hot' | 'warm' | 'cooling' | 'cold' | 'historical';
  lead_month: string;
  coupon_consumptions: number;
  link_value_generated: number;
}

export interface LinkCouponOfferProfile {
  offer_id: string;
  product_id: string | null;
  headline: string | null;
  ad_copy: string | null;
  cta: string | null;
  audience: string | null;
  creative_path: string | null;
  creative_name: string | null;
  campaign_notes: string | null;
  learnings: string | null;
  next_improvement: string | null;
  version: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
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
    .from('link_contactable_lead_identity_v')
    .select('*')
    .order('lead_created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    identity_label: item.natural_name || item.identity_label,
    identity_basis: item.natural_name ? 'lead_name' : item.identity_basis,
  })) as LinkLeadIdentity[];
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

export async function getLeadWorkboard(): Promise<LinkLeadWorkboard[]> {
  const { data, error } = await client()
    .from('link_contactable_lead_workboard_v')
    .select('*')
    .order('pinned', { ascending: false })
    .order('effective_priority', { ascending: false })
    .order('last_activity_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    identity_label: item.natural_name || item.identity_label,
  })) as LinkLeadWorkboard[];
}

export async function setLeadPriority(input: {
  lead_id: string;
  manual_priority: number | null;
  pinned: boolean;
  note?: string;
}): Promise<void> {
  const { error } = await client().rpc('link_set_lead_priority_v1', {
    p_lead_id: input.lead_id,
    p_manual_priority: input.manual_priority,
    p_pinned: input.pinned,
    p_note: input.note || '',
  });
  if (error) throw error;
}

export async function getCouponProfiles(): Promise<LinkCouponOfferProfile[]> {
  const { data, error } = await client()
    .from('link_coupon_offer_profiles')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as LinkCouponOfferProfile[];
}

export async function updateCouponProfile(input: {
  offer_id: string;
  product_id?: string | null;
  headline?: string;
  ad_copy?: string;
  cta?: string;
  audience?: string;
  creative_path?: string | null;
  creative_name?: string | null;
  campaign_notes?: string;
  learnings?: string;
  next_improvement?: string;
}): Promise<void> {
  const { error } = await client().rpc('link_update_coupon_profile_v1', {
    p_offer_id: input.offer_id,
    p_product_id: input.product_id || null,
    p_headline: input.headline || '',
    p_ad_copy: input.ad_copy || '',
    p_cta: input.cta || '',
    p_audience: input.audience || '',
    p_creative_path: input.creative_path || null,
    p_creative_name: input.creative_name || null,
    p_campaign_notes: input.campaign_notes || '',
    p_learnings: input.learnings || '',
    p_next_improvement: input.next_improvement || '',
  });
  if (error) throw error;
}

export async function uploadCouponCreative(offerId: string, file: File): Promise<{ path: string; name: string }> {
  if (file.size > 25 * 1024 * 1024) throw new Error('La pieza supera el máximo de 25 MB.');
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const path = `${offerId}/${Date.now()}-${safe}`;
  const { error } = await client().storage.from('link-coupon-creatives').upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return { path, name: file.name };
}

export async function getCouponCreativeUrl(path: string): Promise<string> {
  const { data, error } = await client().storage.from('link-coupon-creatives').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function createLeadInteraction(input: {
  lead_id: string;
  action_type: string;
  channel?: string | null;
  source?: string;
  margin_estimated?: number | null;
  currency?: string;
  confidence?: 'observed' | 'inferred' | 'estimated';
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await client().rpc('link_ingest_lead_interaction_v1', {
    p_lead_id: input.lead_id,
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

  await createLeadInteraction({
    lead_id: input.identity.lead_id,
    action_type: 'coupon_redeemed',
    channel: 'qr_coupon',
    source: 'link-cupones',
    margin_estimated: Number(data.total_link_due || 0),
    currency: input.offer.currency || 'CLP',
    confidence: 'observed',
    metadata: {
      offer_id: input.offer.id,
      offer_code: input.offer.offer_code,
      redemption_id: data.id,
      sale_amount: input.sale_amount,
      total_link_due: data.total_link_due,
    },
  });

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
    .from('link_qr_registry_usable_v')
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
  contact_point?: string | null;
  contact_channel?: string | null;
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
    .from('link_contactable_person_profile_v')
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

