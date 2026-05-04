import os
import re

with open("src/pages/assets/AssetsPage.tsx", "r") as f:
    content = f.read()

# Add Promoted flag to Asset card [PROMO-05]
if '_isPromoted' not in content:
    injector = """
  const injectPromotedItems = (regularItems: any[], promotedItems: any[] = []) => {
    // For now we mock promoted items if none passed
    const mockPromoted = regularItems.length > 0 ? [{...regularItems[0], id: 'promo-1', is_promoted: true, _isPromoted: true}] : [];
    const promos = promotedItems.length > 0 ? promotedItems : mockPromoted;
    
    const result: any[] = [];
    let promotedIdx = 0;
    regularItems.forEach((item, idx) => {
      result.push(item);
      if ((idx + 1) % 4 === 0 && promotedIdx < promos.length) {
        result.push({ ...promos[promotedIdx], _isPromoted: true });
        promotedIdx++;
      }
    });
    return result;
  };
  
  const displayAssets = injectPromotedItems(assets);
"""
    content = content.replace('const observer = useRef<IntersectionObserver | null>(null);', 
                              'const observer = useRef<IntersectionObserver | null>(null);\n' + injector)
    
    content = content.replace('{assets.map((asset, index) => {', '{displayAssets.map((asset, index) => {')
    
    promoted_badge = """
                    {asset._isPromoted && (
                      <span className="absolute bottom-2 left-2 text-[8px] font-black text-gray-400 bg-white/80 dark:bg-gray-900/80 px-1.5 py-0.5 rounded-full">
                        Promoted
                      </span>
                    )}
"""
    content = content.replace('</div>\n                <div className="flex justify-between items-start gap-2 mb-1">', promoted_badge + '\n                </div>\n                <div className="flex justify-between items-start gap-2 mb-1">')

with open("src/pages/assets/AssetsPage.tsx", "w") as f:
    f.write(content)

print("Fixed AssetsPage.tsx")
