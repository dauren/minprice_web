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

const OfertaPage = () => {
    return (
        <div className="min-h-screen bg-background pb-20">
            <PageMeta
                title={t.about.publicOffer}
                description="arzan.kz қызметін пайдалану шарттары."
                url="/public-offer"
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

                <h1 className="text-2xl font-bold text-foreground mb-1">Қоғамдық ұсыныс</h1>
                <p className="text-xs text-muted-foreground mb-8">2026 жылғы 1 наурыздағы редакция.</p>

                <Section title="1. Жалпы ережелер">
                    <p>
                        Осы құжат «arzan.kz» ЖШС-нің (бұдан әрі — «Қызмет») қоғамдық ұсынысы болып табылады және{" "}
                        <span className="text-foreground font-medium">arzan.kz</span>{" "}
                        мекенжайында (бұдан әрі — «Сайт») орналасқан баға салыстыру қызметін пайдалану шарттарын айқындайды.
                    </p>
                    <p>
                        Сайтты пайдалану Қазақстан Республикасы Азаматтық кодексінің 395-бабына сәйкес
                        пайдаланушының осы ұсыныс шарттарын толық және сөзсіз қабылдауын білдіреді.
                    </p>
                </Section>

                <Section title="2. Ұсыныстың мәні">
                    <p>
                        Қызмет пайдаланушыларға Қазақстан супермаркеттеріндегі азық-түлік бағаларын
                        салыстыруға арналған ақпараттық құралға тегін қол жеткізуді қамтамасыз етеді.
                    </p>
                    <p>
                        Қызмет интернет-дүкен болып табылмайды, тауар сатпайды және сатып алушы мен
                        сатушы арасындағы делдал болып саналмайды. Ұсынылған бағалар туралы барлық
                        ақпарат тек ақпараттық сипатта болады.
                    </p>
                </Section>

                <Section title="3. Баға туралы деректер">
                    <p>
                        Тауарлар бағасы серіктес дүкендердің жалпы қол жетімді деректері негізінде
                        автоматты түрде жаңартылады. Қызмет бағаларды лезде жаңартуға кепілдік бермейді
                        және сатып алу кезінде Сайттағы бағалар мен дүкендегі бағалардың арасындағы
                        сәйкессіздік үшін жауапкершілік көтермейді.
                    </p>
                    <p>
                        Сатып алу алдында бағаның өзектілігін тікелей дүкеннің сайтында немесе
                        қолданбасында тексеру ұсынылады.
                    </p>
                </Section>

                <Section title="4. Пайдаланушының құқықтары мен міндеттері">
                    <p>Пайдаланушы құқылы:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Сайт мүмкіндіктерін жеке коммерциялық емес мақсатта тегін пайдалануға;</li>
                        <li>Дүкендерде іздеу үшін тауар атауларын көшіруге;</li>
                        <li>Серіктес дүкендердегі тауар беттерінің сілтемелері бойынша өтуге.</li>
                    </ul>
                    <p>Пайдаланушы міндеттенеді:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Сайтты автоматты деректер жинау (парсинг) мақсатында пайдаланбауға;</li>
                        <li>Сайттың жұмысын және оның инфрақұрылымын бұзбауға;</li>
                        <li>Сайтты пайдалану кезінде Қазақстан Республикасының заңнамасын сақтауға.</li>
                    </ul>
                </Section>

                <Section title="5. Жауапкершілікті шектеу">
                    <p>
                        Қызмет «бар күйінде» ұсынылады. Сайт әкімшілігі мыналар үшін жауапкершілік көтермейді:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                        <li>Сайтты пайдаланудан немесе пайдалана алмаудан туындаған зияндар үшін;</li>
                        <li>
                            Дүкендердегі нақты бағалар мен Сайтта көрсетілген бағалар арасындағы сәйкессіздік үшін;
                        </li>
                        <li>
                            Пайдаланушы жүгінген кезде дүкенде тауардың болуы немесе болмауы үшін.
                        </li>
                    </ul>
                </Section>

                <Section title="6. Жеке деректер">
                    <p>
                        Сайт тіркелуді талап етпейді және пайдаланушылардың жеке деректерін жинамайды.
                        Сайт функцияларының (қала таңдау, себет) дұрыс жұмыс істеуі үшін cookie-файлдарды
                        пайдалануы мүмкін. Деректер тек пайдаланушының браузерінде сақталады және
                        үшінші тұлғаларға берілмейді.
                    </p>
                </Section>

                <Section title="7. Зияткерлік меншік">
                    <p>
                        Дизайн, логотип, бағдарламалық код және мәтіндерді қоса алғанда, Сайттың барлық
                        материалдары Қызметтің меншігі болып табылады және Қазақстан Республикасының
                        зияткерлік меншік туралы заңнамасымен қорғалады. Материалдарды әкімшіліктің
                        жазбаша келісімінсіз пайдалануға тыйым салынады.
                    </p>
                </Section>

                <Section title="8. Шарттарды өзгерту">
                    <p>
                        Әкімшілік осы ұсыныс шарттарын бір жақты тәртіппен өзгертуге құқылы.
                        Жаңа редакция Сайтта жарияланған сәттен бастап күшіне енеді. Өзгерістер
                        жарияланғаннан кейін Сайтты пайдалануды жалғастыру пайдаланушының жаңа шарттармен
                        келісімін білдіреді.
                    </p>
                </Section>

                <Section title="9. Қолданылатын заң">
                    <p>
                        Осы ұсыныс Қазақстан Республикасының заңнамасымен реттеледі. Барлық даулар
                        ҚР қолданыстағы заңнамасына сәйкес шешіледі.
                    </p>
                </Section>

                <Section title="10. Байланыс">
                    <p>
                        Ұсыныс шарттарына немесе Қызмет жұмысына қатысты сұрақтар бойынша хабарласыңыз:
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

export default OfertaPage;
