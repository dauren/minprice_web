import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useCity } from "@/context/CityContext";
import { useCities } from "@/hooks/useApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CITY_NAME_TO_ID: Record<string, number> = {
  almaty: 1,
  алматы: 1,
  "алма-ата": 1,
  astana: 2,
  астана: 2,
  nursultan: 2,
  "нур-султан": 2,
};

function matchCity(name: string): number | null {
  const normalized = name.toLowerCase().trim();
  return CITY_NAME_TO_ID[normalized] ?? null;
}

const CityDetectionDialog = () => {
  const { cityDetected, setCityDetected, setSelectedCityId, setCityData } = useCity();
  const { data: citiesData } = useCities();
  const [detecting, setDetecting] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (cityDetected) return;

    let cancelled = false;

    async function detectCity() {
      try {
        const res = await fetch("https://ipwho.is/?fields=city", {
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();

        if (cancelled) return;

        const detectedId = data.city ? matchCity(data.city) : null;

        if (detectedId && citiesData) {
          const city = citiesData.cities.find((c) => c.id === detectedId);
          if (city) {
            setSelectedCityId(city.id);
            setCityData(city);
            setCityDetected(true);
            return;
          }
        }

        // Unknown city or detection failed — ask the user
        setDetecting(false);
        setShowPicker(true);
      } catch {
        if (cancelled) return;
        // On error, ask the user
        setDetecting(false);
        setShowPicker(true);
      }
    }

    if (citiesData) {
      detectCity();
    }

    return () => {
      cancelled = true;
    };
  }, [cityDetected, citiesData]);

  if (cityDetected) return null;

  const handleSelectCity = (city: { id: number; name: string; slug: string }) => {
    setSelectedCityId(city.id);
    setCityData(city);
    setCityDetected(true);
  };

  return (
    <Dialog open={!cityDetected} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Выберите город
          </DialogTitle>
          <DialogDescription>
            {detecting
              ? "Определяем ваш город..."
              : "Не удалось определить город автоматически. Пожалуйста, выберите:"}
          </DialogDescription>
        </DialogHeader>

        {detecting ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : showPicker && citiesData ? (
          <div className="flex flex-col gap-2">
            {citiesData.cities.map((city) => (
              <Button
                key={city.id}
                variant="outline"
                className="w-full justify-start gap-2 h-12 text-base"
                onClick={() => handleSelectCity(city)}
              >
                <MapPin className="w-4 h-4" />
                {city.name}
              </Button>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CityDetectionDialog;
