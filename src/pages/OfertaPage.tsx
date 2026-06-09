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

const OfertaPage = () => {
    return (
        <div className="min-h-screen bg-background pb-20">
            <PageMeta
                title="Публичная оферта"
                description="Условия использования сервиса сравнения цен arzan.kz."
                url="/public-offer"
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

                <h1 className="text-2xl font-bold text-foreground mb-1">Публичная оферта</h1>
                <p className="text-xs text-muted-foreground mb-8">Редакция от 1 марта 2026 г.</p>

                <Section title="1. Общие положения">
                    <p>
                        Настоящий документ является публичной офертой ТОО «arzan.kz» (далее — «Сервис») и
                        определяет условия использования сервиса сравнения цен, размещённого по адресу{" "}
                        <span className="text-foreground font-medium">arzan.kz</span> (далее — «Сайт»).
                    </p>
                    <p>
                        Использование Сайта означает полное и безоговорочное принятие пользователем условий
                        настоящей оферты в соответствии со статьёй 395 Гражданского кодекса Республики
                        Казахстан.
                    </p>
                </Section>

                <Section title="2. Предмет оферты">
                    <p>
                        Сервис предоставляет пользователям бесплатный доступ к информационному инструменту
                        для сравнения цен на продукты питания в супермаркетах Казахстана.
                    </p>
                    <p>
                        Сервис не является интернет-магазином, не осуществляет продажу товаров и не является
                        посредником между покупателем и продавцом. Вся представленная информация о ценах
                        носит исключительно информационный характер.
                    </p>
                </Section>

                <Section title="3. Данные о ценах">
                    <p>
                        Цены на товары обновляются автоматически на основе публично доступных данных
                        партнёрских магазинов. Сервис не гарантирует мгновенного обновления цен и не несёт
                        ответственности за расхождение цен на Сайте и в магазине на момент покупки.
                    </p>
                    <p>
                        Актуальность цены следует проверять непосредственно на сайте или в приложении
                        магазина перед совершением покупки.
                    </p>
                </Section>

                <Section title="4. Права и обязанности пользователя">
                    <p>Пользователь вправе:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>бесплатно использовать функции Сайта в личных некоммерческих целях;</li>
                        <li>копировать наименования товаров для поиска в магазинах;</li>
                        <li>переходить по ссылкам на страницы товаров в магазинах-партнёрах.</li>
                    </ul>
                    <p>Пользователь обязуется:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>не использовать Сайт в целях автоматического сбора данных (парсинга);</li>
                        <li>не нарушать работу Сайта и его инфраструктуры;</li>
                        <li>соблюдать законодательство Республики Казахстан при использовании Сайта.</li>
                    </ul>
                </Section>

                <Section title="5. Ограничение ответственности">
                    <p>
                        Сервис предоставляется «как есть». Администрация Сайта не несёт ответственности за:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>убытки, возникшие вследствие использования или невозможности использования Сайта;</li>
                        <li>
                            несоответствие реальных цен в магазинах ценам, отображаемым на Сайте;
                        </li>
                        <li>
                            наличие или отсутствие товара в магазине в момент обращения пользователя.
                        </li>
                    </ul>
                </Section>

                <Section title="6. Персональные данные">
                    <p>
                        Сайт не требует регистрации и не собирает персональные данные пользователей.
                        Сайт может использовать cookie-файлы для корректной работы функций (выбор города,
                        корзина). Данные хранятся исключительно в браузере пользователя и не передаются
                        третьим лицам.
                    </p>
                </Section>

                <Section title="7. Интеллектуальная собственность">
                    <p>
                        Все материалы Сайта, включая дизайн, логотип, программный код и тексты, являются
                        собственностью Сервиса и охраняются законодательством Республики Казахстан об
                        интеллектуальной собственности. Использование материалов без письменного согласия
                        администрации запрещено.
                    </p>
                </Section>

                <Section title="8. Изменение условий">
                    <p>
                        Администрация оставляет за собой право в одностороннем порядке изменять условия
                        настоящей оферты. Новая редакция вступает в силу с момента её публикации на Сайте.
                        Продолжение использования Сайта после публикации изменений означает согласие
                        пользователя с новыми условиями.
                    </p>
                </Section>

                <Section title="9. Применимое право">
                    <p>
                        Настоящая оферта регулируется законодательством Республики Казахстан. Все споры
                        решаются в соответствии с действующим законодательством РК.
                    </p>
                </Section>

                <Section title="10. Контакты">
                    <p>
                        По вопросам, связанным с условиями оферты или работой Сервиса, обращайтесь:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>
                            Email:{" "}
                            <a
                                href="mailto:support@arzan.kz"
                                className="text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity"
                            >
                                support@arzan.kz
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://t.me/arzankz_feedback"
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

export default OfertaPage;
