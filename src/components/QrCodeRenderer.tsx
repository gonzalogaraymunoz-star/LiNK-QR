import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Shield } from 'lucide-react';

interface QrCodeRendererProps {
  token: string;
  codigoLink: string;
  nombrePersona?: string;
  size?: number;
  showControls?: boolean;
  className?: string;
}

export const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({
  token,
  codigoLink,
  nombrePersona,
  size = 220,
  showControls = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !token) return;

    QRCode.toCanvas(
      canvasRef.current,
      token,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#11120f',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) {
          console.error('Error generating QR code canvas:', err);
          setError('Error al generar gráfico QR');
        } else {
          setError(null);
        }
      }
    );
  }, [token, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `LINK-QR-${codigoLink}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Visual QR Container following LINK Aesthetic */}
      <div className="bg-[#ffffff] p-4 rounded-xl border-2 border-[#11120f] shadow-sm flex flex-col items-center relative">
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-[10px] font-mono font-semibold tracking-wider text-[#11120f]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d8ff58]"></span>
            LINK ID
          </span>
          <span className="bg-[#11120f] text-[#d8ff58] px-1.5 py-0.5 rounded text-[10px]">
            {codigoLink}
          </span>
        </div>

        {error ? (
          <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-red-600 bg-red-50 rounded">
            {error}
          </div>
        ) : (
          <canvas ref={canvasRef} className="rounded-lg max-w-full" />
        )}

        <div className="w-full pt-2 mt-2 border-t border-gray-100 text-center">
          {nombrePersona && (
            <div className="text-xs font-semibold text-[#11120f] truncate max-w-[200px]">
              {nombrePersona}
            </div>
          )}
          <div className="text-[10px] font-mono text-[#66685f] truncate max-w-[200px]">
            {token}
          </div>
        </div>
      </div>

      {showControls && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#11120f] text-[#fffdf7] hover:bg-[#23251f] rounded-lg text-xs font-medium cursor-pointer transition-colors"
            title="Descargar QR en formato PNG de alta resolución"
          >
            <Download className="w-3.5 h-3.5 text-[#d8ff58]" />
            <span>Descargar PNG</span>
          </button>
          <button
            type="button"
            onClick={handleCopyToken}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fffdf7] text-[#11120f] border border-[#e9e2d3] hover:bg-[#e9e2d3]/50 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            title="Copiar token opaco al portapapeles"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-700">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#66685f]" />
                <span>Copiar Token</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 text-[10px] text-[#66685f]">
        <Shield className="w-3 h-3 text-emerald-600" />
        <span>Referencia pública opaca (sin datos personales en el código)</span>
      </div>
    </div>
  );
};
