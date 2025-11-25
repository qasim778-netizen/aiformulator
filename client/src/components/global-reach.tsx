import { useEffect, useState } from 'react';
import { Users, FileText, Globe } from 'lucide-react';
import worldMapImage from '@assets/generated_images/clean_minimalist_world_map.png';

// Animated count-up hook
const useCountUp = (endValue: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, endValue, duration]);

  return { count, setIsVisible };
};

// Stat card component with count-up
interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  endValue: number;
  suffix?: string;
  isVisible: boolean;
}

const StatCard = ({ icon: Icon, label, endValue, suffix = '+', isVisible }: StatCardProps) => {
  const { count, setIsVisible } = useCountUp(endValue, 2000);

  useEffect(() => {
    setIsVisible(isVisible);
  }, [isVisible, setIsVisible]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center">
      <div className="mb-4 p-3 bg-[#F7F5F2] rounded-lg">
        <Icon className="w-6 h-6 text-[#3BA9FF]" />
      </div>
      <p className="text-sm text-[#6B7280] font-medium mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-4xl font-bold text-[#1A1A1A]">{count}</p>
        <p className="text-xl text-[#3BA9FF] font-semibold">{suffix}</p>
      </div>
    </div>
  );
};

// Pulsing dot component
interface DotProps {
  x: number;
  y: number;
  delay?: number;
}

const PulsingDot = ({ x, y, delay = 0 }: DotProps) => (
  <div
    className="absolute w-2 h-2 rounded-full bg-[#3BA9FF]"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
      animationDelay: `${delay}ms`,
    }}
  />
);

// Main Global Reach Section Component
export const GlobalReachSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation when component mounts or becomes visible
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Dot positions (x%, y%) distributed across world map regions
  const dotPositions: { x: number; y: number; delay: number }[] = [
    { x: 25, y: 35, delay: 0 },      // North America
    { x: 75, y: 25, delay: 100 },    // Europe/Middle East
    { x: 85, y: 45, delay: 200 },    // India/Southeast Asia
    { x: 92, y: 65, delay: 300 },    // Australia
    { x: 40, y: 55, delay: 400 },    // South America
    { x: 70, y: 55, delay: 500 },    // Africa
    { x: 15, y: 30, delay: 600 },    // Western North America
    { x: 65, y: 35, delay: 700 },    // Western Europe
    { x: 55, y: 40, delay: 800 },    // Central Asia
    { x: 80, y: 75, delay: 900 },    // New Zealand
    { x: 35, y: 70, delay: 1000 },   // Southern Africa
    { x: 20, y: 65, delay: 1100 },   // Southern South America
  ];

  return (
    <div className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 bg-[#F7F5F2]">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-2">
            AIFormulator Global Reach
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto">
            Trusted by innovators worldwide to create professional formulations
          </p>
        </div>

        {/* World Map Container with Pulsing Dots */}
        <div className="relative w-full mb-12 sm:mb-16 rounded-xl overflow-hidden shadow-md">
          {/* Map Image */}
          <img
            src={worldMapImage}
            alt="World Map"
            className="w-full h-auto"
          />

          {/* Pulsing Dots Overlay */}
          <div className="absolute inset-0">
            {dotPositions.map((dot, index) => (
              <PulsingDot key={index} x={dot.x} y={dot.y} delay={dot.delay} />
            ))}
          </div>

          {/* CSS for pulse animation */}
          <style>{`
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.6;
                transform: scale(1.4);
              }
            }
          `}</style>
        </div>

        {/* Statistics Grid - 3 columns (responsive) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <StatCard
            icon={Users}
            label="Active Users"
            endValue={500}
            suffix="+"
            isVisible={isVisible}
          />
          <StatCard
            icon={FileText}
            label="Formulas Delivered"
            endValue={2500}
            suffix="+"
            isVisible={isVisible}
          />
          <StatCard
            icon={Globe}
            label="Countries Using AIFormulator"
            endValue={45}
            suffix="+"
            isVisible={isVisible}
          />
        </div>
      </div>
    </div>
  );
};
