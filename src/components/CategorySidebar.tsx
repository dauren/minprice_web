import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCategories } from "@/hooks/useApi";
import { t, getCategoryName } from "@/lib/i18n";

interface CategorySidebarProps {
  activeCategory: number | null;
  onCategorySelect: (categoryId: number | null) => void;
}

const CategorySidebar = ({ activeCategory, onCategorySelect }: CategorySidebarProps) => {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const { data: categoriesData, isLoading } = useCategories();

  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (isLoading) {
    return (
      <aside className="hidden lg:block w-56 shrink-0 sticky top-16 self-start">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </aside>
    );
  }

  const topCategories = categoriesData?.categories || [];

  return (
    <aside className="hidden lg:block w-56 shrink-0 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
      <h2 className="text-sm font-semibold text-foreground mb-2 px-2">{t.catalog.categoriesHeading}</h2>
      <nav className="space-y-0.5">
        {/* All items section removed */}

        {topCategories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const isExpanded = expandedCategories.includes(cat.id);
          const hasChildren = cat.children && cat.children.length > 0;

          return (
            <div key={cat.id}>
              <div className="flex items-center">
                <button
                  onClick={() => onCategorySelect(cat.id)}
                  className={`flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-colors min-w-0 ${isActive
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                >
                  <span className="text-sm leading-none">{cat.emoji || '📦'}</span>
                  <span className="truncate">{getCategoryName(cat)}</span>
                </button>
                {hasChildren && (
                  <button
                    onClick={() => toggleExpanded(cat.id)}
                    className="p-1 rounded hover:bg-accent/50 text-muted-foreground"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>

              {isExpanded && hasChildren && (
                <div className="ml-7 space-y-0.5 mt-0.5 mb-1">
                  {cat.children!.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onCategorySelect(sub.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors truncate ${activeCategory === sub.id
                          ? "bg-accent/60 text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                        }`}
                    >
                      {getCategoryName(sub)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default CategorySidebar;
