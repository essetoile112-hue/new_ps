// MQ-5 + DHT22 + ESP32 -> Firebase (OPTIMISÉ)
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHTesp.h>

#define WIFI_SSID "ooredoo-6CF1A5"
#define WIFI_PASSWORD "9B300CE7Cm!00"
#define FIREBASE_DB_URL "https://u4-green-africa-default-rtdb.europe-west1.firebasedatabase.app/"
#define FIREBASE_AUTH_LEGACY "AIzaSyDkOrC-I0Vg8T_zI0ESKrzJkIglJBZUbIE"

const int PIN_DIGITAL = 26;
const int PIN_ANALOG = 34;
const int PIN_DHT = 14;

int valeurAnalogique = 0;
int valeurRepos = 0;
bool gazDetecte = false;
float tension = 0.0;
float pourcentage = 0.0;

DHTesp dht;
FirebaseData firebaseData;
FirebaseConfig firebaseConfig;
FirebaseAuth firebaseAuth;

void setup() {
  Serial.begin(115200);
  delay(500);
  
  Serial.println("\n\n=== MQ-5 + DHT22 Initialization ===");
  
  pinMode(PIN_DIGITAL, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_ANALOG, ADC_11db);

  // WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " ✓" : " ✗");

  // Firebase
  Serial.println("Initializing Firebase...");
  firebaseConfig.database_url = FIREBASE_DB_URL;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH_LEGACY;
  Firebase.begin(&firebaseConfig, &firebaseAuth);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase initialized ✓");

  // DHT
  Serial.println("Initializing DHT22...");
  dht.setup(PIN_DHT, DHTesp::DHT22);
  delay(2000);

  // Calibration - measure baseline in clean air
  Serial.println("Calibration: Measuring baseline (clean air)...");
  long somme = 0;
  for (int i = 0; i < 20; i++) {
    somme += analogRead(PIN_ANALOG);
    delay(250);
    if (i % 5 == 0) Serial.print(".");
  }
  valeurRepos = somme / 20;
  Serial.printf("\n✓ Baseline (valeurRepos): %d\n\n", valeurRepos);

  if (WiFi.status() == WL_CONNECTED) {
    Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/valeur_repos", valeurRepos);
    Serial.println("Baseline stored to Firebase ✓\n");
  }

  Serial.println("=== Ready for monitoring ===\n");
}

void loop() {
  // Read analog and digital values
  valeurAnalogique = analogRead(PIN_ANALOG);
  tension = (valeurAnalogique / 4095.0f) * 3.3f;
  
  // Concentration relative = delta from baseline (represents detected gas level)
  int delta = max(0, valeurAnalogique - valeurRepos);
  pourcentage = (delta / 4095.0f) * 100.0f;  // Scale delta to 0-100%

  // Read DHT22
  float temperature = dht.getTemperature();
  float humidity = dht.getHumidity();

  // Gas detection: analog above baseline + 100 (digital pin disabled due to floating issue)
  gazDetecte = (valeurAnalogique > (valeurRepos + 100));

  // Serial monitoring
  Serial.printf("Raw: %d  Baseline: %d  Delta: %d  Vout: %.2fV  %%: %.1f%%  Digital: %s  Gas: %s  Temp: %.1f°C  Hum: %.1f%%\n",
    valeurAnalogique, valeurRepos, (valeurAnalogique - valeurRepos), tension, pourcentage,
    digitalRead(PIN_DIGITAL) == HIGH ? "HIGH" : "LOW",
    gazDetecte ? "YES ✓" : "no",
    temperature, humidity);

  // Send to Firebase
  if (WiFi.status() == WL_CONNECTED) {
    // DHT22 data (at root level)
    if (!isnan(temperature)) {
      Firebase.RTDB.setFloat(&firebaseData, "/dht/temperature", temperature);
    }
    if (!isnan(humidity)) {
      Firebase.RTDB.setFloat(&firebaseData, "/dht/humidity", humidity);
    }

    // MQ-5 data (under capteur_gaz)
    Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/valeur_analogique", valeurAnalogique);
    Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/valeur_repos", valeurRepos);  // Store baseline for reference
    Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/delta", valeurAnalogique - valeurRepos);  // Delta for easier debugging
    Firebase.RTDB.setFloat(&firebaseData, "/capteur_gaz/concentration_relative", pourcentage);
    Firebase.RTDB.setFloat(&firebaseData, "/capteur_gaz/tension_mesuree", tension);
    Firebase.RTDB.setBool(&firebaseData, "/capteur_gaz/gaz_detecte", gazDetecte);
    Firebase.RTDB.setInt(&firebaseData, "/capteur_gaz/timestamp", (long)millis());
    
    Serial.println("✓ Data uploaded");
  } else {
    Serial.println("✗ WiFi disconnected");
  }

  delay(1000);
}
