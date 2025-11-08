/**
 * Extensive font library for captions
 * Based on Google Fonts - free for personal and commercial use
 */

export interface FontOption {
  name: string
  family: string
  category: 'trending' | 'bold' | 'elegant' | 'playful' | 'modern' | 'handwritten' | 'display'
  weights: number[]
  googleFont: boolean
}

export const CAPTION_FONTS: FontOption[] = [
  // Trending TikTok Fonts
  {
    name: 'Montserrat',
    family: 'Montserrat',
    category: 'trending',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Poppins',
    family: 'Poppins',
    category: 'trending',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Inter',
    family: 'Inter',
    category: 'trending',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Bebas Neue',
    family: 'Bebas Neue',
    category: 'trending',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Anton',
    family: 'Anton',
    category: 'trending',
    weights: [400],
    googleFont: true,
  },

  // Bold & Impact Fonts
  {
    name: 'Black Ops One',
    family: 'Black Ops One',
    category: 'bold',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Archivo Black',
    family: 'Archivo Black',
    category: 'bold',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Oswald',
    family: 'Oswald',
    category: 'bold',
    weights: [200, 300, 400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'Teko',
    family: 'Teko',
    category: 'bold',
    weights: [300, 400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'Barlow Condensed',
    family: 'Barlow Condensed',
    category: 'bold',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },

  // Elegant Fonts
  {
    name: 'Playfair Display',
    family: 'Playfair Display',
    category: 'elegant',
    weights: [400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Cormorant Garamond',
    family: 'Cormorant Garamond',
    category: 'elegant',
    weights: [300, 400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'Cinzel',
    family: 'Cinzel',
    category: 'elegant',
    weights: [400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Abril Fatface',
    family: 'Abril Fatface',
    category: 'elegant',
    weights: [400],
    googleFont: true,
  },

  // Playful Fonts
  {
    name: 'Bangers',
    family: 'Bangers',
    category: 'playful',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Fredoka',
    family: 'Fredoka',
    category: 'playful',
    weights: [300, 400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'Righteous',
    family: 'Righteous',
    category: 'playful',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Pacifico',
    family: 'Pacifico',
    category: 'playful',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Bungee',
    family: 'Bungee',
    category: 'playful',
    weights: [400],
    googleFont: true,
  },

  // Modern Sans Fonts
  {
    name: 'Roboto',
    family: 'Roboto',
    category: 'modern',
    weights: [100, 300, 400, 500, 700, 900],
    googleFont: true,
  },
  {
    name: 'Raleway',
    family: 'Raleway',
    category: 'modern',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Nunito',
    family: 'Nunito',
    category: 'modern',
    weights: [200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Work Sans',
    family: 'Work Sans',
    category: 'modern',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Space Grotesk',
    family: 'Space Grotesk',
    category: 'modern',
    weights: [300, 400, 500, 600, 700],
    googleFont: true,
  },

  // Handwritten Fonts
  {
    name: 'Caveat',
    family: 'Caveat',
    category: 'handwritten',
    weights: [400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'Shadows Into Light',
    family: 'Shadows Into Light',
    category: 'handwritten',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Dancing Script',
    family: 'Dancing Script',
    category: 'handwritten',
    weights: [400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: 'Satisfy',
    family: 'Satisfy',
    category: 'handwritten',
    weights: [400],
    googleFont: true,
  },

  // Display Fonts
  {
    name: 'Permanent Marker',
    family: 'Permanent Marker',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Rubik Mono One',
    family: 'Rubik Mono One',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Press Start 2P',
    family: 'Press Start 2P',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Orbitron',
    family: 'Orbitron',
    category: 'display',
    weights: [400, 500, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: 'Monoton',
    family: 'Monoton',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Lobster',
    family: 'Lobster',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Alfa Slab One',
    family: 'Alfa Slab One',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
  {
    name: 'Changa One',
    family: 'Changa One',
    category: 'display',
    weights: [400],
    googleFont: true,
  },
]

/**
 * Load Google Fonts dynamically
 */
export function loadGoogleFonts(fonts: FontOption[]): void {
  if (typeof document === 'undefined') return

  const googleFonts = fonts.filter((f) => f.googleFont)
  if (googleFonts.length === 0) return

  // Create font family string with weights
  const fontFamilies = googleFonts
    .map((font) => {
      const weights = font.weights.join(';')
      return `${font.family.replace(/ /g, '+')}:wght@${weights}`
    })
    .join('&family=')

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`

  // Only add if not already loaded
  const existing = document.querySelector(`link[href="${link.href}"]`)
  if (!existing) {
    document.head.appendChild(link)
  }
}

/**
 * Get font options by category
 */
export function getFontsByCategory(category: FontOption['category']): FontOption[] {
  return CAPTION_FONTS.filter((font) => font.category === category)
}

/**
 * Get font option by name
 */
export function getFontByName(name: string): FontOption | undefined {
  return CAPTION_FONTS.find((font) => font.name === name)
}
