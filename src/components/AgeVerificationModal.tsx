import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { ShieldAlert } from "lucide-react";

interface AgeVerificationModalProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function AgeVerificationModal({ open, onConfirm, onClose }: AgeVerificationModalProps) {
  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DrawerContent className="max-w-md mx-auto w-full rounded-t-[32px] p-0 bg-[#F4F6F9] dark:bg-zinc-950 border-none max-h-[60vh]">
        <DrawerTitle className="sr-only">Подтверждение возраста</DrawerTitle>
        <div className="px-6 pt-6 pb-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Товар 21+</h2>
            <p className="text-sm text-muted-foreground">
              Данный товар содержит алкоголь или табак.<br />Вам есть 21 год?
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              onClick={onConfirm}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Да, мне есть 21 год
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm"
            >
              Нет
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
