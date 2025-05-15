# VideoGenAI Mobile App

Applicazione mobile per iOS e Android che consente di creare, modificare e condividere video generati con l'intelligenza artificiale.

## Requisiti

- [Node.js](https://nodejs.org/) 14.0.0 o versione successiva
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)
- [Expo Go App](https://expo.dev/client) su dispositivo iOS o Android

## Configurazione

1. Installare le dipendenze:

```bash
cd mobile
npm install
```

2. Creare un file `.env` nella directory root del progetto mobile con le seguenti variabili:

```
EXPO_PUBLIC_API_URL=https://videogenai.replit.app
```

## Esecuzione in modalità sviluppo

Per avviare l'applicazione in modalità sviluppo:

```bash
npm start
```

Questo avvierà il server di sviluppo Expo. Puoi quindi eseguire l'app su:

- **Dispositivo iOS/Android**: Scansiona il codice QR mostrato nel terminale con l'app Expo Go
- **Simulatore iOS**: Premi `i` nel terminale
- **Emulatore Android**: Premi `a` nel terminale

## Struttura del progetto

```
mobile/
├── src/
│   ├── assets/            # Immagini, font e altri asset
│   ├── components/        # Componenti riutilizzabili
│   ├── hooks/             # Hook personalizzati
│   ├── lib/               # Utility e configurazioni
│   ├── navigation/        # Struttura di navigazione dell'app
│   └── screens/           # Schermate dell'applicazione
├── app.json               # Configurazione dell'app Expo
├── App.tsx                # Punto di ingresso dell'applicazione
└── package.json           # Dipendenze e script
```

## Caratteristiche principali

- **Autenticazione** integrata con il backend web
- **Visualizzazione progetti** creati nell'app web o mobile
- **Creazione progetti** manuali o generati con AI
- **Editor video** per modificare i progetti esistenti
- **Gestione account social** per la pubblicazione
- **Monitoraggio attività** di generazione video AI
- **Supporto multipiattaforma** iOS e Android
- **Tema chiaro/scuro** automatico o impostabile manualmente

## Build per produzione

Per creare una build distribuibile per iOS o Android:

```bash
# Per iOS
npx eas build --platform ios

# Per Android
npx eas build --platform android
```

## Note di sviluppo

- L'app utilizza React Query per la gestione dei dati e delle richieste API
- La navigazione è implementata con React Navigation
- Il tema dell'app si adatta automaticamente alle preferenze del dispositivo
- Le operazioni di autenticazione utilizzano il secure storage di Expo
- Le notifiche real-time utilizzano WebSocket