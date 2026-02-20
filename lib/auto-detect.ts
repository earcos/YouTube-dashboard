// Common tech/consumer brands to detect in video titles
const BRAND_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: "Apple", patterns: [/\bapple\b/i, /\biphone\b/i, /\bipad\b/i, /\bmacbook\b/i, /\bimac\b/i, /\bmac\b(?!\s*(and|cheese|address))/i, /\bairpods?\b/i, /\bapple\s*watch\b/i, /\bios\b/i, /\bmacos\b/i, /\bmac\s*pro\b/i, /\bmac\s*mini\b/i, /\bmac\s*studio\b/i, /\bvision\s*pro\b/i] },
  { name: "Samsung", patterns: [/\bsamsung\b/i, /\bgalaxy\b/i] },
  { name: "Google", patterns: [/\bgoogle\b/i, /\bpixel\b/i, /\bandroid\b/i, /\bchromebook\b/i] },
  { name: "Microsoft", patterns: [/\bmicrosoft\b/i, /\bwindows\b/i, /\bsurface\b/i, /\bxbox\b/i, /\bcopilot\b/i] },
  { name: "Sony", patterns: [/\bsony\b/i, /\bplaystation\b/i, /\bps5\b/i, /\bps4\b/i] },
  { name: "Tesla", patterns: [/\btesla\b/i, /\bmodel\s*[3ysx]\b/i, /\bcybertruck\b/i] },
  { name: "Amazon", patterns: [/\bamazon\b/i, /\balexa\b/i, /\bkindle\b/i, /\bfire\s*tv\b/i, /\becho\b/i] },
  { name: "Meta", patterns: [/\bmeta\b/i, /\boculus\b/i, /\bquest\s*\d\b/i] },
  { name: "Nintendo", patterns: [/\bnintendo\b/i, /\bswitch\b/i] },
  { name: "OpenAI", patterns: [/\bopenai\b/i, /\bchatgpt\b/i, /\bgpt[-\s]?\d/i, /\bdall[-\s]?e\b/i] },
  { name: "NVIDIA", patterns: [/\bnvidia\b/i, /\bgeforce\b/i, /\brtx\b/i] },
  { name: "AMD", patterns: [/\bamd\b/i, /\bryzen\b/i, /\bradeon\b/i] },
  { name: "Intel", patterns: [/\bintel\b/i, /\bcore\s*i[3579]\b/i] },
  { name: "DJI", patterns: [/\bdji\b/i, /\bmavic\b/i] },
  { name: "Xiaomi", patterns: [/\bxiaomi\b/i, /\bredmi\b/i] },
  { name: "OnePlus", patterns: [/\boneplus\b/i] },
  { name: "Huawei", patterns: [/\bhuawei\b/i] },
  { name: "LG", patterns: [/\blg\b/i] },
  { name: "Spotify", patterns: [/\bspotify\b/i] },
  { name: "Netflix", patterns: [/\bnetflix\b/i] },
  { name: "YouTube", patterns: [/\byoutube\b/i] },
  { name: "Notion", patterns: [/\bnotion\b/i] },
  { name: "Figma", patterns: [/\bfigma\b/i] },
  { name: "Adobe", patterns: [/\badobe\b/i, /\bphotoshop\b/i, /\bpremiere\b/i, /\blightroom\b/i] },
  { name: "Anthropic", patterns: [/\banthropic\b/i, /\bclaude\b/i] },
];

// Topic detection patterns
const TOPIC_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: "Review", patterns: [/\breview\b/i, /\breseña\b/i, /\banálisis\b/i, /\banalisis\b/i] },
  { name: "Unboxing", patterns: [/\bunboxing\b/i, /\bdesempaquetado\b/i] },
  { name: "Tutorial", patterns: [/\btutorial\b/i, /\bcómo\b/i, /\bcomo\s+hacer\b/i, /\bhow\s+to\b/i, /\bguía\b/i, /\bguia\b/i] },
  { name: "Comparison", patterns: [/\bvs\.?\b/i, /\bcomparati/i, /\bcomparison\b/i, /\bversus\b/i, /\bfrente\s+a\b/i] },
  { name: "Top/List", patterns: [/\btop\s*\d+/i, /\bmejores\b/i, /\bbest\b/i, /\bworst\b/i, /\bpeores\b/i] },
  { name: "News", patterns: [/\bnoticias?\b/i, /\bnews\b/i, /\bfiltración\b/i, /\bfiltracion\b/i, /\brumor/i, /\bleak/i] },
  { name: "Setup/Desk", patterns: [/\bsetup\b/i, /\bdesk\b/i, /\bescritorio\b/i, /\bworkspace\b/i] },
  { name: "Tips & Tricks", patterns: [/\btips?\b/i, /\btricks?\b/i, /\btrucos?\b/i, /\bconsejos?\b/i, /\bhacks?\b/i] },
  { name: "AI", patterns: [/\b(inteligencia\s*)?artificial\b/i, /\bai\b/i, /\bmachine\s*learning\b/i, /\bIA\b/] },
  { name: "Gaming", patterns: [/\bgaming\b/i, /\bjuegos?\b/i, /\bgame\b/i, /\bvideojuegos?\b/i] },
  { name: "Photography", patterns: [/\bfoto/i, /\bphoto/i, /\bcámara\b/i, /\bcamera\b/i] },
  { name: "Productivity", patterns: [/\bproductivid/i, /\bproductiv/i, /\borganizaci/i] },
  { name: "Opinion", patterns: [/\bopinión\b/i, /\bopinion\b/i, /\bpienso\b/i, /\bcreo\s+que\b/i] },
];

export function detectBrand(title: string): string | null {
  for (const brand of BRAND_PATTERNS) {
    for (const pattern of brand.patterns) {
      if (pattern.test(title)) {
        return brand.name;
      }
    }
  }
  return null;
}

export function detectTopic(title: string): string | null {
  for (const topic of TOPIC_PATTERNS) {
    for (const pattern of topic.patterns) {
      if (pattern.test(title)) {
        return topic.name;
      }
    }
  }
  return null;
}
