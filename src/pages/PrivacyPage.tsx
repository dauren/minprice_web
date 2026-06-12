import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import PageMeta from "@/components/PageMeta";
import { t } from "@/lib/i18n";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-3">{title}</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
);

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-background pb-20">
            <PageMeta
                title={t.about.privacy}
                description="arzan.kz қызметіндегі деректерді қорғау және құпиялылық саясаты."
                url="/privacy"
            />
            <Header />

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t.product.backHome}
                </Link>

                <h1 className="text-2xl font-bold text-foreground mb-1">Құпиялылық саясаты</h1>
                <p className="text-xs text-muted-foreground mb-8">2026 жылғы 1 маусымдағы редакция.</p>

                <Section title="1. Жалпы ережелер">
                    <p>
                        arzan.kz — Қазақстандағы азық-түлік бағаларын салыстыруға арналған ақпараттық
                        қызмет. Біз пайдаланушылардың жеке деректерін сыйлаймыз және олардың
                        қорғалуына жауапкершілікпен қараймыз.
                    </p>
                    <p>
                        Осы саясат arzan.kz сайтын пайдалану кезінде қандай деректердің жиналатынын
                        және олармен қалай жұмыс істелетінін сипаттайды.
                    </p>
                </Section>

                <Section title="2. Тіркелу талап етілмейді">
                    <p>
                        arzan.kz тіркелуді немесе аутентификацияны талап етпейді. Пайдаланушылар
                        есептік жазба жасамай-ақ барлық мүмкіндіктерді пайдалана алады.
                    </p>
                </Section>

                <Section title="3. Жиналатын деректер">
                    <p>Сайт мыналарды жинайды немесе сақтайды:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>
                            <strong>Қала</strong> — таңдалған қала браузердің жергілікті жадына сақталады.
                            Сервер тарапына жіберілмейді.
                        </li>
                        <li>
                            <strong>Себет</strong> — себеттің мазмұны пайдаланушы сессиясымен байланыстырылып,
                            сервер жағында сақталады. Жеке басты сәйкестендіру үшін пайдаланылмайды.
                        </li>
                        <li>
                            <strong>Cookie-файлдар</strong> — Сайттың дұрыс жұмыс істеуі үшін техникалық
                            cookie-файлдар қолданылады (сессия идентификаторы, дүкен таңдаулары).
                        </li>
                        <li>
                            <strong>Аналитика</strong> — Сайт пайдаланушылар санын және қолданылатын
                            мүмкіндіктерді жалпы түрде бағалау үшін анонимді аналитика жинай алады.
                        </li>
                    </ul>
                </Section>

                <Section title="4. Деректерді үшінші тұлғаларға беру">
                    <p>
                        Біз пайдаланушылардың жеке деректерін үшінші тұлғаларға сатпаймыз, жалдамаймыз
                        немесе ашпаймыз. Деректер тек заңнама талап еткен жағдайда ғана мемлекеттік
                        органдарға берілуі мүмкін.
                    </p>
                </Section>

                <Section title="5. Cookie-файлдарды басқару">
                    <p>
                        Пайдаланушы браузер параметрлерінде cookie-файлдарды өшіре алады. Алайда бұл
                        Сайттың кейбір мүмкіндіктерінің (мысалы, себет) дұрыс жұмыс істемеуіне
                        әкелуі мүмкін.
                    </p>
                </Section>

                <Section title="6. Байланыс">
                    <p>
                        Құпиялылық саясатына қатысты сұрақтар бойынша хабарласыңыз:
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
                    </ul>
                </Section>
            </main>
        </div>
    );
};

export default PrivacyPage;
