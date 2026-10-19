export const translations = {
  numericalMethod: [
    'Calcul stabilisé pour les faibles rapports temps/constante RL ; mêmes hypothèses idéales, sans validation physique supplémentaire.',
    'Stable evaluation for small time/RL-constant ratios; the same ideal assumptions, without additional physical validation.',
    'Cálculo estable para razones pequeñas tiempo/constante RL; mismas hipótesis ideales, sin validación física adicional.',
  ],
  selectFile: ['Choisir un fichier', 'Choose a file', 'Elegir un archivo'],
  language: ['Langue', 'Language', 'Idioma'],
  eyebrow: [
    'Open source · laboratoire physique',
    'Open source · physical lab',
    'Código abierto · laboratorio físico',
  ],
  settings: ['Votre expérience', 'Your experiment', 'Tu experimento'],
  run: ['Calculer', 'Calculate', 'Calcular'],
  reset: ['Reprendre la démo', 'Reset demo', 'Restablecer demo'],
  results: ['Résultats reproductibles', 'Reproducible results', 'Resultados reproducibles'],
  inputData: ['Utiliser ses données', 'Use your own data', 'Usar tus datos'],
  jsonInput: ['Données JSON', 'JSON data', 'Datos JSON'],
  apply: ['Appliquer le JSON', 'Apply JSON', 'Aplicar JSON'],
  upload: ['Importer un fichier JSON', 'Import a JSON file', 'Importar un archivo JSON'],
  download: ['Exporter le rapport JSON', 'Export JSON report', 'Exportar informe JSON'],
  downloadSvg: ['Exporter le graphique SVG', 'Export SVG chart', 'Exportar gráfico SVG'],
  reportData: [
    'Voir les calculs et les traces',
    'Inspect calculations and traces',
    'Ver cálculos y trazas',
  ],
  method: ['Hypothèses du modèle', 'Model assumptions', 'Hipótesis del modelo'],
  footer: [
    'Alpha MIT · calculs locaux · aucun équipement connecté',
    'MIT alpha · local calculations · no connected equipment',
    'Alfa MIT · cálculos locales · ningún equipo conectado',
  ],
  invalidInput: [
    'Entrée invalide : vérifiez le schéma, les unités et les plages indiquées.',
    'Invalid input: check the schema, units and documented ranges.',
    'Entrada no válida: comprueba el esquema, las unidades y los rangos indicados.',
  ],
  invalidLocale: [
    'Langue non prise en charge : fr, en, es. / Unsupported language: fr, en, es. / Idioma no admitido: fr, en, es.',
    'Langue non prise en charge : fr, en, es. / Unsupported language: fr, en, es. / Idioma no admitido: fr, en, es.',
    'Langue non prise en charge : fr, en, es. / Unsupported language: fr, en, es. / Idioma no admitido: fr, en, es.',
  ],
  invalidJson: [
    'JSON invalide : le résultat précédent est conservé.',
    'Invalid JSON: the previous result is retained.',
    'JSON no válido: se conserva el resultado anterior.',
  ],
  notFound: ['Ressource introuvable.', 'Resource not found.', 'Recurso no encontrado.'],
  serverError: [
    'Serveur indisponible : vérifiez le port.',
    'Server unavailable: check the port.',
    'Servidor no disponible: comprueba el puerto.',
  ],
  listening: [
    'Démo locale / Local demo / Demo local : {url}',
    'Démo locale / Local demo / Demo local : {url}',
    'Démo locale / Local demo / Demo local : {url}',
  ],
  ready: ['Calcul terminé.', 'Calculation complete.', 'Cálculo terminado.'],
  failure: [
    'Commande impossible : vérifiez les arguments et le fichier.',
    'Command failed: check the arguments and file.',
    'La orden falló: comprueba los argumentos y el archivo.',
  ],
  cliUsage: [
    'Usage : {name} demo | run fichier.json [--locale=fr|en|es] [--output=nouveau.json]',
    'Usage: {name} demo | run file.json [--locale=fr|en|es] [--output=new.json]',
    'Uso: {name} demo | run archivo.json [--locale=fr|en|es] [--output=nuevo.json]',
  ],
  noOverwrite: [
    'Le fichier existe déjà ; choisissez un nouveau chemin.',
    'The file already exists; choose a new path.',
    'El archivo ya existe; elige una ruta nueva.',
  ],
  sourceSynthetic: ['Données synthétiques', 'Synthetic data', 'Datos sintéticos'],
  sourceUser: [
    'Données fournies par l’utilisateur',
    'User-supplied data',
    'Datos proporcionados por el usuario',
  ],
  title: [
    'Quand le courant continue après l’ouverture.',
    'When current continues after opening.',
    'Cuando la corriente continúa tras la apertura.',
  ],
  intro: [
    'Comparez trois interrupteurs génériques sur un défaut DC. Explorez les pertes en conduction, le courant maximal et l’énergie absorbée par l’écrêteur.',
    'Compare three generic switches during a DC fault. Explore conduction losses, peak current and energy absorbed by the clamp.',
    'Compara tres interruptores genéricos durante un fallo DC. Explora pérdidas de conducción, corriente máxima y energía absorbida por el limitador.',
  ],
  notice: [
    'Modèle exploratoire RL et écrêteur idéal. Pas de modèle validé de PrimeSwitch, d’arc ou de commutation hybride ; aucune capacité de coupure certifiée.',
    'Exploratory RL model with ideal clamp. No validated PrimeSwitch, arc or hybrid commutation model; no certified breaking capacity.',
    'Modelo exploratorio RL con limitador ideal. Sin modelo validado de PrimeSwitch, arco ni conmutación híbrida; ninguna capacidad de corte certificada.',
  ],
  summary: [
    '{count} interrupteurs comparés sous les mêmes hypothèses.',
    '{count} switches compared under identical assumptions.',
    '{count} interruptores comparados con las mismas hipótesis.',
  ],
  methodText: [
    'Source idéale, résistance et inductance en série. Avant ouverture : solution analytique RL. Après ouverture : l’écrêteur constant absorbe le courant jusqu’à son extinction, tandis que la source reste connectée à l’inductance. Les délais de détection et d’ouverture s’additionnent. La résistance de chaque interrupteur reste constante avant ouverture.',
    'Ideal source, series resistance and inductance. Before opening: analytical RL solution. After opening: a constant-voltage clamp absorbs current until extinction while the source remains connected to the inductor. Detection and opening delays add. Each switch resistance is constant before opening.',
    'Fuente ideal, resistencia e inductancia en serie. Antes de abrir: solución analítica RL. Tras abrir: un limitador de tensión constante absorbe corriente hasta su extinción y la fuente sigue conectada a la inductancia. Se suman los retrasos de detección y apertura. La resistencia del interruptor es constante antes de abrir.',
  ],
  next: [
    'L’export SPICE de la CLI permet de confronter ce modèle à ngspice. Un modèle expérimental est requis pour dimensionner un composant réel.',
    'The CLI SPICE export lets you compare this model against ngspice. Experimental models are required to size real components.',
    'La exportación SPICE de la CLI permite comparar con ngspice. Se requieren modelos experimentales para dimensionar componentes reales.',
  ],
  unknownRating: [
    'Temps d’ouverture ≠ extinction du courant ≠ capacité de coupure. Les caractéristiques du composant réel restent à mesurer.',
    'Opening time ≠ current extinction ≠ breaking capacity. Actual component characteristics still require measurement.',
    'Tiempo de apertura ≠ extinción de corriente ≠ capacidad de corte. Aún hay que medir las características reales.',
  ],
  busVoltage: ['Tension du bus (V)', 'Bus voltage (V)', 'Tensión del bus (V)'],
  inductance: ['Inductance (µH)', 'Inductance (µH)', 'Inductancia (µH)'],
  detection: ['Détection (µs)', 'Detection (µs)', 'Detección (µs)'],
  current: ['Courant initial (A)', 'Initial current (A)', 'Corriente inicial (A)'],
  device: ['Interrupteur', 'Switch', 'Interruptor'],
  mechanical: ['Mécanique générique', 'Generic mechanical', 'Mecánico genérico'],
  solidState: ['Semi-conducteur générique', 'Generic solid state', 'Semiconductor genérico'],
  fastRelay: ['Relais rapide générique', 'Generic fast relay', 'Relé rápido genérico'],
  loss: ['Pertes en conduction (W)', 'Conduction losses (W)', 'Pérdidas de conducción (W)'],
  peak: ['Courant maximal (A)', 'Peak current (A)', 'Corriente máxima (A)'],
  extinction: [
    'Extinction du courant (µs)',
    'Current extinction (µs)',
    'Extinción de corriente (µs)',
  ],
  energy: ['Énergie de l’écrêteur (J)', 'Clamp energy (J)', 'Energía del limitador (J)'],
  opening: ['Ouverture totale (µs)', 'Total opening delay (µs)', 'Retraso total de apertura (µs)'],
  xAxis: [
    'Temps (µs, échelle log₁₀(1+t))',
    'Time (µs, log₁₀(1+t) scale)',
    'Tiempo (µs, escala log₁₀(1+t))',
  ],
  yAxis: ['Courant (A)', 'Current (A)', 'Corriente (A)'],
  spiceMissing: [
    'ngspice indisponible : installez-le puis relancez spice.',
    'ngspice unavailable: install it and rerun spice.',
    'ngspice no disponible: instálalo y vuelve a ejecutar spice.',
  ],
  spiceFailure: [
    'Simulation ngspice impossible ou trace manquante.',
    'ngspice simulation failed or trace is missing.',
    'Simulación ngspice fallida o traza ausente.',
  ],
  spiceUsage: [
    'Commandes : netlist scenario.json --device=fastRelay --output=nouveau.cir ; spice scenario.json [--device=fastRelay].',
    'Commands: netlist scenario.json --device=fastRelay --output=new.cir; spice scenario.json [--device=fastRelay].',
    'Órdenes: netlist escenario.json --device=fastRelay --output=nuevo.cir; spice escenario.json [--device=fastRelay].',
  ],
};
export function message(key, locale = 'fr', values = {}) {
  const index = ['fr', 'en', 'es'].indexOf(locale);
  if (index < 0) throw Error(translations.invalidLocale[0]);
  if (!Object.hasOwn(translations, key))
    throw Error('Unknown translation / Traduction inconnue / Traducción desconocida: ' + key);
  return translations[key][index].replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '{' + k + '}');
}
