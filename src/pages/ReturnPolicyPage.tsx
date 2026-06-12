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

const ReturnPolicyPage = () => {
    return (
        <div className="min-h-screen bg-background pb-20">
            <PageMeta
                title="Тауарды қайтару саясаты"
                description="arzan.kz қызметі пайдаланушылары үшін тауарларды қайтару шарттары."
                url="/return-policy"
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

                <h1 className="text-2xl font-bold text-foreground mb-1">Тауарды қайтару саясаты</h1>
                <p className="text-xs text-muted-foreground mb-8">2026 жылғы 15 мамырдағы редакция.</p>

                <Section title="1. Жалпы ақпарат">
                    <p>
                        arzan.kz — Қазақстан супермаркеттеріндегі азық-түлік бағаларын салыстыруға арналған
                        ақпараттық қызмет. Қызмет интернет-дүкен болып табылмайды, тауар сатпайды,
                        төлем қабылдамайды және пайдаланушыларға тауар жеткізбейді.
                    </p>
                    <p>
                        Осы бет arzan.kz сайтында ақпараты көрсетілуі мүмкін тауарларды қайтарудың
                        жалпы тәртібін сипаттайды.
                    </p>
                </Section>

                <Section title="2. Тауарды қайтару">
                    <p>
                        Қайтару тек ақаулы немесе тиісті сапа талаптарына сай келмейтін тауарларға
                        қолданылады. Тауар ақаулы, зақымдалған, бүлінген немесе міндетті сапа талаптарына
                        сай келмесе, пайдаланушы тауарды сатып алған сатушыға жүгінуі тиіс.
                    </p>
                    <p>
                        Тиісті сапалы тауарды пайдаланушының бастамасымен қайтару белгілі бір сатушының
                        қайтару ережелерінде не Қазақстан Республикасының заңнамасында тікелей
                        көзделмесе, қарастырылмайды.
                    </p>
                </Section>

                <Section title="3. Тауарды айырбастау">
                    <p>
                        Тауарларды айырбастау қарастырылмайды. Тауардың сапасымен мәселе болса,
                        пайдаланушы тауарды сатып алған сатушыда қайтару өтінімін ресімдей алады.
                    </p>
                    <p>
                        arzan.kz тауарларды айырбастауды жүзеге асырмайды, өйткені сатушы болып
                        табылмайды, төлем қабылдамайды және пайдаланушыларға тауар жеткізбейді.
                    </p>
                </Section>

                <Section title="4. Қайтару қайда ресімделеді">
                    <p>
                        Тауар сапасы бойынша қайтару немесе шағым пайдаланушы тауарды сатып алған
                        сатушыда тікелей ресімделеді: дүкенде, интернет-дүкенде немесе тиісті сауда
                        желісінің қолданбасында.
                    </p>
                    <p>
                        Қайтаруды ресімдеу үшін әдетте чекті, электрондық сатып алу растамасын,
                        тауардың қаптамасын сақтап, сатушы белгілеген мерзімде хабарласу қажет.
                    </p>
                </Section>

                <Section title="5. Тауар бағасындағы немесе ақпаратындағы қателер">
                    <p>
                        arzan.kz-дегі бағалар мен тауар деректері ақпараттық сипатта болады және
                        сатып алу кезінде сатушының өзекті шарттарынан өзгеше болуы мүмкін.
                        Соңғы баға, тауардың қол жетімділігі және сатып алу шарттарын сатушы айқындайды.
                    </p>
                    <p>
                        Пайдаланушы arzan.kz-де тауардың бағасында, атауында, суретінде немесе
                        сипаттамасында қате байқаса, қызмет қолдауына хабарлай алады.
                    </p>
                </Section>

                <Section title="6. arzan.kz қолдауымен байланыс">
                    <p>
                        Сайт жұмысы немесе тауарлар туралы дұрыс емес ақпарат бойынша arzan.kz
                        қолдауына жүгінуге болады:
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
                                Telegram қолдау чаты
                            </a>
                        </li>
                    </ul>
                </Section>
            </main>
        </div>
    );
};

export default ReturnPolicyPage;
