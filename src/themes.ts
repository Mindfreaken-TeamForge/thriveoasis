export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  buttonGradient: string;
  buttonText: string;
}

export const themes: Record<string, ThemeColors> = {
  // Default theme inspired by an oasis with refreshing teal tones
  'Thrive Oasis(Default)': {
    primary: '#00A896', // Primary teal for main elements
    secondary: '#02C39A', // Lighter teal for secondary elements
    accent: '#0004ff', // Soft blue for accents
    background: '#05668D', // Deep blue to resemble water
    text: '#FFFFFF', // White text for high contrast on dark background
    buttonGradient: 'linear-gradient(135deg, #00A896, #02C39A)', // Teal gradient for buttons
    buttonText: '#FFFFFF', // White text on buttons for readability
  },

  // Vibrant theme with lush green and deep blue, simulating a horizon at dusk
  'Vibrant Horizon': {
    primary: '#50C878', // Vibrant green for primary elements
    secondary: '#191970', // Deep midnight blue for secondary elements
    accent: '#00BFFF', // Bright blue accent
    background: 'linear-gradient(135deg, #50C878 0%, #191970 100%)', // Gradient from green to blue for depth
    text: '#191970', // Dark text for contrast
    buttonGradient: 'linear-gradient(to right, #50C878, #00BFFF)', // Green to blue gradient for buttons
    buttonText: '#191970', // Dark text on buttons for contrast
  },

  // Cosmic-themed palette with purple, black, and golden accents
  'Cosmic Unity': {
    primary: '#6A5ACD', // Purple for a cosmic effect
    secondary: '#0D0D0D', // Black for depth and contrast
    accent: '#FFD700', // Gold accent for star-like highlights
    background: 'linear-gradient(135deg, #6A5ACD 0%, #0D0D0D 100%)', // Gradient from purple to black
    text: '#0D0D0D', // Dark text to match the theme
    buttonGradient: 'linear-gradient(to right, #6A5ACD, #FFD700)', // Purple to gold for buttons
    buttonText: '#0D0D0D', // Dark text on buttons
  },

  // A natural theme representing lush fields with vibrant green and blue tones
  'Elysian Fields': {
    primary: '#00FF7F', // Bright green for a field-like effect
    secondary: '#87CEEB', // Sky blue for contrast and freshness
    accent: '#FF4500', // Orange-red accent for contrast
    background: 'linear-gradient(135deg, #00FF7F 0%, #87CEEB 100%)', // Green to blue for an open field effect
    text: '#87CEEB', // Blue text for harmony with the background
    buttonGradient: 'linear-gradient(to right, #00FF7F, #FF4500)', // Green to orange gradient for buttons
    buttonText: '#87CEEB', // Blue text for contrast
  },

  // Industrial theme with metallic tones and bold red accents
  'Epic Nexus': {
    primary: '#A7A8AA', // Silver-gray primary color
    secondary: '#0080FF', // Bright blue for secondary elements
    accent: '#DC143C', // Bold red accent
    background: 'linear-gradient(135deg, #A7A8AA 0%, #0080FF 100%)', // Gray to blue for a metallic look
    text: '#0080FF', // Blue text for readability
    buttonGradient: 'linear-gradient(to right, #A7A8AA, #DC143C)', // Gray to red gradient for buttons
    buttonText: '#0080FF', // Blue text for contrast
  },

  // Futuristic design inspired by contrasting warm yellows and deep greens
  'Futuristic Fusion': {
    primary: '#FFD300', // Bright yellow for energy and optimism
    secondary: '#004B43', // Dark green for a futuristic vibe
    accent: '#FF6F61', // Coral accent for warmth
    background: 'linear-gradient(135deg, #FFD300 0%, #004B43 100%)', // Yellow to green gradient
    text: '#004B43', // Dark green text for readability
    buttonGradient: 'linear-gradient(to right, #FFD300, #FF6F61)', // Yellow to coral gradient for buttons
    buttonText: '#004B43', // Dark green for button text
  },

  // Majestic theme with royal blue, neon green, and bold red accents
  'Radiant Quest': {
    primary: '#4169E1', // Royal blue for primary elements
    secondary: '#7FFF00', // Neon green for secondary contrast
    accent: '#9B111E', // Deep red accent
    background: 'linear-gradient(135deg, #4169E1 0%, #7FFF00 100%)', // Blue to green gradient
    text: '#7FFF00', // Green text for contrast
    buttonGradient: 'linear-gradient(to right, #4169E1, #9B111E)', // Blue to red gradient for buttons
    buttonText: '#7FFF00', // Green text on buttons
  },

  // Inspired by space, with deep blues, purples, and bright magenta accents
  'Nebula Dreams': {
    primary: '#1E90FF', // Bright blue for cosmic feel
    secondary: '#6A5ACD', // Purple for depth
    accent: '#FF00FF', // Magenta accent
    background: 'linear-gradient(135deg, #1E90FF 0%, #6A5ACD 100%)', // Blue to purple gradient
    text: '#6A5ACD', // Purple text for harmony
    buttonGradient: 'linear-gradient(to right, #1E90FF, #FF00FF)', // Blue to magenta gradient for buttons
    buttonText: '#6A5ACD', // Purple text on buttons
  },

  // Elegant theme inspired by a sunrise, with warm gold and rich purple hues
  'Regal Sunrise': {
    primary: '#FFD700', // Bright gold for a sunrise effect
    secondary: '#4A0E4E', // Rich purple for elegance
    accent: '#FFA500', // Orange accent for warmth
    background: 'linear-gradient(135deg, #FFD700 0%, #4A0E4E 100%)', // Gold to purple gradient
    text: '#4A0E4E', // Purple text for readability
    buttonGradient: 'linear-gradient(to right, #FFD700, #FFA500)', // Gold to orange gradient for buttons
    buttonText: '#4A0E4E', // Purple button text
  },
  'Celestial Frost': {
    primary: '#C0C0C0', // Silver for a frosty look
    secondary: '#0F52BA', // Deep blue to resemble cold
    accent: '#A9A9A9', // Gray accent for depth
    background: 'linear-gradient(135deg, #C0C0C0 0%, #0F52BA 100%)', // Silver to blue gradient for an icy effect
    text: '#0F52BA', // Blue text for visibility on a frosty background
    buttonGradient: 'linear-gradient(to right, #C0C0C0, #A9A9A9)', // Silver gradient for buttons
    buttonText: '#0F52BA', // Blue text on buttons for contrast
  },

  // A forest-inspired theme with bronze, green, and golden accents
  'Enchanted Forest': {
    primary: '#CD7F32', // Bronze for a natural earthy tone
    secondary: '#228B22', // Forest green to enhance the theme
    accent: '#B8860B', // Goldenrod accent for a touch of magic
    background: 'linear-gradient(135deg, #CD7F32 0%, #228B22 100%)', // Bronze to green gradient
    text: '#228B22', // Green text for harmony with the forest theme
    buttonGradient: 'linear-gradient(to right, #CD7F32, #B8860B)', // Bronze to golden gradient for buttons
    buttonText: '#228B22', // Green button text for consistency
  },

  // A soft, romantic theme with blush pink and deep navy tones
  'Twilight Blush': {
    primary: '#B76E79', // Blush pink for a gentle feel
    secondary: '#000080', // Navy blue for depth and contrast
    accent: '#E0BFB8', // Beige accent to add warmth
    background: 'linear-gradient(135deg, #B76E79 0%, #000080 100%)', // Blush to navy gradient
    text: '#000080', // Navy text for readability on blush
    buttonGradient: 'linear-gradient(to right, #B76E79, #E0BFB8)', // Blush to beige gradient for buttons
    buttonText: '#000080', // Navy button text for clarity
  },

  // Elegant and bold with silver, crimson, and dark red tones
  'Crimson Elegance': {
    primary: '#E5E4E2', // Silver for a refined look
    secondary: '#DC143C', // Crimson for dramatic contrast
    accent: '#8B0000', // Dark red accent to add depth
    background: 'linear-gradient(135deg, #E5E4E2 0%, #DC143C 100%)', // Silver to crimson gradient
    text: '#DC143C', // Crimson text for an elegant contrast
    buttonGradient: 'linear-gradient(to right, #E5E4E2, #C0C0C0)', // Silver gradient for buttons
    buttonText: '#DC143C', // Crimson button text for continuity
  },

  // An ocean-inspired theme with copper and teal to evoke the seaside
  'Oceanic Patina': {
    primary: '#B87333', // Copper for a rustic, coastal feel
    secondary: '#008080', // Teal for ocean vibes
    accent: '#D2691E', // Chocolate accent for warmth
    background: 'linear-gradient(135deg, #B87333 0%, #008080 100%)', // Copper to teal gradient
    text: '#008080', // Teal text for harmony with the theme
    buttonGradient: 'linear-gradient(to right, #B87333, #D2691E)', // Copper to chocolate gradient for buttons
    buttonText: '#008080', // Teal button text for readability
  },

  // Industrial-inspired with dark gray, amber, and metallic accents
  'Industrial Amber': {
    primary: '#2C3539', // Dark gray for a metallic, industrial feel
    secondary: '#FFBF00', // Amber for warmth
    accent: '#4E5754', // Steel gray accent for a raw, industrial touch
    background: 'linear-gradient(135deg, #2C3539 0%, #FFBF00 100%)', // Gray to amber gradient
    text: '#FFBF00', // Amber text for high contrast
    buttonGradient: 'linear-gradient(to right, #FFBF00, #FFD700)', // Amber gradient for buttons
    buttonText: '#2C3539', // Dark gray text for industrial vibe
  },

  // A royal theme with opalescent pinks and purples for a luxurious feel
  'Royal Opalescence': {
    primary: '#FDEEF4', // Opalescent pink for an ethereal look
    secondary: '#7851A9', // Royal purple for depth and luxury
    accent: '#9370DB', // Medium purple accent for harmony
    background: 'linear-gradient(135deg, #FDEEF4 0%, #7851A9 100%)', // Opalescent pink to royal purple gradient
    text: '#7851A9', // Purple text for readability
    buttonGradient: 'linear-gradient(to right, #7851A9, #9370DB)', // Purple gradient for buttons
    buttonText: '#FDEEF4', // Opalescent pink text on buttons for elegance
  },
};
