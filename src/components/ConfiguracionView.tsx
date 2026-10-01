import React, { useState, useEffect } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabaseClient.ts';
import {
  generateSupabaseDDL,
  resetDemoData,
  CURRENT_OPERATOR,
} from '../services/identityService.ts';
import {
  Settings,
  Database,
  Shield,
  Copy,
  Check,
  RefreshCw,
  Server,
  Layers,
  ExternalLink,
  Code2,
  Lock,
} from 'lucide-react';

interface ConfiguracionViewProps {
  onRefreshAll: () => void;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  onRefreshAll,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedDDL, setCopiedDDL] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  useEffect(() => {
    const { url, key } = getSupabaseConfig();
    setSupabaseUrl(url);
    setSupabaseKey(key);
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setCopiedNotice('Configuración guardada.');
    setTimeout(() => setCopiedNotice(null), 2000);
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await testSupabaseConnection();
      setConnectionResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConnectionResult({ success: false, message: msg });
    } finally {
      setTestingConnection(false);
    }
  };

  const ddlSql = generateSupabaseDDL();

  const handleCopyDDL = async () => {
    try {
      await navigator.clipboard.writeText(ddlSql);
      setCopiedDDL(true);
      setTimeout(() => setCopiedDDL(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        '¿Restablecer los datos locales a los valores iniciales de control de calidad?'
      )
    ) {
      resetDemoData();
      onRefreshAll();
      setCopiedNotice('Datos locales reiniciados con éxito.');
      setTimeout(() => setCopiedNotice(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#11120f] text-[#d8ff58] font-mono text-[10px] uppercase font-bold tracking-wider mb-2">
          <Settings className="w-3 h-3" />
          INFRAESTRUCTURA & SEGURIDAD // PRODUCCIÓN
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#11120f]">
          Configuración y Conexión Supabase
        </h2>
        <p className="text-xs text-[#66685f]">
          Parámetros de conexión a la base de datos compartida, esquema DDL y políticas de acceso para GitHub + Vercel + Supabase.
        </p>
      </div>

      {copiedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          {copiedNotice}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Supabase Connection Configuration */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#fffdf7] p-5 rounded-xl border border-[#e9e2d3] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9e2d3]">
              <h3 className="text-xs font-mono font-bold uppercase text-[#11120f] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#11120f]" />
                Credenciales Supabase (Base de Datos Central)
              </h3>
              <span className="text-[10px] font-mono bg-[#f4f0e6] px-2 py-0.5 rounded font-bold">
                POSTGRESQL + RLS
              </span>
            </div>

            <p className="text-xs text-[#66685f] leading-relaxed">
              Configura tu proyecto Supabase para sincronizar automáticamente el Centro de Control y dejar preparada la base compartida para la futura aplicación LINK Beneficios.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#11120f] mb-1">
                  SUPABASE URL (VITE_SUPABASE_URL):
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzprojectid.supabase.co"
                  className="w-full px-3 py-2 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg font-mono focus:outline-hidden focus:border-[#11120f]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11120f] mb-1">
                  SUPABASE ANON KEY (VITE_SUPABASE_ANON_KEY):
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full px-3 py-2 text-xs bg-[#f4f0e6]/50 border border-[#e9e2d3] rounded-lg font-mono focus:outline-hidden focus:border-[#11120f]"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#11120f] text-[#d8ff58] hover:bg-[#252820] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Guardar Parámetros
                </button>
                <button
                  type="button"
                  disabled={testingConnection}
                  onClick={handleTestConnection}
                  className="px-3 py-2 bg-[#f4f0e6] hover:bg-[#e9e2d3] text-[#11120f] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>Probar Conexión</span>
                </button>
              </div>
            </form>

            {connectionResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium ${
                  connectionResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="font-bold mb-0.5">
                  {connectionResult.success ? 'Conexión Exitosa' : 'Estado de Conexión'}
                </div>
                <div>{connectionResult.message}</div>
              </div>
            )}
          </div>

          {/* Active Operator Status */}
          <div className="bg-[#fffdf7] p-5 rounded-xl border border-[#e9e2d3] shadow-xs space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-[#11120f] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#11120f]" />
              Sesión de Operador Autorizado
            </h3>
            <div className="bg-[#f4f0e6]/60 p-3 rounded-lg border border-[#e9e2d3] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#66685f]">Operador activo:</span>
                <span className="font-bold text-[#11120f]">{CURRENT_OPERATOR.nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#66685f]">Rol:</span>
                <span className="font-mono text-[#11120f] bg-[#11120f] text-[#d8ff58] px-1.5 py-0.2 rounded text-[10px]">
                  {CURRENT_OPERATOR.rol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#66685f]">Identificador:</span>
                <span className="font-mono text-[#66685f]">{CURRENT_OPERATOR.id}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-[#66685f]">Restablecer datos locales de prueba:</span>
              <button
                type="button"
                onClick={handleResetData}
                className="px-3 py-1.5 bg-[#e9e2d3] hover:bg-[#ddd4c2] text-[#11120f] rounded-lg text-xs font-medium cursor-pointer"
              >
                Reiniciar Dataset
              </button>
            </div>
          </div>
        </div>

        {/* Right: DDL Schema Exporter for Supabase */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#fffdf7] p-5 rounded-xl border border-[#e9e2d3] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9e2d3]">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-[#11120f] flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#11120f]" />
                  Esquema SQL DDL para Supabase
                </h3>
                <p className="text-[11px] text-[#66685f] mt-0.5">
                  Ejecutar en el SQL Editor de Supabase para inicializar las tablas con RLS
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyDDL}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#11120f] text-[#d8ff58] rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#252820] transition-colors"
              >
                {copiedDDL ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#11120f] rounded-xl p-4 text-[#d8ff58] font-mono text-[11px] max-h-96 overflow-y-auto border border-[#252820]">
              <pre className="whitespace-pre-wrap">{ddlSql}</pre>
            </div>

            <div className="space-y-2 text-xs text-[#66685f]">
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-[#11120f] mt-0.5 shrink-0" />
                <span>
                  <strong>Políticas Row-Level Security:</strong> Restringe el acceso administrativo a operadores autorizados e impide la lectura no autenticada de datos personales.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
