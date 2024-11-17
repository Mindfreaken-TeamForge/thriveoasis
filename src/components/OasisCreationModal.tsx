import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Users, Link, Crown, Plus, Save, Check, ChevronLeft, ChevronRight, Upload, Flame } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import FireSlider from './ui/FireSlider';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { themes, ThemeColors } from '../themes';
import { createOasis } from '../services/oasisService';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';

interface OasisData {
  name: string;
  type: string;
  types?: string[];
  color: string;
  imageUrl?: string;
  theme: string;
  themeMode: ThemeMode;
  ownerId: string;
  memberCount?: number;
  tier?: string;
  features?: string[];
  extraEmotes?: number;
  extraStickers?: number;
  monthlyPrice?: number;
}

interface OasisCreationModalProps {
  onClose: () => void;
  onCreateOasis: (oasisData: OasisData) => void;
  initialOasisName: string;
}

type ThemeMode = 'gradient' | 'primary' | 'secondary';

const OasisCreationModal: React.FC<OasisCreationModalProps> = ({
  onClose,
  onCreateOasis,
  initialOasisName,
}) => {
  const [step, setStep] = useState(1);
  const [selectedOasisType, setSelectedOasisType] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState('Free');
  const [extraEmotes, setExtraEmotes] = useState(0);
  const [extraStickers, setExtraStickers] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('Thrive Oasis(Default)');
  const [selectedThemeMode, setSelectedThemeMode] = useState<ThemeMode>('gradient');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shinyBlackButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #38bdf8, #0284c7)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(56, 189, 248, 0.5), inset 0 0 5px rgba(255,255,255,0.3)',
    border: 'none',
    transition: 'all 0.1s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    minHeight: '36px',
    width: 'auto',
    borderRadius: '0.5rem',
  };

  const selectedButtonStyle: React.CSSProperties = {
    ...shinyBlackButtonStyle,
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
  };

  const navigationButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #1e293b, #0f172a)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.3)',
    boxShadow: '0 0 15px rgba(15, 23, 42, 0.3), inset 0 0 5px rgba(255,255,255,0.1)',
    border: 'none',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    padding: '0.5rem 1rem',
    minHeight: '40px',
    borderRadius: '0.5rem',
    opacity: 0.9
  };

  const navigationButtonActiveStyle: React.CSSProperties = {
    ...navigationButtonStyle,
    background: 'linear-gradient(145deg, #475569, #334155)',
    boxShadow: '0 0 20px rgba(71, 85, 105, 0.4), inset 0 0 5px rgba(255,255,255,0.2)',
  };

  const handleNext = useCallback(() => {
    if (step === 1 && !selectedOasisType) {
      toast({
        title: 'Error',
        description: 'Please select a oasis type',
        variant: 'destructive',
      });
      return;
    }
    if (step === 2 && selectedFeatures.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one feature',
        variant: 'destructive',
      });
      return;
    }

    if (step === 3 && selectedTier === 'Free') {
      setStep(5);
      return;
    }

    setStep((prev) => Math.min(prev + 1, 5));
  }, [step, selectedOasisType, selectedFeatures, selectedTier, toast]);

  const handleBack = useCallback(() => {
    if (step === 5 && selectedTier === 'Free') {
      setStep(3);
      return;
    }

    setStep((prev) => Math.max(prev - 1, 1));
  }, [step, selectedTier]);

  const handleOasisTypeSelect = useCallback((type: string) => {
    setSelectedOasisType(type);
    setSelectedFeatures([]);
  }, []);

  const handleFeatureToggle = useCallback((feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  }, []);

  const handleSelectAllFeatures = useCallback(() => {
    if (!selectedOasisType) return;
    const allFeatures = features[selectedOasisType as keyof typeof features];
    setSelectedFeatures((prev) =>
      prev.length === allFeatures.length ? [] : allFeatures
    );
  }, [selectedOasisType]);

  const handleTierSelect = useCallback((tierName: string) => {
    setSelectedTier(tierName);
    setExtraEmotes(0);
    setExtraStickers(0);
    if (tierName === 'Free') {
      setSelectedTheme('Thrive Oasis(Default)');
    }
  }, []);

  const handleExtraEmotesChange = useCallback((value: number[]) => {
    setExtraEmotes(Math.max(0, Math.floor(value[0] / 250) * 250));
  }, []);

  const handleExtraStickerSlotsChange = useCallback((value: number[]) => {
    setExtraStickers(Math.max(0, Math.floor(value[0] / 50) * 50));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'File must be an image',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload images',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);

    try {
      const storage = getStorage();
      const timestamp = Date.now();
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `oasis-images/${timestamp}.${fileExtension}`;
      const imageRef = ref(storage, fileName);

      const metadata = {
        contentType: imageFile.type,
        customMetadata: {
          uploadedBy: user.uid,
          originalName: imageFile.name,
          timestamp: timestamp.toString(),
        },
      };

      const snapshot = await uploadBytes(imageRef, imageFile, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const calculateTotalPrice = () => {
    const baseTier = serverTiers.find((tier) => tier.name === selectedTier);
    if (!baseTier) return 0;
    return baseTier.price + extraEmotes / 250 + extraStickers / 50;
  };

  const handleCreateOasis = async () => {
    if (!selectedOasisType) return;

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an oasis.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const imageUrl = await uploadImage();
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

      const oasisData: OasisData = {
        name: initialOasisName,
        type: selectedOasisType,
        types: [selectedOasisType],
        color,
        ...(imageUrl && { imageUrl }),
        theme: selectedTheme,
        themeMode: selectedThemeMode,
        features: selectedFeatures,
        extraEmotes,
        extraStickers,
        monthlyPrice: calculateTotalPrice(),
        tier: selectedTier,
        ownerId: user.uid,
        memberCount: 1
      };

      const oasisId = await createOasis(user.uid, oasisData);
      
      onCreateOasis(oasisData);
      onClose();

      toast({
        title: 'Success',
        description: `Oasis "${initialOasisName}" created successfully!`,
      });
    } catch (error) {
      console.error('Error creating oasis:', error);
      toast({
        title: 'Error',
        description: 'Failed to create oasis. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const oasisTypes = [
    'Community',
    'Content Creator',
    'Gamer',
    'Coach',
    'Esports Company',
    'Tournament Agency',
    'Talent Agency',
  ];

  const features = {
    Community: [
      'Discussion Forums',
      'Event Planning',
      'Resource Sharing',
      'Member Profiles',
      'Moderation Tools',
    ],
    'Content Creator': [
      'Content Calendar',
      'Analytics Dashboard',
      'Collaboration Tools',
      'Monetization',
      'Community Features',
    ],
    Gamer: [
      'Team Management',
      'Tournament Organization',
      'Matchmaking',
      'Stats Tracking',
      'Voice Chat',
    ],
    Coach: [
      'Session Scheduling',
      'Progress Tracking',
      'Resource Library',
      'Payment Processing',
      'Student Management',
    ],
    'Esports Company': [
      'Team Management',
      'Event Organization',
      'Sponsorship Tools',
      'Analytics',
      'Broadcast Integration',
    ],
    'Tournament Agency': [
      'Tournament Creation',
      'Bracket Management',
      'Prize Distribution',
      'Stream Integration',
      'Registration System',
    ],
    'Talent Agency': [
      'Talent Profiles',
      'Contract Management',
      'Booking System',
      'Performance Analytics',
      'Payment Processing',
    ],
  };

  const serverTiers = [
    { name: 'Free', price: 0, emotes: 25, stickers: 0 },
    { name: 'Premium', price: 5, emotes: 500, stickers: 50 },
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Create Your Oasis</h2>
            <div>
              <label className="block text-sm font-medium text-blue-900">
                Oasis Name
              </label>
              <p className="text-lg font-semibold text-blue-700">
                {initialOasisName}
              </p>
            </div>
            <h3 className="text-xl font-bold mt-4">Select Your Oasis Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oasisTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleOasisTypeSelect(type)}
                  style={selectedOasisType === type ? selectedButtonStyle : shinyBlackButtonStyle}
                  className="w-full text-left"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Choose Your Features</h2>
            <Button
              onClick={handleSelectAllFeatures}
              style={shinyBlackButtonStyle}
              className="mb-4"
            >
              {selectedFeatures.length ===
              features[selectedOasisType as keyof typeof features].length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features[selectedOasisType as keyof typeof features].map(
                (feature) => (
                  <button
                    key={feature}
                    onClick={() => handleFeatureToggle(feature)}
                    style={selectedFeatures.includes(feature) ? selectedButtonStyle : shinyBlackButtonStyle}
                    className="w-full text-left"
                  >
                    {feature}
                  </button>
                )
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Choose Your Server Tier</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serverTiers.map((tier) => (
                <button
                  key={tier.name}
                  onClick={() => handleTierSelect(tier.name)}
                  style={selectedTier === tier.name ? selectedButtonStyle : shinyBlackButtonStyle}
                  className="w-full text-left"
                >
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold flex items-center">
                      {tier.name}
                    </h3>
                    <p className="text-sm">${tier.price}/month</p>
                    <ul className="text-sm mt-1">
                      <li>{tier.emotes} emotes</li>
                      {tier.stickers > 0 && (
                        <li>{tier.stickers} custom sticker slots</li>
                      )}
                    </ul>
                  </div>
                </button>
              ))}
            </div>

            {selectedTier === 'Premium' && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Extra Emote Slots (250 for $1)
                  </label>
                  <div className="flex items-center space-x-2">
                    <FireSlider
                      min={0}
                      max={2500}
                      step={250}
                      value={[extraEmotes]}
                      onValueChange={handleExtraEmotesChange}
                      className="flex-grow"
                    />
                    <span className="text-sm font-medium">{extraEmotes}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Extra Sticker Slots (50 for $1)
                  </label>
                  <div className="flex items-center space-x-2">
                    <FireSlider
                      min={0}
                      max={500}
                      step={50}
                      value={[extraStickers]}
                      onValueChange={handleExtraStickerSlotsChange}
                      className="flex-grow"
                    />
                    <span className="text-sm font-medium">{extraStickers}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xl font-bold">
                Total Price: ${calculateTotalPrice().toFixed(2)}/month
              </p>
            </div>
          </div>
        );

      case 4:
        return selectedTier === 'Premium' ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Customize Oasis Theme</h2>
            <div className="bg-gray-900 text-white rounded-lg p-4 border border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(themes).map(([themeName, themeColors]) => (
                  <div key={themeName} className="space-y-2">
                    <Button
                      onClick={() => setSelectedTheme(themeName)}
                      className={`h-24 w-full text-center p-2 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
                        selectedTheme === themeName ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        background: selectedThemeMode === 'gradient'
                          ? `linear-gradient(to bottom right, ${themeColors.primary}, ${themeColors.secondary})`
                          : selectedThemeMode === 'primary'
                            ? themeColors.primary
                            : themeColors.secondary,
                        color: 'white',
                        textShadow: '0px 3px 4px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {themeName}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedThemeMode('gradient')}
                        className={`flex-1 h-6 ${selectedThemeMode === 'gradient' ? 'ring-2 ring-blue-500' : ''}`}
                        style={{
                          background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`,
                        }}
                      />
                      <Button
                        onClick={() => setSelectedThemeMode('primary')}
                        className={`flex-1 h-6 ${selectedThemeMode === 'primary' ? 'ring-2 ring-blue-500' : ''}`}
                        style={{ background: themeColors.primary }}
                      />
                      <Button
                        onClick={() => setSelectedThemeMode('secondary')}
                        className={`flex-1 h-6 ${selectedThemeMode === 'secondary' ? 'ring-2 ring-blue-500' : ''}`}
                        style={{ background: themeColors.secondary }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null;

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Upload Oasis Image
              </h2>
              <p className="text-blue-900/80">Add a unique avatar for your oasis community</p>
            </div>
            
            <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/10">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Upload size={20} className="text-blue-600" />
                    Upload Requirements
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Maximum file size: 5MB
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Accepted formats: PNG, JPG, JPEG, GIF
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Recommended dimensions: 512x512 pixels
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Will be displayed as your oasis avatar
                    </li>
                  </ul>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  {imagePreview ? (
                    <div className="relative group">
                      <img
                        src={imagePreview}
                        alt="Oasis preview"
                        className="w-40 h-40 object-cover rounded-xl shadow-lg ring-2 ring-white/20 group-hover:ring-blue-500 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                        <p className="text-white text-sm">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-40 h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-blue-500/30 hover:border-blue-500 transition-colors duration-300 cursor-pointer"
                      onClick={triggerFileInput}
                    >
                      <Upload size={32} className="text-blue-500" />
                      <p className="text-sm text-blue-900 font-medium">Click to upload</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button
                    onClick={triggerFileInput}
                    style={shinyBlackButtonStyle}
                    disabled={isUploading}
                    className="w-full max-w-[160px]"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </div>
                    ) : imagePreview ? (
                      'Change Image'
                    ) : (
                      'Upload Image'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <Card className="w-full max-w-5xl mx-4 bg-gradient-to-br from-sky-400 via-sky-300 to-blue-400 text-blue-900 border-blue-500 overflow-y-auto max-h-[90vh]">
        <CardHeader className="relative">
          <Button
            onClick={onClose}
            style={shinyBlackButtonStyle}
            className="absolute right-2 top-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center justify-center text-3xl font-bold text-blue-900">
            <Flame className="mr-2" />
            Create Your Oasis
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <div className="w-full bg-blue-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-6">{renderStepContent()}</div>
        </CardContent>
        <CardFooter className="flex justify-between px-6 py-4">
          <Button
            onClick={handleBack}
            disabled={step === 1}
            style={step > 1 ? navigationButtonActiveStyle : navigationButtonStyle}
            className="w-24 hover:scale-105 transition-transform"
          >
            Back
          </Button>
          <Button
            onClick={step === 5 ? handleCreateOasis : handleNext}
            style={step === 5 ? navigationButtonActiveStyle : navigationButtonStyle}
            disabled={isUploading}
            className="w-24 hover:scale-105 transition-transform"
          >
            {step === 5 ? (
              isUploading ? 'Creating...' : 'Create'
            ) : (
              'Next'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OasisCreationModal;