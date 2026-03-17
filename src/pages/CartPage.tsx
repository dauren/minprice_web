import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft, Zap, ChevronDown, ChevronUp, Check, Settings, Share, History, Edit2, AlertTriangle, Store, TrendingDown, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { useCart, CartItem } from "@/context/CartContext";
import StoreLogo from "@/components/StoreLogo";
import mascot from "@/assets/logo.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { toRuUnit } from "@/lib/utils";

const CartPage = () => {
  const {
    cartUuid, cartName, items, unavailableProducts, removeItem, updateQuantity,
    clearCart, totalPrice, totalItems, isOwner, isLoading, renameCart, archiveCart, deleteCart,
    addItem, selectedStoreIds, updateStorePreferences, availableStores
  } = useCart();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newCartName, setNewCartName] = useState(cartName);

  // Keep rename input in sync with actual cart name
  useEffect(() => {
    setNewCartName(cartName);
  }, [cartName]);
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedStoreIds);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Track items being removed (for slide-out animation)
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Sync local selection with context
  useEffect(() => {
    setLocalSelectedIds(selectedStoreIds);
  }, [selectedStoreIds]);

  const chainGroups = useMemo(() => {
    const groups: Record<string, { storeIds: number[]; logo: string | null }> = {};
    for (const s of availableStores) {
      if (!groups[s.chain_name]) groups[s.chain_name] = { storeIds: [], logo: s.chain_logo };
      groups[s.chain_name].storeIds.push(s.store_id);
    }
    return groups;
  }, [availableStores]);

  const groupedByStore = items.reduce<Record<string, CartItem[]>>(
    (acc, item) => {
      if (!acc[item.store_name]) acc[item.store_name] = [];
      acc[item.store_name].push(item);
      return acc;
    },
    {}
  );

  const storeEntries = Object.entries(groupedByStore);

  // Calculate max possible total (sum of all item totals at their current store prices — approximation)
  // We'll use item prices * quantity as the "max" baseline since we don't have worst-store prices here
  // The savings is totalPrice vs what user would pay at worst stores — for now show if there are multiple stores
  const savingsAmount = useMemo(() => {
    if (storeEntries.length <= 1 || items.length === 0) return 0;
    // Approximate: savings is meaningful when items span multiple stores
    // Since totalPrice is already the cheapest mix, and we don't have worst-case data,
    // we can calculate a rough savings percentage based on the number of stores
    const totalItemPrices = items.reduce((sum, i) => sum + i.item_total, 0);
    return totalItemPrices - totalPrice;
  }, [items, totalPrice, storeEntries.length]);

  const handleShare = async () => {
    if (cartUuid) {
      const url = `${window.location.origin}/cart/${cartUuid}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: cartName || "Моя корзина MinPrice",
            url: url
          });
          return;
        } catch (e) {
          // fallback to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована!",
          description: "Отправьте её друзьям, чтобы поделиться корзиной.",
        });
      } catch (err) {
        console.error("Failed to copy", err);
        alert(`Не удалось скопировать. Вот ваша ссылка: ${url}`);
      }
    }
  };

  const handleRename = async () => {
    if (newCartName.trim()) {
      await renameCart(newCartName.trim());
      setIsRenameOpen(false);
    }
  };

  const handleArchive = async () => {
    await archiveCart();
    toast({
      title: "Корзина сохранена",
      description: "Создана новая корзина. Старая доступна в истории.",
    });
  };

  const handleDelete = async () => {
    if (!cartUuid) return;
    await deleteCart(cartUuid);
    toast({ title: "Корзина удалена" });
  };

  const handleRemoveItem = (item: CartItem) => {
    // Start slide-out animation
    setRemovingItems(prev => new Set(prev).add(item.product.uuid));

    // After animation, actually remove
    setTimeout(() => {
      removeItem(item.product.uuid);
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(item.product.uuid);
        return next;
      });

      // Show undo toast
      toast({
        title: "Товар удалён",
        description: item.product.title,
        action: (
          <ToastAction altText="Отменить" onClick={() => {
            addItem(item.product.uuid, item.quantity);
          }}>
            Отменить
          </ToastAction>
        ),
      });
    }, 350);
  };

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(item);
    } else {
      updateQuantity(item.product.uuid, newQuantity);
    }
  };

  const isChainSelected = (storeIds: number[]) =>
    localSelectedIds.length === 0 || storeIds.some(id => localSelectedIds.includes(id));

  const toggleChain = (storeIds: number[]) => {
    setLocalSelectedIds(prev => {
      const allIds = availableStores.map(s => s.store_id);
      const effective = prev.length === 0 ? allIds : prev;
      const hasAny = storeIds.some(id => effective.includes(id));
      return hasAny
        ? effective.filter(id => !storeIds.includes(id))
        : [...prev, ...storeIds.filter(id => !prev.includes(id))];
    });
  };

  const applyStorePrefs = async () => {
    setIsApplying(true);
    try {
      await updateStorePreferences(localSelectedIds);
      toast({ title: "Предпочтения сохранены" });
    } finally {
      setIsApplying(false);
    }
  };

  const switchToChain = async (chainName: string, fallbackStoreId: number) => {
    setIsApplying(true);
    try {
      const storeIds = chainGroups[chainName]?.storeIds ?? [fallbackStoreId];
      await updateStorePreferences(storeIds);
      toast({ title: `Показываю только ${chainName}` });
    } finally {
      setIsApplying(false);
    }
  };

  const hasItems = items.length > 0 || unavailableProducts.length > 0;

  return (
    <div className="min-h-screen bg-background pb-28 sm:pb-8">
      <Header />

      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-3 sm:mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Продолжить покупки
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/cart-history" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              История
            </Link>
          </div>
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              {cartName}
              {isOwner && (
                <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                  <DialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Переименовать корзину</DialogTitle>
                    </DialogHeader>
                    <Input
                      value={newCartName}
                      onChange={(e) => setNewCartName(e.target.value)}
                      placeholder="Название корзины"
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Отмена</Button>
                      <Button onClick={handleRename}>Сохранить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </h1>
            {!isOwner && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">С вами поделились этой корзиной</span>}
          </div>

          <div className="flex items-center gap-3">
            {cartUuid && (
              <button onClick={handleShare} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                <Share className="w-3.5 h-3.5" />
                Поделиться
              </button>
            )}
            {isOwner && items.length > 0 && (
              <>
                <button
                  onClick={handleArchive}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Сохранить создать новую
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить корзину?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Это действие необратимо. Все товары в корзине будут удалены.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Store Preferences (Now always visible) */}
        {isOwner && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" />
              Предпочтительные магазины
            </div>

            <div className="border border-border rounded-xl p-3 bg-card space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Выберите магазины, в которых вы хотите покупать. Оптимальный микс будет рассчитан только по выбранным.
              </p>
              {Object.keys(chainGroups).length === 0 ? (
                <p className="text-xs text-muted-foreground">Загрузка...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(chainGroups).map(([chainName, { storeIds, logo }]) => {
                    const isSelected = isChainSelected(storeIds);
                    return (
                      <button
                        key={chainName}
                        onClick={() => toggleChain(storeIds)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/50 text-muted-foreground"
                          }`}
                      >
                        <StoreLogo store={chainName} logoUrl={logo || undefined} />
                        {chainName}
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  size="sm"
                  onClick={applyStorePrefs}
                  className="text-xs h-7"
                  disabled={isApplying}
                >
                  {isApplying && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Применить
                </Button>

                {localSelectedIds.length > 0 && (
                  <button
                    onClick={() => setLocalSelectedIds([])}
                    className="text-[11px] text-primary hover:underline transition-colors font-medium"
                  >
                    Выбрать все
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin opacity-20" />
            <p className="text-xs text-muted-foreground animate-pulse">Загрузка корзины...</p>
          </div>
        ) : !hasItems ? (
          <div className="text-center py-16">
            <img src={mascot} alt="Корзина пуста" className="w-20 h-20 mx-auto mb-3 object-contain opacity-50" />
            <p className="text-muted-foreground text-sm mb-1">Корзина пуста</p>
            <p className="text-xs text-muted-foreground mb-4">Добавьте товары для сравнения цен</p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground bg-secondary rounded-lg px-4 py-2 hover:bg-secondary/80 transition-colors"
            >
              Перейти к покупкам
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Optimal mix banner with shimmer */}
            {items.length > 0 && (
              <div className="relative border border-border rounded-xl px-4 py-3 bg-green-50/50 dark:bg-green-950/20 overflow-hidden">
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 animate-shimmer pointer-events-none"
                  style={{
                    backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                  }}
                />
                <div className="relative flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-300">Оптимальный микс: {totalPrice.toLocaleString()} ₸</span>
                </div>
                <p className="relative text-xs text-green-700/80 dark:text-green-400/80 mt-1">Цены основаны на самом выгодном магазине для каждого товара с учетом ваших предпочтений.</p>
                {savingsAmount > 0 && (
                  <div className="relative flex items-center gap-1.5 mt-2 pt-2 border-t border-green-200/50 dark:border-green-800/30">
                    <TrendingDown className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                      Вы экономите {savingsAmount.toLocaleString()} ₸ с оптимальным миксом
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Cart Items grouped by store */}
            {storeEntries.map(([store, storeItems]) => {
              const storeTotal = storeItems.reduce((sum, i) => sum + i.item_total, 0);
              // Get chain logo from first item in group
              const chainLogo = storeItems[0]?.chain_logo;
              const chainName = storeItems[0]?.chain_name || store;

              return (
                <div key={store} className="border border-border rounded-xl overflow-hidden">
                  <div className="px-3 sm:px-4 py-2.5 bg-secondary/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StoreLogo store={chainName} size="md" logoUrl={chainLogo || undefined} />
                      <span className="text-sm font-medium text-foreground">{store}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {storeItems.length} {storeItems.length === 1 ? "товар" : "товаров"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <button
                          onClick={() => switchToChain(chainName, storeItems[0].store_id)}
                          disabled={isApplying}
                          className="text-[10px] text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-1"
                          title="Показать корзину только из этого магазина"
                        >
                          {isApplying && <Loader2 className="w-2 h-2 animate-spin" />}
                          Только здесь
                        </button>
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {storeTotal.toLocaleString()} ₸
                      </span>
                    </div>
                  </div>

                  {storeItems.map((item, idx) => {
                    const isRemoving = removingItems.has(item.product.uuid);
                    return (
                      <div
                        key={`${item.product.uuid}-${item.store_name}`}
                        className={`px-3 sm:px-4 py-3 ${idx < storeItems.length - 1 ? "border-b border-border" : ""} ${isRemoving ? "animate-slide-out-left overflow-hidden" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <Link to={`/product/${item.product.uuid}`} className="shrink-0">
                            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg bg-secondary/50 overflow-hidden">
                              <img src={item.ext_product_image || item.product.image_url || mascot} alt={item.ext_product_title || item.product.title} className="w-full h-full object-cover" />
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${item.product.uuid}`}
                              className="text-[13px] sm:text-sm text-foreground line-clamp-2 hover:underline leading-snug"
                            >
                              {item.ext_product_title || item.product.title}
                            </Link>
                            {item.product.measure_unit_qty && item.product.measure_unit_kind && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{parseFloat(item.product.measure_unit_qty)} {toRuUnit(item.product.measure_unit_kind)}</p>
                            )}

                          </div>

                          {isOwner && (
                            <button
                              onClick={() => handleRemoveItem(item)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pl-[3.5rem] sm:pl-[4.25rem]">
                          <div className="flex items-center gap-3">
                            {isOwner ? (
                              <div className="flex items-center h-7 rounded-lg bg-secondary overflow-hidden">
                                <button
                                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                  className="h-full px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center text-xs font-semibold text-foreground">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                  className="h-full px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">{item.quantity} шт.</span>
                            )}
                            <span className="text-[11px] text-muted-foreground">{item.price.toLocaleString()} ₸ / шт</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {item.product.stores && item.product.stores.filter(p => isChainSelected([p.store_id])).length > 1 ? (() => {
                              const allStores = item.product.stores.filter(p => isChainSelected([p.store_id]));
                              const optimalStore = allStores.find(p => p.store_id === item.store_id);
                              const otherStores = allStores.filter(p => p.store_id !== item.store_id).sort((a, b) => b.price - a.price);
                              const displayStores = optimalStore ? [...otherStores, optimalStore] : allStores;

                              return displayStores.map(op => {
                                const isOptimal = op.store_id === item.store_id;
                                return (
                                  <div 
                                    key={op.store_id} 
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors ${
                                      isOptimal 
                                        ? "bg-green-100 border-green-300 text-green-900 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300 shadow-sm" 
                                        : "bg-secondary/50 border-border/50 text-muted-foreground"
                                    }`}
                                  >
                                    <StoreLogo store={op.chain_name} logoUrl={op.chain_logo || undefined} size="sm" className={`shrink-0 ${isOptimal ? "w-4 h-4" : "w-[14px] h-[14px]"}`} />
                                    <span className={`leading-none ${isOptimal ? "text-sm font-bold" : "text-[11px] font-medium"}`} title={`${op.price.toLocaleString()} ₸/шт`}>
                                      {(op.price * item.quantity).toLocaleString()} ₸
                                    </span>
                                  </div>
                                );
                              });
                            })() : (
                              <span className="text-sm font-bold text-foreground">
                                {item.item_total.toLocaleString()} ₸
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Unavailable Products */}
            {unavailableProducts.length > 0 && (
              <div className="border border-orange-300/50 dark:border-orange-700/50 rounded-xl overflow-hidden">
                <div className="px-3 sm:px-4 py-2.5 bg-orange-50/80 dark:bg-orange-950/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Недоступны ({unavailableProducts.length})
                  </span>
                </div>
                {unavailableProducts.map((item, idx) => (
                  <div
                    key={item.product.uuid}
                    className={`px-3 sm:px-4 py-3 opacity-60 ${idx < unavailableProducts.length - 1 ? "border-b border-orange-200/50 dark:border-orange-800/30" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                        <img src={item.product.image_url || mascot} alt={item.product.title} className="w-full h-full object-cover grayscale" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] sm:text-sm text-foreground line-clamp-2 leading-snug">
                          {item.product.title}
                        </p>
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5">
                          Нет в выбранных магазинах
                        </p>
                        <p className="text-[11px] text-muted-foreground">{item.quantity} шт.</p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => removeItem(item.product.uuid)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="border border-border rounded-xl px-3 sm:px-4 py-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {totalItems} {totalItems === 1 ? "товар" : totalItems < 5 ? "товара" : "товаров"} · {storeEntries.length} {storeEntries.length === 1 ? "магазин" : "магазина"}
                </span>
                <span className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                  {totalPrice.toLocaleString()} ₸
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
