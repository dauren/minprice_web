import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, ShoppingCart, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import mascot from "@/assets/logo.png";
import { t } from "@/lib/i18n";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface CartHistoryItem {
    uuid: string;
    name: string;
    is_active: boolean;
    is_owner: boolean;
    created_at: string;
    updated_at: string;
    item_count: number;
}

const CartHistoryPage = () => {
    const { cartUuid, fetchCart, deleteCart } = useCart();
    const [carts, setCarts] = useState<CartHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<any>(API_ENDPOINTS.carts());
            if (data && data.results) {
                const cartsWithOwnership = await Promise.all(
                    data.results.map(async (cart: CartHistoryItem) => {
                        try {
                            const summary = await apiClient.get<any>(API_ENDPOINTS.cartSummary(cart.uuid));
                            return { ...cart, is_owner: summary?.cart?.is_owner ?? true };
                        } catch {
                            return { ...cart, is_owner: true };
                        }
                    })
                );
                setCarts(cartsWithOwnership);
            }
        } catch (e: any) {
            console.error("Error fetching cart history:", e);
            setError(e.message || (import.meta.env.VITE_SITE_LANG === "kk" ? "Себет тарихын жүктеу сәтсіз болды." : "Не удалось загрузить историю корзин."));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleSetActive = async (uuid: string) => {
        try {
            await apiClient.post(API_ENDPOINTS.cartSetActive(uuid));
            await fetchCart();
            await loadHistory();
        } catch (e) {
            console.error("Failed to set active cart:", e);
        }
    };

    const handleDelete = async (uuid: string) => {
        try {
            await deleteCart(uuid);
            await loadHistory();
        } catch (e) {
            console.error("Failed to delete cart:", e);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-40 sm:pb-8">
            <Header />

            <main className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                <div className="mb-6">
                    <Link
                        to="/cart"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        {t.cartHistory.backToCart}
                    </Link>

                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> {t.cartHistory.heading}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{t.cartHistory.subheading}</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-destructive">
                        {error}
                    </div>
                ) : carts.length === 0 ? (
                    <div className="text-center py-16">
                        <img src={mascot} alt={t.cartHistory.empty} className="w-20 h-20 mx-auto mb-4 object-contain opacity-40" />
                        <p className="text-muted-foreground text-sm mb-1">{t.cartHistory.empty}</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            {t.cartHistory.emptyHint.split("\n").map((line, i) => (
                                <span key={i}>{line}{i === 0 && <br />}</span>
                            ))}
                        </p>
                        <Link
                            to="/cart"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground bg-secondary rounded-lg px-4 py-2 hover:bg-secondary/80 transition-colors"
                        >
                            {t.cartHistory.backToCart}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {carts.map(cart => (
                            <div key={cart.uuid} className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${cart.is_active ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                                <div>
                                    <h3 className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                                        {cart.name}
                                        {cart.is_active && <span className="text-[10px] uppercase font-bold tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{t.cartHistory.active}</span>}
                                        {!cart.is_owner && <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">{t.cartHistory.sharedWithYou}</span>}
                                    </h3>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                        <span>{t.cartHistory.itemCount(cart.item_count)}</span>
                                        <span>{t.cartHistory.updated(new Date(cart.updated_at).toLocaleDateString('ru-RU'))}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <Link
                                        to={`/cart/${cart.uuid}`}
                                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                                    >
                                        {t.cartHistory.view}
                                    </Link>
                                    {!cart.is_active && (
                                        <button
                                            onClick={() => handleSetActive(cart.uuid)}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            {t.cartHistory.makeActive}
                                        </button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                                                title={t.cartHistory.delete}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t.cartHistory.deleteConfirmTitle(cart.name)}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t.cartHistory.deleteConfirmDesc}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t.cartHistory.cancel}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(cart.uuid)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    {t.cartHistory.delete}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
};

export default CartHistoryPage;
