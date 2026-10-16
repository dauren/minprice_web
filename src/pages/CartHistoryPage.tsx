import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, ShoppingCart, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { API_ENDPOINTS, apiClient } from "@/lib/api";
import { readCartList, invalidateCartReads } from "@/lib/cartReads";
import mascot from "@/assets/logo.png";
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
            const data = await readCartList();
            if (data && data.results) {
                setCarts(data.results.map((cart) => ({
                    ...cart,
                    name: cart.name ?? "",
                    is_active: cart.is_active ?? false,
                    created_at: cart.created_at ?? "",
                    updated_at: cart.updated_at ?? "",
                    item_count: cart.items_count ?? cart.item_count ?? 0,
                    is_owner: true,
                })));
            }
        } catch (e: any) {
            console.error("Error fetching cart history:", e);
            setError(e.message || "Не удалось загрузить историю корзин.");
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
            invalidateCartReads();
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
                        К текущей корзине
                    </Link>

                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" /> История корзин
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Здесь хранятся ваши прошлые и сохраненные корзины.</p>
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
                        <img src={mascot} alt="История пуста" className="w-20 h-20 mx-auto mb-4 object-contain opacity-40" />
                        <p className="text-muted-foreground text-sm mb-1">История пуста</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Архивированные корзины будут отображаться здесь.
                            <br />
                            Нажмите «Сохранить создать новую» в корзине, чтобы сохранить текущую.
                        </p>
                        <Link
                            to="/cart"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground bg-secondary rounded-lg px-4 py-2 hover:bg-secondary/80 transition-colors"
                        >
                            К текущей корзине
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {carts.map(cart => (
                            <div key={cart.uuid} className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${cart.is_active ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                                <div>
                                    <h3 className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                                        {cart.name}
                                        {cart.is_active && <span className="text-[10px] uppercase font-bold tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Активная</span>}
                                        {!cart.is_owner && <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full">С вами поделились</span>}
                                    </h3>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                        <span>{cart.item_count} товаров</span>
                                        <span>Обновлено: {new Date(cart.updated_at).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <Link
                                        to={`/cart/${cart.uuid}`}
                                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
                                    >
                                        Посмотреть
                                    </Link>
                                    {!cart.is_active && (
                                        <button
                                            onClick={() => handleSetActive(cart.uuid)}
                                            className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            Сделать активной
                                        </button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                                                title="Удалить"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Удалить корзину «{cart.name}»?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Это действие необратимо. Корзина и все её товары будут удалены навсегда.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(cart.uuid)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Удалить
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
