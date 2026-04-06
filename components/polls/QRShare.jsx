import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function QRShare({ url, title }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const downloadQR = () => {
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `${title || 'qrcode'}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input value={url} readOnly className="rounded-xl text-sm" />
        <Button variant="outline" size="icon" onClick={copyLink} className="flex-shrink-0 rounded-xl">
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-col items-center gap-3 p-4 bg-muted/50 rounded-xl">
        <img src={qrUrl} alt="QR Code" className="w-40 h-40 rounded-lg" />
        <Button variant="outline" size="sm" onClick={downloadQR} className="gap-2 rounded-lg">
          <Download className="w-3.5 h-3.5" /> Download QR
        </Button>
      </div>
    </div>
  );
}