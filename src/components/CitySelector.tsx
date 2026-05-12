import { MapPin } from "lucide-react";
import { useCity } from "@/context/CityContext";
import { useCities } from "@/hooks/useApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CitySelector = () => {
  const { selectedCityId, setSelectedCityId, cityData, setCityData } = useCity();
  const { data: citiesData } = useCities();

  const handleCityChange = (city: { id: number; name: string; slug: string }) => {
    setSelectedCityId(city.id);
    setCityData(city);
  };

  const currentCity = cityData || citiesData?.cities.find(c => c.id === selectedCityId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground hover:text-foreground/80 transition-colors outline-none">
        <MapPin className="w-4 h-4" />
        <span>{currentCity?.name || 'Алматы'}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {citiesData?.cities.map((city) => (
          <DropdownMenuItem
            key={city.id}
            onClick={() => handleCityChange(city)}
            className={`cursor-pointer ${selectedCityId === city.id ? 'bg-accent' : ''}`}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {city.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CitySelector;
