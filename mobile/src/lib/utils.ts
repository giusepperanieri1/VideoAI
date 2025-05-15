/**
 * Utility per l'app mobile VideoGenAI
 */

/**
 * Formatta una data ISO in formato leggibile
 * @param dateString Data in formato ISO
 * @param includeTime Se includere l'ora nel risultato
 * @returns Data formattata in italiano
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Opzioni per il formato data
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
    };
    
    // Formatta la data in italiano
    return date.toLocaleDateString('it-IT', options);
  } catch (error) {
    console.error('Errore nel formato data:', error);
    return dateString;
  }
}

/**
 * Formatta la durata in secondi nel formato mm:ss
 * @param seconds Durata in secondi
 * @returns Durata formattata
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Formatta un numero in formato leggibile (es. 1200 -> 1,2K)
 * @param num Numero da formattare
 * @returns Numero formattato
 */
export function formatNumber(num: number): string {
  if (!num && num !== 0) return '';
  
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
}

/**
 * Tronca una stringa alla lunghezza specificata
 * @param text Testo da troncare
 * @param maxLength Lunghezza massima
 * @returns Testo troncato con ellissi
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Genera un colore casuale per un identificatore
 * @param identifier Stringa identificativa
 * @returns Codice colore HEX
 */
export function getColorFromString(identifier: string): string {
  if (!identifier) return '#6d28d9'; // Viola predefinito
  
  // Genera un hash semplice dalla stringa
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Converte l'hash in un colore HEX
  const colors = [
    '#6d28d9', // Viola
    '#2563eb', // Blu
    '#0891b2', // Ciano
    '#059669', // Verde
    '#d97706', // Arancione
    '#dc2626', // Rosso
    '#7c3aed', // Indaco
    '#db2777', // Rosa
  ];
  
  // Seleziona un colore dall'array in base all'hash
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Ottiene le iniziali da un nome
 * @param name Nome completo
 * @param maxLength Numero massimo di iniziali
 * @returns Iniziali
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  let initials = '';
  for (let i = 0; i < Math.min(parts.length, maxLength); i++) {
    if (parts[i].length > 0) {
      initials += parts[i].charAt(0).toUpperCase();
    }
  }
  
  return initials;
}

/**
 * Controlla se un valore è un URL valido
 * @param value Valore da verificare
 * @returns true se è un URL valido
 */
export function isValidUrl(value: string): boolean {
  if (!value) return false;
  
  try {
    new URL(value);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Crea un oggetto URL con parametri di query
 * @param baseUrl URL base
 * @param params Parametri di query
 * @returns URL completo
 */
export function buildUrlWithParams(baseUrl: string, params: Record<string, string | number | boolean | undefined>): string {
  if (!baseUrl) return '';
  
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Calcola il tempo trascorso da una data
 * @param dateString Data in formato ISO
 * @returns Stringa con il tempo trascorso in italiano
 */
export function timeAgo(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (isNaN(secondsAgo) || secondsAgo < 0) {
    return 'adesso';
  }
  
  // Definizioni per il formato italiano
  const intervals = {
    anno: 31536000,
    mese: 2592000,
    settimana: 604800,
    giorno: 86400,
    ora: 3600,
    minuto: 60,
    secondo: 1
  };
  
  // Plurali in italiano
  const plurals = {
    anno: 'anni',
    mese: 'mesi',
    settimana: 'settimane',
    giorno: 'giorni',
    ora: 'ore',
    minuto: 'minuti',
    secondo: 'secondi'
  };
  
  // Trova l'intervallo appropriato
  for (const [interval, seconds] of Object.entries(intervals)) {
    const count = Math.floor(secondsAgo / seconds);
    
    if (count >= 1) {
      // Gestisce singolare/plurale in italiano
      const unit = count === 1 ? interval : plurals[interval as keyof typeof plurals];
      return `${count} ${unit} fa`;
    }
  }
  
  return 'adesso';
}