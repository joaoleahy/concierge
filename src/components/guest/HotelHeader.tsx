import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Hotel } from "@/hooks/useHotel";
import { LanguageSelector } from "@/components/LanguageSelector";

interface HotelHeaderProps {
  hotel: Hotel;
  roomNumber: string;
}

export function HotelHeader({ hotel, roomNumber }: HotelHeaderProps) {
  const { t } = useTranslation();

  return (
    <motion.header
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#152a45] p-6 text-white shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />
      </div>

      {/* Language selector */}
      <div className="absolute right-3 top-3 z-20">
        <LanguageSelector />
      </div>

      <div className="relative z-10">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider opacity-80">
          {hotel.city}, {hotel.country}
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight drop-shadow-sm">
          {hotel.name}
        </h1>

        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
            {t("header.room")} {roomNumber}
          </span>
        </div>

        <p className="mt-4 text-sm opacity-90">
          {t("header.welcome")}! 👋
        </p>
      </div>
    </motion.header>
  );
}
