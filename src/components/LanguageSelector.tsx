// src/components/LanguageSelector.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { useTherapy } from "./TherapyContext";

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useTherapy();

  const handleLanguageChange = (newLanguage: "tamil" | "kannada") => {
    if (language !== newLanguage) {
      setLanguage(newLanguage);
      // The useEffect in TherapyContext will handle the chat reset
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="text-xs text-muted-foreground mr-2">Language:</div>
      <Button
        variant={language === "tamil" ? "default" : "outline"}
        size="sm"
        onClick={() => handleLanguageChange("tamil")}
        className="h-7 px-2 text-xs"
      >
        தமிழ் (Tamil)
      </Button>
      <Button
        variant={language === "kannada" ? "default" : "outline"}
        size="sm"
        onClick={() => handleLanguageChange("kannada")}
        className="h-7 px-2 text-xs"
      >
        ಕನ್ನಡ (Kannada)
      </Button>
    </div>
  );
};

export default LanguageSelector;
