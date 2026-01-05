// Test du capteur de gaz MQ-5 avec ESP32 et Firebase
// Connexions:
// VCC du MQ-5 -> VIN ou 3V3 (si ton module supporte 3.3V)
// GND du MQ-5 -> GND de l'ESP32
// DO du MQ-5 -> GPIO 26 (D26)
// AO du MQ-5 -> GPIO 34

#include <WiFi.h>
#include <Firebase_ESP32_Client.h>
#include <ArduinoJson.h>
#include <DHTesp.h>

// Configuration WiFi
#define WIFI_SSID "TOPNET_LNPH"
#define WIFI_PASSWORD "99499283"

// Configuration Firebase
#define FIREBASE_HOST "u4-green-africa-default-rtdb.europe-west1.firebasedatabase.app"
#define FIREBASE_AUTH "AIzaSyDkOrC-I0Vg8T_zI0ESKrzJkIglJBZUbIE"

// Définition des pins
const int PIN_DIGITAL = 26;  // Pin digitale (DO)
const int PIN_ANALOG = 34;   // Pin analogique (AO)
const int PIN_DHT = 14;      // DHT22 (AM2302) data pin connected to G14 (GPIO14)

// Variables
int valeurDigitale;
int valeurAnalogique;
int valeurRepos = 0;
bool calibre = false;
float tension;
float pourcentage;
bool gazDetecte = false;

// Objets Firebase
FirebaseData firebaseData;
FirebaseConfig firebaseConfig;
FirebaseAuth firebaseAuth;
DHTesp dht;

void setup() {
  Serial.begin(115200);
  
  // Configuration des pins
  pinMode(PIN_DIGITAL, INPUT);
  // ADC pins do not require pinMode; set ADC resolution and attenuation for stable readings
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_ANALOG, ADC_11db);
  
  Serial.println("=================================");
  Serial.println("Test du capteur de gaz MQ-5");
  Serial.println("avec Firebase Realtime Database");
  Serial.println("=================================");
  
  // Connexion WiFi
  Serial.print("Connexion WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connecté! IP: ");
  Serial.println(WiFi.localIP());
  
  // Configuration Firebase (Mobizt Firebase_ESP32_Client)
  // Use database_url; legacy token must be a Realtime Database secret (not an API key).
  // If you don't have a legacy secret, either make the DB public for quick testing or configure a service account.
  // firebaseConfig.host is optional for Mobizt client and can be omitted.
  // also set database_url expected by the client (with https:// and trailing slash)
  firebaseConfig.database_url = "https://u4-green-africa-default-rtdb.europe-west1.firebasedatabase.app/";
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH; // ensure this is a DB legacy secret

  Firebase.begin(&firebaseConfig, &firebaseAuth);
  Firebase.reconnectWiFi(true);
  
  Serial.println("Firebase connecté!");
  Serial.println();

  // Initialiser le capteur DHT22 (AM2302)
  dht.setup(PIN_DHT, DHTesp::DHT22);
  
  // Calibration
  Serial.println("Préchauffage et calibration...");
  Serial.println("Attendez 5 secondes sans gaz");
  delay(2000);
  
  long somme = 0;
  for (int i = 0; i < 20; i++) {
    somme += analogRead(PIN_ANALOG);
    delay(250);
  }
  valeurRepos = somme / 20;
  
  Serial.print("Calibration terminée. Valeur de repos: ");
  Serial.println(valeurRepos);
  Serial.println("Détection prête!");
  Serial.println();
  
  calibre = true;
  
  // Initialiser les valeurs dans Firebase (Realtime Database)
  if (WiFi.status() == WL_CONNECTED) {
    if (!Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/valeur_repos", valeurRepos)) {
      Serial.print("Erreur init valeur_repos: ");
      Serial.println(firebaseData.errorReason());
    }
  } else {
    Serial.println("WiFi non connecté — valeur_repos non envoyée");
  }
}

void loop() {
  // Lecture des capteurs
  valeurDigitale = digitalRead(PIN_DIGITAL);
  valeurAnalogique = analogRead(PIN_ANALOG);
  tension = (valeurAnalogique / 4095.0) * 3.3;
  pourcentage = (valeurAnalogique / 4095.0) * 100.0;

  // Lecture DHT
  float temperature = dht.getTemperature();
  float humidity = dht.getHumidity();
  
  // Détection de gaz
  gazDetecte = false;

  if (calibre) {
    if (valeurAnalogique > (valeurRepos + 100)) {
      gazDetecte = true;
    }
  }

  if (valeurDigitale == HIGH) {
    gazDetecte = true;
  }
  
  // Affichage dans le moniteur série
  Serial.println("--- Lecture du capteur MQ-5 ---");
  
  if (gazDetecte) {
    Serial.println("🚨 GAZ DÉTECTÉ! 🚨");
  } else {
    Serial.println("✓ Pas de gaz");
  }
  
  Serial.println();
  Serial.print("Sortie Digitale (DO): ");
  Serial.println(valeurDigitale == HIGH ? "HIGH" : "LOW");
  
  Serial.print("Sortie Analogique (AO): ");
  Serial.print(valeurAnalogique);
  Serial.print(" / 4095 (");
  Serial.print(tension, 2);
  Serial.print(" V) [Repos: ");
  Serial.print(valeurRepos);
  Serial.println("]");
  
  Serial.print("Concentration relative: ");
  Serial.print(pourcentage, 1);
  Serial.println(" %");
  Serial.println();
  
  // Envoi des données vers Firebase (only if WiFi connected)
  Serial.println("Envoi vers Firebase...");
  if (WiFi.status() == WL_CONNECTED) {
    // DHT: only send if readings valid
    if (!isnan(temperature)) {
      if (Firebase.RTDB.setFloat(&firebaseData, "/capteur_gaz/dht/temperature", temperature)) {
        Serial.println("✓ temperature envoyee");
      } else {
        Serial.print("✗ Erreur temperature: ");
        Serial.println(firebaseData.errorReason());
      }
    } else {
      Serial.println("Lecture temperature invalide, non envoyee");
    }

    if (!isnan(humidity)) {
      if (Firebase.RTDB.setFloat(&firebaseData, "/capteur_gaz/dht/humidity", humidity)) {
        Serial.println("✓ humidity envoyee");
      } else {
        Serial.print("✗ Erreur humidity: ");
        Serial.println(firebaseData.errorReason());
      }
    } else {
      Serial.println("Lecture humidity invalide, non envoyee");
    }

    // MQ-5
    if (Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/valeur_analogique", valeurAnalogique)) {
      Serial.println("✓ valeur_analogique envoyee");
    } else {
      Serial.print("✗ Erreur valeur_analogique: ");
      Serial.println(firebaseData.errorReason());
    }

    if (Firebase.RTDB.setFloat(&firebaseData, "/capteur_gaz/tension_mesuree", tensionMesuree)) {
      Serial.println("✓ tension_mesuree envoyee");
    } else {
      Serial.print("✗ Erreur tension_mesuree: ");
      Serial.println(firebaseData.errorReason());
    }

    if (MQ5_POWER_5V) {
      if (Firebase.RTDB.setFloat(&firebaseData, "/capteur_gaz/tension_capteur", tensionCapteur)) {
        Serial.println("✓ tension_capteur envoyee");
      } else {
        Serial.print("✗ Erreur tension_capteur: ");
        Serial.println(firebaseData.errorReason());
      }
    }

    if (Firebase.RTDB.setFloat(&firebaseData, "/capteur_gaz/concentration_relative", pourcentage)) {
      Serial.println("✓ concentration envoyee");
    } else {
      Serial.print("✗ Erreur concentration: ");
      Serial.println(firebaseData.errorReason());
    }

    if (Firebase.RTDB.setBool(&firebaseData, "/capteur_gaz/gaz_detecte", gazDetecte)) {
      Serial.println("✓ gaz_detecte envoyee");
    } else {
      Serial.print("✗ Erreur gaz_detecte: ");
      Serial.println(firebaseData.errorReason());
    }

    if (Firebase.RTDB.setBool(&firebaseData, "/capteur_gaz/sortie_digitale", valeurDigitale == HIGH)) {
      Serial.println("✓ sortie_digitale envoyee");
    } else {
      Serial.print("✗ Erreur sortie_digitale: ");
      Serial.println(firebaseData.errorReason());
    }

    if (Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/timestamp", (long)millis())) {
      Serial.println("✓ timestamp envoye");
    } else {
      Serial.print("✗ Erreur timestamp: ");
      Serial.println(firebaseData.errorReason());
    }
  } else {
    Serial.println("WiFi non connecté — saut envoi Firebase");
  }

  Serial.println("--- Fin envoi Firebase ---");
  Serial.println();

  delay(1000); // cadence d'envoi
}
