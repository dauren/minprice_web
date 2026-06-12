import { MapPin } from "lucide-react";
import { useCity } from "@/context/CityContext";
import { useCities } from "@/hooks/useApi";
import { t } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// TODO: auto-detect city by IP (e.g. ipwho.is) and skip the picker if Almaty/Astana

const CityDetectionDialog = () => {
  const { cityDetected, setCityDetected, setSelectedCityId, setCityData } = useCity();
  const { data: citiesData } = useCities();

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
            {t.city.selectCity}
          </DialogTitle>
          <DialogDescription>
            {t.city.selectCityPrompt}
          </DialogDescription>
        </DialogHeader>

        {citiesData && (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CityDetectionDialog;
