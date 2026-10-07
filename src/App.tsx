import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import jsQR from 'jsqr';
import {
  Activity,
  BadgePercent,
  Building2,
  Camera,
  CameraOff,
  CheckCircle2,
  CircleUserRound,
  LogOut,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Tag,
  TicketCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { QrCodeRenderer } from './components/QrCodeRenderer.tsx';
import { QrStudioView } from './components/QrStudioView.tsx';
import { PersonsView } from './components/PersonsView.tsx';
import { LeadDashboard } from './components/LeadDashboard.tsx';
import { MerchantRadar } from './components/MerchantRadar.tsx';
import { CouponOfferProfilePanel } from './components/CouponOfferProfilePanel.tsx';
import {
  getCurrentSession,
  getSupabaseClient,
  sendMagicLink,
  signInWithPassword,
  signOut,
} from './services/supabaseClient.ts';
import {
  createCouponOffer,
  createLeadInteraction,
  getBusinesses,
  getCouponOffers,
  getCouponRedemptions,
  getCouponProfiles,
  getLeadIdentities,
  getLeadWorkboard,
  getInteractions,
  getPersonGraph,
  getPersonStudies,
  getProducts,
  getQrEvents,
  getQrRegistry,
  redeemCoupon,
  resolveQrRegistryEntry,
  trackQrEvent,
  trackRegistryQrEvent,
  LinkBusiness,
  LinkCouponOffer,
  LinkCouponRedemption,
  LinkInteraction,
  LinkLeadIdentity,
  LinkLeadWorkboard,
  LinkCouponOfferProfile,
  LinkPersonGraph,
  LinkPersonStudy,
  LinkProduct,
  LinkQrEvent,
  LinkQrRegistryEntry,
} from './services/linkWorldService.ts';

type Section = 'comercios' | 'resumen' | 'personas' | 'leads' | 'generador' | 'escaner' | 'actividad' | 'cupones';

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';

const money = (value: number | null | undefined, currency = 'CLP') =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(Number(value || 0));

const errorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    return String((err as { message?: unknown }).message || 'Error desconocido');
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

const humanStage = (stage?: string | null) => {
  const labels: Record<string, string> = {
    new: 'Nuevo',
    contacted: 'Contactado',
    qualified: 'Calificado',
    proposal: 'Propuesta enviada',
    won: 'Cliente confirmado',
    lost: 'No convertido',
    paused: 'En pausa',
  };
  if (!stage) return 'Sin etapa';
  return labels[stage.toLowerCase()] || stage.replaceAll('_', ' ');
};

const humanSource = (source?: string | null) => {
  const labels: Record<string, string> = {
    'hotel-experience': 'Hotel Experience',
    'linkrrss-zernio': 'LINKRRSS',
    'link-id': 'LINK ID',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
  };
  if (!source) return 'Sin origen';
  return labels[source.toLowerCase()] || source.replaceAll('-', ' ');
};

const humanClassification = (value: string) => {
  const labels: Record<string, string> = {
    imported_operational_lead: 'Importado desde operación',
    operational_lead: 'Contacto de operación',
    commercial_lead: 'Interés comercial',
    traveler_transaction_candidate: 'Señal de reserva o pago',
    commercial_lead_candidate: 'Posible oportunidad comercial',
  };
  return labels[value.toLowerCase()] || value.replaceAll('_', ' ');
};

const explanatoryTags = (lead: LinkLeadIdentity) => {
  const tags = lead.tags || {};
  const result: Array<{ label: string; technical: string }> = [];

  const add = (label: string, technical: string) => {
    if (!label || result.some((item) => item.label === label)) return;
    result.push({ label, technical });
  };

  const sourcePage = tags.source_page;
  if (sourcePage) add(`Llegó por ${String(sourcePage)}`, `source_page: ${String(sourcePage)}`);

  const sourceCta = tags.source_cta;
  if (sourceCta) add(`Respondió a “${String(sourceCta)}”`, `source_cta: ${String(sourceCta)}`);

  const classification = tags.classification;
  if (classification) {
    add(humanClassification(String(classification)), `classification: ${String(classification)}`);
  }

  const intent = tags.intent_type;
  if (intent) add(`Intención: ${String(intent).replaceAll('_', ' ')}`, `intent_type: ${String(intent)}`);

  const product = tags.interested_product;
  if (product) add(`Interés: ${String(product)}`, `interested_product: ${String(product)}`);

  const pack = tags.interested_pack;
  if (pack) add(`Interés: ${String(pack)}`, `interested_pack: ${String(pack)}`);

  const confidence = tags.classification_confidence;
  if (confidence) {
    const value = String(confidence).toLowerCase();
    const label = value === 'high' ? 'Clasificación segura' : value === 'medium' ? 'Clasificación probable' : 'Clasificación por revisar';
    add(label, `classification_confidence: ${String(confidence)}`);
  }

  return result.slice(0, 4);
};

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    if (!email || !password) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await signInWithPassword(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const magic = async () => {
    if (!email) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await sendMagicLink(email.trim());
      setMessage('Enlace enviado. Revisa tu correo de acceso a LINK World.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f0e6] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-[#fffdf7] border border-[#e9e2d3] rounded-3xl p-7 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#66685f]">
              LINK WORLD · IDENTIDAD
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">LINK ID</h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#11120f] text-[#d8ff58] flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        <p className="text-sm text-[#66685f] mb-5">
          Entra con tu acceso interno. Aquí viven los códigos y QR de los leads de todo el ecosistema LINK.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo"
            className="w-full px-4 py-3 rounded-xl border border-[#e9e2d3] bg-white text-sm outline-none focus:border-[#11120f]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="contraseña"
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="w-full px-4 py-3 rounded-xl border border-[#e9e2d3] bg-white text-sm outline-none focus:border-[#11120f]"
          />
          <button
            onClick={login}
            disabled={busy || !email || !password}
            className="w-full py-3 rounded-xl bg-[#11120f] text-[#d8ff58] text-sm font-semibold disabled:opacity-40"
          >
            Entrar a LINK ID
          </button>
          <button
            onClick={magic}
            disabled={busy || !email}
            className="w-full py-2.5 rounded-xl border border-[#e9e2d3] text-xs font-semibold disabled:opacity-40"
          >
            Enviarme enlace mágico
          </button>
        </div>

        {message && <div className="mt-4 p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800">{message}</div>}
        {error && <div className="mt-4 p-3 text-xs rounded-xl bg-red-50 text-red-800">{error}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [section, setSection] = useState<Section>('resumen');

  const [businesses, setBusinesses] = useState<LinkBusiness[]>([]);
  const [identities, setIdentities] = useState<LinkLeadIdentity[]>([]);
  const [leadWorkboard, setLeadWorkboard] = useState<LinkLeadWorkboard[]>([]);
  const [persons, setPersons] = useState<LinkPersonGraph[]>([]);
  const [personStudies, setPersonStudies] = useState<LinkPersonStudy[]>([]);
  const [interactions, setInteractions] = useState<LinkInteraction[]>([]);
  const [events, setEvents] = useState<LinkQrEvent[]>([]);
  const [products, setProducts] = useState<LinkProduct[]>([]);
  const [qrRegistry, setQrRegistry] = useState<LinkQrRegistryEntry[]>([]);
  const [offers, setOffers] = useState<LinkCouponOffer[]>([]);
  const [redemptions, setRedemptions] = useState<LinkCouponRedemption[]>([]);
  const [couponProfiles, setCouponProfiles] = useState<LinkCouponOfferProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(null);

  const [manualScan, setManualScan] = useState('');
  const [resolvedIdentity, setResolvedIdentity] = useState<LinkLeadIdentity | null>(null);
  const [resolvedQrEntry, setResolvedQrEntry] = useState<LinkQrRegistryEntry | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [offerBusinessId, setOfferBusinessId] = useState('');
  const [offerName, setOfferName] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerType, setOfferType] = useState<LinkCouponOffer['benefit_type']>('price');
  const [offerValue, setOfferValue] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [couponLeadId, setCouponLeadId] = useState('');
  const [redemptionAmount, setRedemptionAmount] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const scanLockRef = useRef(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    getCurrentSession().then((current) => {
      setSession(current);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, current) => {
      setSession(current);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAll = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [
        businessData,
        identityData,
        leadWorkboardData,
        personData,
        personStudyData,
        interactionData,
        productData,
        registryData,
        eventData,
        offerData,
        redemptionData,
        couponProfileData,
      ] = await Promise.all([
        getBusinesses(),
        getLeadIdentities(),
        getLeadWorkboard(),
        getPersonGraph(),
        getPersonStudies(),
        getInteractions(),
        getProducts(),
        getQrRegistry(),
        getQrEvents(),
        getCouponOffers(),
        getCouponRedemptions(),
        getCouponProfiles(),
      ]);
      setBusinesses(businessData);
      setIdentities(identityData);
      setLeadWorkboard(leadWorkboardData);
      setPersons(personData);
      setPersonStudies(personStudyData);
      setInteractions(interactionData);
      setProducts(productData);
      setQrRegistry(registryData);
      setEvents(eventData);
      setOffers(offerData);
      setRedemptions(redemptionData);
      setCouponProfiles(couponProfileData);

      if (identityData.length) {
        setSelectedIdentityId((current) => current || identityData[0].identity_id);
        setCouponLeadId((current) => current || identityData[0].identity_id);
      }
      if (businessData.length) {
        setOfferBusinessId((current) => {
          if (current) return current;
          const couponBusiness = businessData.find((b) => b.slug === 'link-cupones');
          return couponBusiness?.id || businessData[0].id;
        });
      }
      if (offerData.length) {
        setSelectedOfferId((current) => current || offerData[0].id);
      }
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredIdentities = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return identities.filter((item) => {
      if (businessFilter !== 'all' && (item.business_id || 'none') !== businessFilter) return false;
      if (!needle) return true;
      return [
        item.universal_code,
        item.identity_label,
        item.person_display_name,
        item.internal_reference,
        item.full_name,
        item.email,
        item.phone,
        item.company,
        item.business_name,
        item.external_ref,
        item.stage,
        ...Object.values(item.tags || {}).map((v) => String(v ?? '')),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [identities, query, businessFilter]);

  const selectedIdentity =
    identities.find((item) => item.identity_id === selectedIdentityId) || identities[0] || null;
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) || offers[0] || null;
  const selectedOfferProfile = selectedOffer
    ? couponProfiles.find((profile) => profile.offer_id === selectedOffer.id) || null
    : null;
  const couponIdentity =
    identities.find((item) => item.identity_id === couponLeadId) || identities[0] || null;

  useEffect(() => {
    if (selectedOffer?.sale_price != null) setRedemptionAmount(String(selectedOffer.sale_price));
  }, [selectedOfferId, selectedOffer?.sale_price]);

  const businessLeadCounts = useMemo(() => {
    const map = new Map<string, number>();
    identities.forEach((lead) => {
      const key = lead.business_id || 'none';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [identities]);

  const totalLinkDue = redemptions
    .filter((item) => item.status === 'confirmed')
    .reduce((sum, item) => sum + Number(item.total_link_due || 0), 0);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const stopCamera = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    scanLockRef.current = false;
  }, []);

  const processScan = useCallback(
    async (value: string) => {
      if (!value.trim() || scanLockRef.current) return;
      scanLockRef.current = true;
      setScanError(null);

      const foundEntry = resolveQrRegistryEntry(qrRegistry, value);
      if (!foundEntry) {
        setResolvedIdentity(null);
        setResolvedQrEntry(null);
        setScanError('No encontré una identidad LINK asociada a este código.');
        scanLockRef.current = false;
        return;
      }

      setResolvedQrEntry(foundEntry);
      const foundLead =
        foundEntry.entity_type === 'prospect'
          ? identities.find((item) => item.identity_id === foundEntry.entity_id) || null
          : null;

      setResolvedIdentity(foundLead);
      if (foundLead) setSelectedIdentityId(foundLead.identity_id);

      try {
        await trackRegistryQrEvent(
          foundEntry,
          'QR_SCANNED',
          'Lectura desde escáner universal LINK ID',
          {
            entity_type: foundEntry.entity_type,
            scanned_value_type: value.toLowerCase().startsWith('lnk_qr_') ? 'token' : 'code',
          }
        );

        if (foundLead) {
          await trackQrEvent(foundLead, 'QR_SCANNED', 'Lectura desde LINK ID', {
            scanned_value_type: value.toLowerCase().startsWith('lnk_qr_') ? 'token' : 'code',
          });
          await createLeadInteraction({
            lead_id: foundLead.lead_id,
            action_type: 'qr_scanned',
            channel: 'qr',
            source: 'link-id-scanner',
            confidence: 'observed',
            metadata: {
              registry_id: foundEntry.id,
              entity_type: foundEntry.entity_type,
              scanned_value_type: value.toLowerCase().startsWith('lnk_qr_') ? 'token' : 'code',
            },
          });
        }

        await loadAll();
        flash('Escaneo registrado');
      } catch (err) {
        setScanError(err instanceof Error ? err.message : String(err));
      } finally {
        scanLockRef.current = false;
      }
    },
    [identities, qrRegistry, loadAll]
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code?.data) {
          setManualScan(code.data);
          stopCamera();
          void processScan(code.data);
          return;
        }
      }
    }

    frameRef.current = requestAnimationFrame(scanFrame);
  }, [processScan, stopCamera]);

  const startCamera = async () => {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      await videoRef.current.play();
      setCameraActive(true);
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'No pude abrir la cámara.');
      stopCamera();
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const registerGeneration = async () => {
    if (!selectedIdentity) return;
    try {
      await trackQrEvent(selectedIdentity, 'QR_RENDERED', 'QR generado/visualizado en LINK ID', {
        business_slug: selectedIdentity.business_slug,
      });
      await loadAll();
      flash('Generación registrada');
    } catch (err) {
      flash(err instanceof Error ? err.message : String(err));
    }
  };

  const createOffer = async () => {
    if (!offerBusinessId || !offerName.trim()) return;
    try {
      const created = await createCouponOffer({
        business_id: offerBusinessId,
        name: offerName.trim(),
        description: offerDescription.trim() || undefined,
        benefit_type: offerType,
        benefit_value: offerValue ? Number(offerValue) : null,
        sale_price: offerPrice ? Number(offerPrice) : null,
        currency: 'CLP',
      });
      setOfferName('');
      setOfferDescription('');
      setOfferValue('');
      setOfferPrice('');
      setSelectedOfferId(created.id);
      await loadAll();
      flash('Cupón creado');
    } catch (err) {
      flash(err instanceof Error ? err.message : String(err));
    }
  };

  const consumeOffer = async () => {
    if (!selectedOffer || !couponIdentity) return;
    const amount = Number(redemptionAmount || selectedOffer.sale_price || 0);
    try {
      await redeemCoupon({
        offer: selectedOffer,
        identity: couponIdentity,
        sale_amount: amount,
      });
      await loadAll();
      flash('Consumo registrado');
    } catch (err) {
      flash(err instanceof Error ? err.message : String(err));
    }
  };

  if (!authReady) {
    return <div className="min-h-screen bg-[#f4f0e6] flex items-center justify-center text-sm">Cargando LINK ID…</div>;
  }

  if (!session) return <LoginScreen />;

  const nav: Array<{ id: Section; label: string; icon: React.ReactNode }> = [
    { id: 'comercios', label: 'Comercios', icon: <Building2 className="w-4 h-4" /> },
    { id: 'resumen', label: 'Resumen', icon: <Activity className="w-4 h-4" /> },
    { id: 'personas', label: 'Personas', icon: <CircleUserRound className="w-4 h-4" /> },
    { id: 'leads', label: 'Entradas', icon: <Users className="w-4 h-4" /> },
    { id: 'generador', label: 'QR Studio', icon: <QrCode className="w-4 h-4" /> },
    { id: 'escaner', label: 'Escáner', icon: <ScanLine className="w-4 h-4" /> },
    { id: 'actividad', label: 'Actividad', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'cupones', label: 'Cupones', icon: <BadgePercent className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f4f0e6] text-[#11120f]">
      <header className="sticky top-0 z-30 bg-[#fffdf7]/95 backdrop-blur border-b border-[#e9e2d3]">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#11120f] text-[#d8ff58] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold tracking-tight">LINK ID</h1>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#d8ff58]">WORLD CORE</span>
                </div>
                <p className="text-[11px] text-[#66685f]">Personas · rutas · QR · negocios · productos</p>
              </div>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0">
              {nav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    section === item.id ? 'bg-[#11120f] text-[#d8ff58]' : 'hover:bg-[#e9e2d3]/60'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAll}
                className="p-2 rounded-lg border border-[#e9e2d3] bg-white"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg border border-[#e9e2d3] bg-white"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto p-4 sm:p-6">
        {loadError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
            {loadError}
          </div>
        )}
        {toast && (
          <div className="fixed right-5 bottom-5 z-50 px-4 py-3 rounded-xl bg-[#11120f] text-[#d8ff58] text-xs shadow-lg">
            {toast}
          </div>
        )}

        {section === 'comercios' && <MerchantRadar />}

        {section === 'resumen' && (
          <div className="space-y-6">
            <div>
              <div className="font-mono text-[10px] tracking-[0.18em] text-[#66685f] uppercase">Mapa transversal</div>
              <h2 className="text-2xl font-bold tracking-tight mt-1">Cada persona, un universo LINK</h2>
              <p className="text-sm text-[#66685f] mt-1">
                Las entradas se agrupan bajo una Persona LINK y su ruta se dibuja con cada interacción real.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Personas LINK', value: persons.length, Icon: CircleUserRound },
                { label: 'Entradas / leads', value: identities.length, Icon: Users },
                { label: 'Interacciones', value: interactions.length, Icon: ScanLine },
                { label: 'Negocios / productos', value: `${businesses.length} / ${products.length}`, Icon: TicketCheck },
                { label: 'Por liquidar', value: money(totalLinkDue), Icon: WalletCards },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-4">
                  <Icon className="w-4 h-4 mb-4" />
                  <div className="text-xl font-bold">{String(value)}</div>
                  <div className="text-[11px] text-[#66685f] mt-1">{label}</div>
                </div>
              ))}
            </div>

            <LeadDashboard
              leads={leadWorkboard}
              businesses={businesses}
              onRefresh={loadAll}
              onOpenLead={(identityId) => {
                setSelectedIdentityId(identityId);
                setSection('leads');
              }}
            />

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Cobertura del ecosistema</h3>
                  <span className="text-[10px] font-mono text-[#66685f]">{businesses.length} negocios</span>
                </div>
                <div className="space-y-2">
                  {businesses.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => {
                        setBusinessFilter(business.id);
                        setSection('leads');
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[#e9e2d3] hover:border-[#11120f] text-left"
                    >
                      <div>
                        <div className="text-sm font-semibold">{business.name}</div>
                        <div className="text-[10px] font-mono text-[#66685f]">{business.slug}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{businessLeadCounts.get(business.id) || 0}</div>
                        <div className="text-[10px] text-[#66685f]">leads con LINK ID</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <h3 className="font-bold mb-4">Última actividad</h3>
                <div className="space-y-2">
                  {events.slice(0, 8).map((event) => {
                    const lead = identities.find((item) => item.identity_id === event.identity_id);
                    return (
                      <div key={event.id} className="flex items-start justify-between gap-3 py-2 border-b border-[#f1ecdf] last:border-0">
                        <div>
                          <div className="text-xs font-semibold">{event.event_type}</div>
                          <div className="text-[11px] text-[#66685f]">
                            {lead?.universal_code || event.identity_id.slice(0, 8)} · {lead?.business_name || 'Sin negocio'}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-[#66685f]">{formatDate(event.occurred_at)}</div>
                      </div>
                    );
                  })}
                  {!events.length && <div className="text-xs text-[#66685f]">Todavía no hay actividad QR.</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'personas' && (
          <PersonsView
            persons={persons}
            studies={personStudies}
            interactions={interactions}
            businesses={businesses}
            products={products}
            onRefresh={loadAll}
          />
        )}

        {section === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66685f]">Registro universal</div>
                <h2 className="text-2xl font-bold tracking-tight">Leads con identidad LINK</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#66685f]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="buscar código, nombre o etiqueta"
                    className="pl-9 pr-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs w-full sm:w-72 outline-none"
                  />
                </div>
                <select
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                >
                  <option value="all">Todos los negocios</option>
                  <option value="none">Sin negocio asignado</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>{business.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-[#f8f5ed] border-b border-[#e9e2d3] text-[10px] uppercase tracking-wider text-[#66685f]">
                    <tr>
                      <th className="p-3">Código LINK</th>
                      <th className="p-3">Lead</th>
                      <th className="p-3">Negocio</th>
                      <th className="p-3">Etapa</th>
                      <th className="p-3">Lectura LINK</th>
                      <th className="p-3">Origen</th>
                      <th className="p-3">QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIdentities.map((lead) => (
                      <tr key={lead.identity_id} className="border-b border-[#f1ecdf] last:border-0 hover:bg-white">
                        <td className="p-3">
                          <span className="font-mono text-[11px] font-bold bg-[#11120f] text-[#d8ff58] px-2 py-1 rounded">
                            {lead.universal_code}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-xs font-semibold">{lead.identity_label || lead.person_display_name || lead.full_name || lead.company || 'Identidad por resolver'}</div>
                          <div className="text-[10px] text-[#66685f]">
                            {lead.internal_reference
                              ? `Ref. ${lead.internal_reference}`
                              : lead.email || lead.phone || lead.external_ref || 'sin contacto visible'}
                          </div>
                        </td>
                        <td className="p-3 text-xs">{lead.business_name || 'Sin negocio'}</td>
                        <td className="p-3">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-[#e9e2d3] font-semibold">{humanStage(lead.stage)}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-[360px]">
                            {explanatoryTags(lead).map((item) => (
                              <span
                                key={item.technical}
                                title={item.technical}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f4f0e6] text-[9px] leading-tight"
                              >
                                <Tag className="w-2.5 h-2.5 shrink-0" />
                                {item.label}
                              </span>
                            ))}
                            {!explanatoryTags(lead).length && (
                              <span className="text-[10px] text-[#999b93]">Sin contexto adicional</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-[10px] text-[#66685f]">{humanSource(lead.source)}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedIdentityId(lead.identity_id);
                              setSection('generador');
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-[#11120f] text-[10px] font-semibold hover:bg-[#11120f] hover:text-[#d8ff58]"
                          >
                            Abrir QR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filteredIdentities.length && (
                <div className="p-8 text-center text-xs text-[#66685f]">No hay leads para este filtro.</div>
              )}
            </div>
          </div>
        )}

        {section === 'generador' && (
          <QrStudioView
            entries={qrRegistry}
            businesses={businesses}
            products={products}
            initialEntityId={selectedIdentityId}
            onRefresh={loadAll}
          />
        )}

        {section === 'escaner' && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66685f]">Lectura</div>
                  <h2 className="text-xl font-bold">Escáner LINK</h2>
                </div>
                <button
                  onClick={cameraActive ? stopCamera : startCamera}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                    cameraActive ? 'bg-red-600 text-white' : 'bg-[#11120f] text-[#d8ff58]'
                  }`}
                >
                  {cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  {cameraActive ? 'Detener' : 'Cámara'}
                </button>
              </div>

              <div className="aspect-video rounded-2xl bg-[#11120f] overflow-hidden flex items-center justify-center relative">
                <video ref={videoRef} className={cameraActive ? 'w-full h-full object-cover' : 'hidden'} />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraActive && (
                  <div className="text-center text-[#fffdf7]">
                    <ScanLine className="w-10 h-10 mx-auto text-[#d8ff58] mb-2" />
                    <div className="text-xs">Activa la cámara o pega un código LINK</div>
                    <div className="text-[10px] text-white/55 mt-2 max-w-xs mx-auto">
                      Reconoce persona, entrada, negocio o producto y registra una interacción real en LINK. Desde ahí puede continuar a seguimiento, cupón o consumo.
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={manualScan}
                  onChange={(e) => setManualScan(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && processScan(manualScan)}
                  placeholder="LNK-LD-… o lnk_qr_…"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs font-mono outline-none"
                />
                <button
                  onClick={() => processScan(manualScan)}
                  className="px-4 py-2 rounded-xl bg-[#11120f] text-[#d8ff58] text-xs font-semibold"
                >
                  Verificar
                </button>
              </div>
              {scanError && <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-800 text-xs">{scanError}</div>}
            </div>

            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
              {!resolvedQrEntry ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-[#66685f]">
                  <CircleUserRound className="w-10 h-10 mb-3" />
                  <div className="text-sm font-semibold text-[#11120f]">Esperando identidad</div>
                  <div className="text-xs mt-1">Puede reconocer un prospecto, negocio o producto LINK.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">IDENTIDAD LINK RECONOCIDA</div>
                      <div className="text-[11px] text-emerald-800 mt-1">{resolvedQrEntry.universal_code}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#66685f]">{resolvedQrEntry.entity_type}</div>
                    <h3 className="text-xl font-bold mt-1">{resolvedQrEntry.label}</h3>
                    <div className="text-xs text-[#66685f] mt-1">
                      {resolvedQrEntry.entity_type === 'business'
                        ? 'Negocio LINK'
                        : businesses.find((item) => item.id === resolvedQrEntry.business_id)?.name || 'Sin negocio asociado'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-[#f4f0e6] rounded-xl">
                      <div className="text-[9px] uppercase text-[#66685f]">Tipo</div>
                      <div className="text-xs font-semibold mt-1">{resolvedQrEntry.entity_type}</div>
                    </div>
                    <div className="p-3 bg-[#f4f0e6] rounded-xl">
                      <div className="text-[9px] uppercase text-[#66685f]">Estado</div>
                      <div className="text-xs font-semibold mt-1">{resolvedQrEntry.status}</div>
                    </div>
                  </div>

                  {resolvedIdentity && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-[#f4f0e6] rounded-xl">
                          <div className="text-[9px] uppercase text-[#66685f]">Etapa comercial</div>
                          <div className="text-xs font-semibold mt-1">{humanStage(resolvedIdentity.stage)}</div>
                        </div>
                        <div className="p-3 bg-[#f4f0e6] rounded-xl">
                          <div className="text-[9px] uppercase text-[#66685f]">Score</div>
                          <div className="text-xs font-semibold mt-1">{resolvedIdentity.score}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase text-[#66685f] font-semibold mb-2">Qué sabemos de esta entrada</div>
                        <div className="flex flex-wrap gap-1">
                          {explanatoryTags(resolvedIdentity).map((item) => (
                            <span
                              key={item.technical}
                              title={item.technical}
                              className="px-2 py-1 rounded-lg bg-[#f4f0e6] text-[10px]"
                            >
                              {item.label}
                            </span>
                          ))}
                          {!explanatoryTags(resolvedIdentity).length && (
                            <span className="text-[10px] text-[#999b93]">Sin contexto adicional.</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setCouponLeadId(resolvedIdentity.identity_id);
                          setSection('cupones');
                        }}
                        className="w-full py-3 rounded-xl bg-[#d8ff58] border border-[#11120f] text-xs font-bold"
                      >
                        Usar este prospecto en LINK Cupones
                      </button>
                    </>
                  )}

                  {!resolvedIdentity && (
                    <button
                      onClick={() => setSection('generador')}
                      className="w-full py-3 rounded-xl bg-[#11120f] text-[#d8ff58] text-xs font-bold"
                    >
                      Abrir esta identidad en QR Studio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {section === 'actividad' && (
          <div className="space-y-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66685f]">Trazabilidad</div>
              <h2 className="text-2xl font-bold">Actividad QR</h2>
            </div>
            <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-[#f8f5ed] text-left text-[10px] uppercase text-[#66685f] border-b border-[#e9e2d3]">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Evento</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Negocio</th>
                      <th className="p-3">Contexto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const lead = identities.find((item) => item.identity_id === event.identity_id);
                      return (
                        <tr key={event.id} className="border-b border-[#f1ecdf] last:border-0 text-xs">
                          <td className="p-3 font-mono text-[10px]">{formatDate(event.occurred_at)}</td>
                          <td className="p-3 font-semibold">{event.event_type}</td>
                          <td className="p-3 font-mono text-[10px]">{lead?.universal_code || '—'}</td>
                          <td className="p-3">{lead?.business_name || 'Sin negocio'}</td>
                          <td className="p-3 text-[#66685f]">{event.context || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {section === 'cupones' && (
          <div className="space-y-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66685f]">LINK Cupones</div>
              <h2 className="text-2xl font-bold">Beneficio → consumo → comisión</h2>
              <p className="text-sm text-[#66685f] mt-1">
                El QR identifica al lead. El consumo es una acción separada y recién aquí nace el movimiento comercial.
              </p>
            </div>

            <div className="grid xl:grid-cols-3 gap-4">
              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4" />
                  <h3 className="font-bold">Crear beneficio</h3>
                </div>
                <div className="space-y-2">
                  <select
                    value={offerBusinessId}
                    onChange={(e) => setOfferBusinessId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                  >
                    {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
                  </select>
                  <input
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    placeholder="Nombre del beneficio"
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                  />
                  <textarea
                    value={offerDescription}
                    onChange={(e) => setOfferDescription(e.target.value)}
                    placeholder="Descripción corta"
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs min-h-20"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={offerType}
                      onChange={(e) => setOfferType(e.target.value as LinkCouponOffer['benefit_type'])}
                      className="px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                    >
                      <option value="price">Precio especial</option>
                      <option value="percent">% descuento</option>
                      <option value="fixed">Descuento fijo</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    <input
                      type="number"
                      value={offerValue}
                      onChange={(e) => setOfferValue(e.target.value)}
                      placeholder="Valor"
                      className="px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                    />
                  </div>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Precio de venta CLP"
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                  />
                  <button
                    onClick={createOffer}
                    disabled={!offerBusinessId || !offerName.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#11120f] text-[#d8ff58] text-xs font-semibold disabled:opacity-40"
                  >
                    Crear cupón
                  </button>
                </div>
              </div>

              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <h3 className="font-bold mb-4">Registrar consumo</h3>
                <div className="space-y-2">
                  <select
                    value={selectedOfferId}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                  >
                    <option value="">Selecciona cupón</option>
                    {offers.filter((offer) => offer.status === 'active').map((offer) => (
                      <option key={offer.id} value={offer.id}>{offer.offer_code} · {offer.name}</option>
                    ))}
                  </select>
                  <select
                    value={couponLeadId}
                    onChange={(e) => setCouponLeadId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                  >
                    {identities.map((lead) => (
                      <option key={lead.identity_id} value={lead.identity_id}>
                        {lead.identity_label || lead.person_display_name || lead.email || lead.phone || 'Identidad por resolver'} · {lead.business_name || 'Sin negocio'}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={redemptionAmount}
                    onChange={(e) => setRedemptionAmount(e.target.value)}
                    placeholder="Venta total"
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e2d3] bg-white text-xs"
                  />

                  {selectedOffer && couponIdentity && (
                    <div className="p-3 rounded-xl bg-[#f4f0e6] text-[11px] space-y-1">
                      <div className="font-semibold">{selectedOffer.name}</div>
                      <div>{couponIdentity.universal_code}</div>
                      <div className="pt-1 text-[#66685f]">Comisión LINK: 25% · fee: 15% sobre la comisión.</div>
                    </div>
                  )}

                  <button
                    onClick={consumeOffer}
                    disabled={!selectedOffer || !couponIdentity}
                    className="w-full py-2.5 rounded-xl bg-[#d8ff58] border border-[#11120f] text-xs font-bold disabled:opacity-40"
                  >
                    Confirmar consumo
                  </button>
                </div>
              </div>

              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <h3 className="font-bold mb-4">Estado comercial</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#11120f] text-white">
                    <div className="text-[10px] text-[#d8ff58] uppercase">Total LINK registrado</div>
                    <div className="text-2xl font-bold mt-1">{money(totalLinkDue)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-[#f4f0e6]">
                      <div className="text-lg font-bold">{offers.length}</div>
                      <div className="text-[10px] text-[#66685f]">beneficios</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f4f0e6]">
                      <div className="text-lg font-bold">{redemptions.length}</div>
                      <div className="text-[10px] text-[#66685f]">consumos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <CouponOfferProfilePanel
              offer={selectedOffer}
              profile={selectedOfferProfile}
              products={products}
              redemptions={redemptions}
              onRefresh={loadAll}
            />

            <div className="grid xl:grid-cols-2 gap-4">
              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <h3 className="font-bold mb-3">Beneficios activos</h3>
                <div className="space-y-2">
                  {offers.map((offer) => {
                    const business = businesses.find((b) => b.id === offer.business_id);
                    return (
                      <button
                        key={offer.id}
                        onClick={() => setSelectedOfferId(offer.id)}
                        className="w-full text-left p-3 rounded-xl border border-[#e9e2d3] bg-white"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold">{offer.name}</div>
                            <div className="text-[10px] text-[#66685f]">{offer.offer_code} · {business?.name || 'Negocio'}</div>
                          </div>
                          <div className="text-xs font-bold">{offer.sale_price != null ? money(offer.sale_price, offer.currency) : offer.benefit_value ?? '—'}</div>
                        </div>
                      </button>
                    );
                  })}
                  {!offers.length && <div className="text-xs text-[#66685f]">Crea el primer beneficio.</div>}
                </div>
              </div>

              <div className="bg-[#fffdf7] border border-[#e9e2d3] rounded-2xl p-5">
                <h3 className="font-bold mb-3">Últimos consumos</h3>
                <div className="space-y-2">
                  {redemptions.slice(0, 12).map((item) => {
                    const offer = offers.find((o) => o.id === item.offer_id);
                    const lead = identities.find((i) => i.identity_id === item.identity_id);
                    return (
                      <div key={item.id} className="p-3 rounded-xl bg-white border border-[#e9e2d3] flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold">{offer?.name || 'Cupón'}</div>
                          <div className="text-[10px] text-[#66685f]">{lead?.universal_code || 'Lead'} · {formatDate(item.redeemed_at)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold">{money(item.sale_amount, item.currency)}</div>
                          <div className="text-[10px] text-[#66685f]">LINK {money(item.total_link_due, item.currency)}</div>
                        </div>
                      </div>
                    );
                  })}
                  {!redemptions.length && <div className="text-xs text-[#66685f]">Todavía no hay consumos.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-[1500px] mx-auto px-4 sm:px-6 py-5 text-[10px] text-[#66685f] flex flex-wrap gap-2 justify-between">
        <span>LINK ID · fuente de verdad: LINK CONTROL CENTRAL / Supabase</span>
        <span>Escaneo ≠ consumo · identidad ≠ venta</span>
      </footer>
    </div>
  );
}
