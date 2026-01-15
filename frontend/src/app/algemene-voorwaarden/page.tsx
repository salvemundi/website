'use client';

import PageHeader from '@/widgets/page-header/ui/PageHeader';

export default function AlgemeneVoorwaardenPage() {
    return (
        <>
            <PageHeader title="Algemene Voorwaarden" backgroundImage="/img/backgrounds/association.jpg" />
            
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="prose prose-purple max-w-none">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Algemene Voorwaarden Salvemundi Reizen</h2>
                        
                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Definities</h3>
                            <p className="text-gray-700 mb-3">
                                In deze algemene voorwaarden wordt verstaan onder:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                <li><strong>Salvemundi</strong>: Studievereniging Salvemundi, gevestigd te Nijmegen</li>
                                <li><strong>Deelnemer</strong>: De persoon die zich aanmeldt voor een reis georganiseerd door Salvemundi</li>
                                <li><strong>Reis</strong>: Een meerdaagse activiteit georganiseerd door Salvemundi</li>
                                <li><strong>Crew</strong>: Vrijwilligers die de reis mede organiseren en begeleiden</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Aanmelding en Betaling</h3>
                            <p className="text-gray-700 mb-3">
                                2.1 Aanmelding voor een reis geschiedt via het online aanmeldformulier op de website van Salvemundi.
                            </p>
                            <p className="text-gray-700 mb-3">
                                2.2 Bij aanmelding dient een aanbetaling te worden voldaan. De hoogte van de aanbetaling wordt vermeld bij het aanmeldproces.
                            </p>
                            <p className="text-gray-700 mb-3">
                                2.3 De restbetaling dient voor een door Salvemundi gestelde datum te zijn voldaan. Bij niet-tijdige betaling behoudt Salvemundi zich het recht voor de aanmelding te annuleren.
                            </p>
                            <p className="text-gray-700 mb-3">
                                2.4 Na volledige betaling ontvangt de deelnemer een bevestigingsmail met verdere informatie over de reis.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Annulering door Deelnemer</h3>
                            <p className="text-gray-700 mb-3">
                                3.1 Bij annulering door de deelnemer gelden de volgende voorwaarden:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                <li>Tot 8 weken voor vertrek: restitutie minus €50,- administratiekosten</li>
                                <li>4 tot 8 weken voor vertrek: 50% van de totaalprijs</li>
                                <li>2 tot 4 weken voor vertrek: 75% van de totaalprijs</li>
                                <li>Minder dan 2 weken voor vertrek: geen restitutie</li>
                            </ul>
                            <p className="text-gray-700 mt-3">
                                3.2 Annulering dient schriftelijk (per e-mail) te geschieden.
                            </p>
                            <p className="text-gray-700 mt-3">
                                3.3 Het is toegestaan een vervanger aan te wijzen. Hiervoor gelden geen extra kosten.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Annulering door Salvemundi</h3>
                            <p className="text-gray-700 mb-3">
                                4.1 Salvemundi behoudt zich het recht voor een reis te annuleren indien er onvoldoende aanmeldingen zijn of bij overmacht.
                            </p>
                            <p className="text-gray-700 mb-3">
                                4.2 Bij annulering door Salvemundi wordt het volledige bedrag geretourneerd.
                            </p>
                            <p className="text-gray-700 mb-3">
                                4.3 Salvemundi is niet aansprakelijk voor eventuele gemaakte reiskosten of andere kosten die de deelnemer heeft gemaakt in verband met de reis.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Aansprakelijkheid</h3>
                            <p className="text-gray-700 mb-3">
                                5.1 Deelname aan de reis is geheel voor eigen risico.
                            </p>
                            <p className="text-gray-700 mb-3">
                                5.2 Salvemundi is niet aansprakelijk voor schade aan of verlies van eigendommen van deelnemers.
                            </p>
                            <p className="text-gray-700 mb-3">
                                5.3 Salvemundi is niet aansprakelijk voor letselschade, tenzij deze het gevolg is van opzet of grove schuld van Salvemundi.
                            </p>
                            <p className="text-gray-700 mb-3">
                                5.4 Deelnemers worden aangeraden een reisverzekering af te sluiten.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Gedrag en Regels</h3>
                            <p className="text-gray-700 mb-3">
                                6.1 Deelnemers dienen zich te houden aan de aanwijzingen van de crew en de regels die gesteld worden tijdens de reis.
                            </p>
                            <p className="text-gray-700 mb-3">
                                6.2 Bij grensoverschrijdend gedrag of het niet opvolgen van aanwijzingen kan een deelnemer van de reis worden verwijderd. In dat geval vindt geen restitutie plaats.
                            </p>
                            <p className="text-gray-700 mb-3">
                                6.3 Deelnemers zijn zelf verantwoordelijk voor eventuele schade die zij veroorzaken aan accommodatie, vervoermiddelen of eigendommen van derden.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Medische Informatie en Identificatie</h3>
                            <p className="text-gray-700 mb-3">
                                7.1 Deelnemers dienen bij aanmelding relevante medische informatie (zoals allergieën) door te geven.
                            </p>
                            <p className="text-gray-700 mb-3">
                                7.2 Deelnemers zijn verplicht een geldig legitimatiebewijs mee te nemen op de reis.
                            </p>
                            <p className="text-gray-700 mb-3">
                                7.3 Voor reizen naar het buitenland dient de deelnemer zelf te zorgen voor de benodigde reisdocumenten en eventuele visa.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Privacy en Gegevensverwerking</h3>
                            <p className="text-gray-700 mb-3">
                                8.1 Salvemundi gaat zorgvuldig om met de persoonsgegevens van deelnemers conform de AVG.
                            </p>
                            <p className="text-gray-700 mb-3">
                                8.2 Persoonsgegevens worden alleen gebruikt voor de organisatie van de reis en worden niet aan derden verstrekt, tenzij noodzakelijk voor de uitvoering van de reis.
                            </p>
                            <p className="text-gray-700 mb-3">
                                8.3 Tijdens de reis kunnen foto's en video's worden gemaakt. Deze kunnen worden gebruikt voor promotiemateriaal van Salvemundi. Deelnemers kunnen bezwaar maken tegen publicatie.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Wijzigingen</h3>
                            <p className="text-gray-700 mb-3">
                                9.1 Salvemundi behoudt zich het recht voor om wijzigingen aan te brengen in het programma indien noodzakelijk.
                            </p>
                            <p className="text-gray-700 mb-3">
                                9.2 Deelnemers worden tijdig op de hoogte gesteld van belangrijke wijzigingen.
                            </p>
                            <p className="text-gray-700 mb-3">
                                9.3 Bij ingrijpende wijzigingen hebben deelnemers het recht om kosteloos te annuleren.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h3>
                            <p className="text-gray-700 mb-3">
                                Voor vragen over deze algemene voorwaarden of over een specifieke reis kun je contact opnemen met Salvemundi via:
                            </p>
                            <ul className="list-none text-gray-700 space-y-2 ml-4">
                                <li><strong>E-mail:</strong> info@salvemundi.nl</li>
                                <li><strong>Website:</strong> www.salvemundi.nl</li>
                            </ul>
                        </section>

                        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded mt-8">
                            <p className="text-sm text-purple-700">
                                <strong>Let op:</strong> Door het indienen van een aanmelding geef je aan kennis te hebben genomen van en akkoord te gaan met deze algemene voorwaarden.
                            </p>
                        </div>

                        <p className="text-sm text-gray-500 mt-8 text-center">
                            Deze algemene voorwaarden zijn voor het laatst bijgewerkt op {new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: 'long' })}.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
