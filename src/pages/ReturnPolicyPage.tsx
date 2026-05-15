import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-3">{title}</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
);

const ReturnPolicyPage = () => {
    return (
        <div className="min-h-screen bg-background pb-20">
            <PageMeta
                title="Политика возврата товара"
                description="Условия возврата товаров для пользователей сервиса minprice.kz."
                url="/return-policy"
            />
            <Header />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    На главную
                </Link>

                <h1 className="text-2xl font-bold text-foreground mb-1">Политика возврата товара</h1>
                <p className="text-xs text-muted-foreground mb-8">Редакция от 15 мая 2026 г.</p>

                <Section title="1. Общая информация">
                    <p>
                        minprice.kz — информационный сервис для сравнения цен на продукты питания в
                        супермаркетах Казахстана. Сервис не является интернет-магазином, не продаёт товары,
                        не принимает оплату и не осуществляет доставку товаров пользователям.
                    </p>
                    <p>
                        Данная страница описывает общий порядок возврата товаров, информация о которых может
                        отображаться на сайте minprice.kz.
                    </p>
                </Section>

                <Section title="2. Где оформляется возврат">
                    <p>
                        Возврат, обмен или претензии по качеству товара оформляются непосредственно у продавца,
                        у которого пользователь приобрёл товар: в магазине, интернет-магазине или приложении
                        соответствующей торговой сети.
                    </p>
                    <p>
                        minprice.kz не является стороной сделки купли-продажи между пользователем и продавцом,
                        поэтому не может самостоятельно принять товар, вернуть оплату или заменить товар.
                    </p>
                </Section>

                <Section title="3. Сроки и условия возврата">
                    <p>
                        Сроки, порядок и условия возврата определяются правилами конкретного продавца и
                        законодательством Республики Казахстан о защите прав потребителей.
                    </p>
                    <p>
                        Для оформления возврата обычно требуется сохранить чек, электронное подтверждение
                        покупки, упаковку товара и обратиться к продавцу в установленные им сроки.
                    </p>
                </Section>

                <Section title="4. Непродовольственные и продовольственные товары">
                    <p>
                        Возможность возврата продовольственных товаров зависит от причины обращения, состояния
                        товара, срока годности и правил продавца. Товары ненадлежащего качества подлежат
                        рассмотрению продавцом в порядке, предусмотренном законодательством Республики Казахстан.
                    </p>
                    <p>
                        Для отдельных категорий товаров могут применяться ограничения на возврат или обмен.
                        Перед покупкой рекомендуем проверить условия возврата на сайте или в приложении продавца.
                    </p>
                </Section>

                <Section title="5. Ошибки в цене или информации о товаре">
                    <p>
                        Цены и данные о товарах на minprice.kz носят информационный характер и могут отличаться
                        от актуальных условий продавца на момент покупки. Окончательная цена, наличие товара и
                        условия покупки определяются продавцом.
                    </p>
                    <p>
                        Если пользователь заметил ошибку в цене, названии, изображении или описании товара на
                        minprice.kz, он может сообщить об этом в поддержку сервиса.
                    </p>
                </Section>

                <Section title="6. Контакты поддержки minprice.kz">
                    <p>
                        По вопросам работы сайта или некорректной информации о товарах можно обратиться в
                        поддержку minprice.kz:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>
                            Email:{" "}
                            <a
                                href="mailto:support@minprice.kz"
                                className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                            >
                                support@minprice.kz
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://t.me/minpricekz_feedback"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                            >
                                Telegram-чат поддержки
                            </a>
                        </li>
                    </ul>
                </Section>
            </main>
        </div>
    );
};

export default ReturnPolicyPage;
