import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Save, RotateCcw, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/logo_1756133481367.png";

interface LogoSettings {
  logoUrl: string;
  logoSize: number; // Size in pixels (height)
  companyName: string;
}

export default function LogoSettings() {
  const [settings, setSettings] = useState<LogoSettings>(() => {
    // Force sync with navbar - get current localStorage or use defaults
    const saved = localStorage.getItem('ai_formulator_logo_settings');
    return saved ? JSON.parse(saved) : {
      logoUrl: logoImage,
      logoSize: 110,
      companyName: 'AIFormulator'
    };
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Listen for localStorage changes from navbar
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('ai_formulator_logo_settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
        setPreviewUrl(null); // Clear any preview since localStorage has been updated
      }
    };

    // Listen for custom navbar events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logoSettingsChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logoSettingsChanged', handleStorageChange);
    };
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: LogoSettings) => {
    localStorage.setItem('ai_formulator_logo_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
    
    // Trigger a custom event to notify navbar to update
    window.dispatchEvent(new CustomEvent('logoSettingsChanged', { 
      detail: newSettings 
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (PNG, JPG, SVG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const newSettings = {
      ...settings,
      logoUrl: previewUrl || settings.logoUrl
    };
    
    saveSettings(newSettings);
    setPreviewUrl(null);
    
    toast({
      title: "Settings Saved",
      description: "Logo settings have been updated successfully!",
    });
  };

  const handleSizeChange = (value: number[]) => {
    const newSettings = {
      ...settings,
      logoSize: value[0]
    };
    setSettings(newSettings);
  };

  const handleCompanyNameChange = (value: string) => {
    const newSettings = {
      ...settings,
      companyName: value
    };
    setSettings(newSettings);
  };

  const handleReset = () => {
    const defaultSettings = {
      logoUrl: logoImage,
      logoSize: 110,
      companyName: 'AIFormulator'
    };
    saveSettings(defaultSettings);
    setPreviewUrl(null);
    
    toast({
      title: "Settings Reset",
      description: "Logo settings have been reset to defaults",
    });
  };

  const currentLogoUrl = previewUrl || settings.logoUrl;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Logo Preview */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Current Logo Preview
            </Label>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <img 
                src={currentLogoUrl}
                alt="Current logo"
                style={{ height: `${settings.logoSize}px` }}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="%23ddd"/><text x="20" y="20" text-anchor="middle" dy="0.35em" font-family="Arial" font-size="12" fill="%23999">No Image</text></svg>';
                }}
              />
              <div>
                <h3 className="font-semibold text-lg">{settings.companyName}</h3>
                <p className="text-sm text-gray-600">Size: {settings.logoSize}px</p>
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Upload New Logo
            </Label>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-logo-upload"
              />
              {previewUrl && (
                <span className="text-sm text-green-600">
                  ✓ New image selected
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: PNG, JPG, SVG. Max size: 2MB
            </p>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="company-name" className="text-sm font-medium text-gray-700 mb-3 block">
              Company Name
            </Label>
            <Input
              id="company-name"
              value={settings.companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Enter company name"
              className="max-w-sm"
              data-testid="input-company-name"
            />
          </div>

          {/* Logo Size */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Logo Size: {settings.logoSize}px
            </Label>
            <div className="max-w-sm">
              <Slider
                value={[settings.logoSize]}
                onValueChange={handleSizeChange}
                max={200}
                min={20}
                step={10}
                className="w-full"
                data-testid="slider-logo-size"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>20px</span>
                <span>110px</span>
                <span>200px</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <Button 
              onClick={handleSave} 
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="button-save-logo-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              data-testid="button-reset-logo-settings"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}