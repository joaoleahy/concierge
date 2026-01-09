import { useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Sparkles, Plus, ExternalLink, Utensils, Landmark, Umbrella, Palette, ShoppingBag, Moon } from "lucide-react";
import { useHotelByQR, DEMO_QR_CODE } from "@/hooks/useHotel";
import { useLocalRecommendations, RECOMMENDATION_CATEGORIES, LocalRecommendation } from "@/hooks/useLocalRecommendations";
import { useGuestSession } from "@/hooks/useGuestSession";
import { useCreateItineraryItem } from "@/hooks/useItinerary";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const categoryIcons: Record<string, React.ReactNode> = {
  landmarks: <Landmark className="h-4 w-4" />,
  restaurants: <Utensils className="h-4 w-4" />,
  beaches: <Umbrella className="h-4 w-4" />,
  culture: <Palette className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  nightlife: <Moon className="h-4 w-4" />,
};

const categoryLabels: Record<string, Record<string, string>> = {
  landmarks: { en: "Landmarks", pt: "Pontos Turísticos", es: "Lugares de Interés" },
  restaurants: { en: "Restaurants", pt: "Restaurantes", es: "Restaurantes" },
  beaches: { en: "Beaches", pt: "Praias", es: "Playas" },
  culture: { en: "Culture", pt: "Cultura", es: "Cultura" },
  shopping: { en: "Shopping", pt: "Compras", es: "Compras" },
  nightlife: { en: "Nightlife", pt: "Vida Noturna", es: "Vida Nocturna" },
};

export default function LocalGuide() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const qrCode = (search as { room?: string }).room || DEMO_QR_CODE;
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data, isLoading: hotelLoading } = useHotelByQR(qrCode);
  const { data: recommendations = [], isLoading: recsLoading } = useLocalRecommendations(
    data?.hotel?.id || null,
    selectedCategory || undefined
  );
  const { sessionId } = useGuestSession(data?.hotel?.id || null, data?.room?.id || null);
  const createItineraryItem = useCreateItineraryItem();

  const isLoading = hotelLoading || recsLoading;

  const handleAddToItinerary = async (recommendation: LocalRecommendation) => {
    if (!sessionId || !data?.hotel?.id) return;
    
    setAddingId(recommendation.id);
    
    try {
      // Create itinerary item for tomorrow at 10am, 2 hour duration
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      const name = language === "pt" && recommendation.name_pt 
        ? recommendation.name_pt 
        : recommendation.name;
      
      const description = language === "pt" && recommendation.description_pt 
        ? recommendation.description_pt 
        : recommendation.description;

      await createItineraryItem.mutateAsync({
        session_id: sessionId,
        hotel_id: data.hotel.id,
        title: name,
        description: description || null,
        location: recommendation.address || null,
        google_maps_url: recommendation.google_maps_url || null,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
        category: recommendation.category,
        recommendation_id: recommendation.id,
      });

      toast.success(t("itinerary.itemAdded"));
    } catch (error) {
      toast.error(t("itinerary.failedToAdd"));
    } finally {
      setAddingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(`/?room=${qrCode}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{t("recommendations.title")}</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="shrink-0"
          >
            {language === "en" ? "All" : language === "pt" ? "Todos" : "Todos"}
          </Button>
          {RECOMMENDATION_CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0 gap-2"
            >
              {categoryIcons[cat.id]}
              {categoryLabels[cat.id]?.[language] || cat.label}
            </Button>
          ))}
        </div>

        {/* Recommendations Grid */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {recommendations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                {language === "en" 
                  ? "No recommendations found" 
                  : language === "pt" 
                    ? "Nenhuma recomendação encontrada" 
                    : "No se encontraron recomendaciones"}
              </motion.div>
            ) : (
              recommendations.map((rec, index) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  language={language}
                  index={index}
                  onAddToItinerary={() => handleAddToItinerary(rec)}
                  isAdding={addingId === rec.id}
                  t={t}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: LocalRecommendation;
  language: string;
  index: number;
  onAddToItinerary: () => void;
  isAdding: boolean;
  t: (key: string) => string;
}

function RecommendationCard({ 
  recommendation, 
  language, 
  index, 
  onAddToItinerary, 
  isAdding,
  t 
}: RecommendationCardProps) {
  const name = language === "pt" && recommendation.name_pt 
    ? recommendation.name_pt 
    : recommendation.name;
  
  const description = language === "pt" && recommendation.description_pt 
    ? recommendation.description_pt 
    : recommendation.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="overflow-hidden">
        {recommendation.image_url && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={recommendation.image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
            {recommendation.is_hidden_gem && (
              <Badge className="absolute top-2 left-2 gap-1 bg-amber-500 hover:bg-amber-600">
                <Sparkles className="h-3 w-3" />
                {t("recommendations.hiddenGem")}
              </Badge>
            )}
            {recommendation.price_range && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                {recommendation.price_range}
              </Badge>
            )}
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight">{name}</h3>
              {recommendation.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{recommendation.address}</span>
                </p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0 gap-1">
              {categoryIcons[recommendation.category]}
              {categoryLabels[recommendation.category]?.[language] || recommendation.category}
            </Badge>
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {description}
            </p>
          )}
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onAddToItinerary}
              disabled={isAdding}
              className="flex-1 gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("recommendations.addToItinerary")}
            </Button>
            {recommendation.google_maps_url && (
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <a 
                  href={recommendation.google_maps_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">{t("recommendations.openMaps")}</span>
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
