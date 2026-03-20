export default function GuideScreen() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-5 shadow">
        <h1 className="text-xl font-bold">📖 Guida all'uso</h1>
        <p className="text-blue-100 text-sm mt-0.5">MappaTerritori</p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Sezione Mappa */}
        <Section icon="🗺️" title="Schermata Mappa">
          <p>La schermata principale mostra la mappa interattiva del territorio.</p>
          <ul className="mt-2 space-y-1">
            <li><b>Mappa / Topo / Satellite</b> — usa i pulsanti in alto a destra per cambiare il tipo di mappa.</li>
            <li><b>📍 Avvia</b> — inizia la registrazione GPS della tua posizione in tempo reale.</li>
            <li><b>⏹ Ferma</b> — mette in pausa la registrazione GPS.</li>
            <li><b>✓ Fine</b> — apre il dialogo di fine sessione: puoi salvare la traccia con un nome o scartarla.</li>
            <li><b>🗺 Carica KMZ</b> — importa un file KMZ con i confini dei territori da visualizzare sulla mappa.</li>
            <li><b>⬆ Bussola</b> — orienta la mappa nel senso di marcia (blu = attivo). Toccala di nuovo per tornare a nord.</li>
          </ul>
        </Section>

        {/* Sezione GPS */}
        <Section icon="📍" title="Registrazione GPS">
          <p>Puoi registrare il percorso che stai facendo direttamente con il GPS del dispositivo:</p>
          <ul className="mt-2 space-y-1">
            <li>Premi <b>📍 Avvia</b> per iniziare a registrare la tua posizione.</li>
            <li>Il badge verde <b>GPS ATTIVO</b> indica che la registrazione è in corso con la distanza percorsa.</li>
            <li>Se interrompi e riapri l'app, la sessione viene ripristinata automaticamente.</li>
            <li>Premi <b>✓ Fine</b> per cancellare la sessione e preparare la mappa per la prossima visita.</li>
            <li>🔔 <b>Allarme di confine</b> — se hai caricato un file KMZ, un <b>doppio beep</b> suona automaticamente nel momento in cui esci dal confine di un territorio.</li>
          </ul>
        </Section>

        {/* Sezione KMZ */}
        <Section icon="🗂️" title="File KMZ / Territori">
          <p>I file KMZ contengono le mappe dei territori con i loro confini e percorsi:</p>
          <ul className="mt-2 space-y-1">
            <li>Premi <b>🗺 Carica KMZ</b> e seleziona un file KMZ dal tuo dispositivo.</li>
            <li>Ogni percorso/territorio viene disegnato con un <b>colore diverso</b> per riconoscerlo facilmente.</li>
            <li>Un <b>cerchio colorato con il numero</b> del territorio appare al punto iniziale di ogni percorso.</li>
            <li>Tocca il cerchio per vedere il <b>nome del territorio</b>.</li>
            <li>Puoi caricare <b>più file KMZ</b> contemporaneamente — ognuno ha il suo colore nella lista.</li>
            <li>Usa il <b>pallino colorato</b> in alto a sinistra per mostrare o nascondere un layer KMZ.</li>
            <li>Premi la <b>✕</b> accanto al nome per rimuovere un KMZ dalla mappa.</li>
          </ul>
        </Section>

        {/* Sezione Tracce salvate */}
        <Section icon="📁" title="Tracce salvate">
          <p>La schermata <b>Tracce</b> mostra tutte le sessioni GPS che hai salvato:</p>
          <ul className="mt-2 space-y-1">
            <li>Quando premi <b>✓ Fine</b>, puoi scegliere di <b>💾 Salvare</b> la traccia con un nome personalizzato oppure <b>🗑 Scartarla</b>.</li>
            <li>Ogni sessione salvata mostra il <b>nome</b>, la <b>distanza</b> percorsa in km e il numero di punti registrati.</li>
            <li>Premi <b>▶ Continua</b> per riaprire una sessione e riprendere la registrazione del territorio in una visita successiva.</li>
            <li>Premi <b>🗑️</b> accanto a una sessione per eliminarla definitivamente.</li>
          </ul>
        </Section>

        {/* Sezione Strati mappa */}
        <Section icon="🛰️" title="Tipi di mappa">
          <ul className="space-y-1">
            <li><b>Mappa</b> — mappa stradale standard OpenStreetMap.</li>
            <li><b>Topo</b> — mappa topografica con curve di livello, ideale per escursioni.</li>
            <li><b>Satellite</b> — immagine satellitare del terreno.</li>
          </ul>
        </Section>

        {/* Contatto WhatsApp */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-2">
          <p className="text-base font-bold text-green-800 mb-1">📞 Hai bisogno di aiuto?</p>
          <p className="text-sm text-green-700 leading-relaxed">
            Se riscontri dei problemi nell'uso dell'App o vorresti fossero aggiunte delle funzionalità
            puoi mandarmi un messaggio su WhatsApp a questo numero{' '}
            <a
              href="https://wa.me/393289696744"
              className="font-bold underline text-green-800"
            >
              3289696744
            </a>
            , sarà un piacere soddisfare le tue esigenze!
          </p>
        </div>

      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h2 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span>{icon}</span>
        <span>{title}</span>
      </h2>
      <div className="text-sm text-gray-600 space-y-1 leading-relaxed">{children}</div>
    </div>
  )
}
