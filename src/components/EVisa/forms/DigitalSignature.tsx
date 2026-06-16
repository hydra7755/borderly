import React, { useRef, useEffect, useCallback } from 'react';

interface DigitalSignatureProps {
  signatureType: 'canvas' | 'text';
  signatureData: string;
  typedSignatureName: string;
  onSignatureTypeChange: (type: 'canvas' | 'text') => void;
  onSignatureDataChange: (data: string) => void;
  onTypedNameChange: (name: string) => void;
  error?: string;
}

export function DigitalSignature({
  signatureType,
  signatureData,
  typedSignatureName,
  onSignatureTypeChange,
  onSignatureDataChange,
  onTypedNameChange,
  error,
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const getCtx = useCallback(() => canvasRef.current?.getContext('2d'), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const point = getPoint(e, canvas);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const point = getPoint(e, canvas);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onSignatureDataChange(canvas.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureDataChange('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSignatureTypeChange('text')}
          className={`px-4 py-2 text-sm rounded-lg border ${
            signatureType === 'text'
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-600'
          }`}
        >
          Type Name
        </button>
        <button
          type="button"
          onClick={() => onSignatureTypeChange('canvas')}
          className={`px-4 py-2 text-sm rounded-lg border ${
            signatureType === 'canvas'
              ? 'border-primary-600 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-600'
          }`}
        >
          Draw Signature
        </button>
      </div>

      {signatureType === 'text' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full legal name (as signature) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={typedSignatureName}
            onChange={(e) => onTypedNameChange(e.target.value)}
            placeholder="Type your full name exactly as on passport"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Sign below <span className="text-red-500">*</span>
            </label>
            <button type="button" onClick={clearCanvas} className="text-xs text-primary-600 hover:underline">
              Clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={480}
            height={120}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-white touch-none cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {signatureData && (
            <p className="text-xs text-green-600 mt-1">Signature captured</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function getPoint(
  e: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ('touches' in e) {
    const touch = e.touches[0] ?? e.changedTouches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}
