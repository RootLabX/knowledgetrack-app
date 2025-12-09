import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface Props {
  achievements: Achievement[];
  onClose: () => void;
}

const categoryColors: { [key: string]: string } = {
  assessment: "from-purple-500 to-pink-500",
  courses: "from-blue-500 to-cyan-500",
  skills: "from-green-500 to-emerald-500",
  general: "from-orange-500 to-yellow-500",
};

export const AchievementNotification = ({ achievements, onClose }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const currentAchievement = achievements[currentIndex];

  useEffect(() => {
    if (!currentAchievement) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      if (currentIndex < achievements.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentIndex, achievements.length, onClose, currentAchievement]);

  if (!currentAchievement) return null;

  const gradientClass = categoryColors[currentAchievement.category] || categoryColors.general;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
          />

          {/* Achievement Card */}
          <motion.div
            key={currentAchievement.id}
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ 
              scale: 1, 
              rotate: 0, 
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 15,
              }
            }}
            exit={{ 
              scale: 0, 
              rotate: 10, 
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            className="relative pointer-events-auto"
          >
            {/* Sparkle effects */}
            <motion.div
              className="absolute -inset-10 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    x: Math.cos(i * 30 * Math.PI / 180) * 120,
                    y: Math.sin(i * 30 * Math.PI / 180) * 120,
                    scale: [0, 1.5, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </motion.div>
              ))}
            </motion.div>

            {/* Main card */}
            <div className="relative bg-card border-2 border-primary/50 rounded-2xl p-8 shadow-2xl shadow-primary/20 max-w-sm">
              {/* Glow effect */}
              <div className={cn(
                "absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-30 blur-lg",
                gradientClass
              )} />

              {/* Content */}
              <div className="relative space-y-6 text-center">
                {/* Badge unlocked text */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-primary"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>¡LOGRO DESBLOQUEADO!</span>
                  <Sparkles className="h-4 w-4" />
                </motion.div>

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 0.3,
                    type: "spring",
                    stiffness: 300,
                  }}
                  className={cn(
                    "mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br",
                    gradientClass
                  )}
                >
                  <Award className="h-12 w-12 text-white" />
                </motion.div>

                {/* Achievement name */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentAchievement.name}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {currentAchievement.description}
                  </p>
                </motion.div>

                {/* Points */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r text-white font-bold",
                    gradientClass
                  )}
                >
                  <span className="text-lg">+{currentAchievement.points}</span>
                  <span className="text-sm opacity-90">puntos</span>
                </motion.div>

                {/* Progress indicator */}
                {achievements.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-center gap-1.5"
                  >
                    {achievements.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          i === currentIndex ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
