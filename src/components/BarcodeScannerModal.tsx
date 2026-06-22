import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({ open, onOpenChange, onScan }: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Need to track this to prevent multiple init attempts
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setIsLoading(true);
    setError(null);

    let html5QrCode: Html5Qrcode | null = null;
    
    // Delay initialization to ensure the Dialog portal has mounted the #reader element
    const timerId = setTimeout(() => {
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        setIsLoading(false);
        isInitializingRef.current = false;
        setError("Ошибка: элемент сканера не найден.");
        return;
      }

      html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // Wider box suits EAN-13's horizontal aspect ratio
          qrbox: { width: 300, height: 120 },
          experimentalFeatures: {
            // Use native BarcodeDetector API on Chrome 83+ for much better detection
            useBarCodeDetectorIfSupported: true,
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ]
        },
        (decodedText) => {
          if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().then(() => {
              onOpenChange(false);
              onScan(decodedText);
            }).catch(() => {
              onOpenChange(false);
              onScan(decodedText);
            });
          }
        },
        (errorMessage) => {
          // parse errors are normal (no barcode found in frame)
        }
      ).then(() => {
        setIsLoading(false);
        isInitializingRef.current = false;
      }).catch((err) => {
        setIsLoading(false);
        isInitializingRef.current = false;
        setError("Не удалось получить доступ к камере. Пожалуйста, разрешите использование камеры в настройках браузера.");
        console.error(err);
      });
    }, 100);

    return () => {
      clearTimeout(timerId);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      isInitializingRef.current = false;
    };
  }, [open, onOpenChange, onScan]);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      if (!val) setManualInput("");
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 p-4 sm:p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-center font-bold tracking-tight">Отсканируйте штрихкод</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center border border-border shadow-inner">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Запуск камеры...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10 bg-background/90 backdrop-blur-sm">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}
          <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />
        </div>

        {/* Manual barcode input — always visible as fallback */}
        <div className="mt-4 flex gap-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Введите штрихкод вручную"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && manualInput.length >= 8) {
                onOpenChange(false);
                onScan(manualInput);
                setManualInput("");
              }
            }}
            maxLength={13}
            className="flex-1"
          />
          <Button
            type="button"
            disabled={manualInput.length < 8}
            onClick={() => {
              onOpenChange(false);
              onScan(manualInput);
              setManualInput("");
            }}
          >
            Найти
          </Button>
        </div>

        {!error && (
          <div className="mt-3 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Поместите штрихкод в центр экрана. Сканирование произойдет автоматически.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
