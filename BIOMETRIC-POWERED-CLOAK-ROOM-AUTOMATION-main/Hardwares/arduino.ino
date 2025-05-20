#include <SoftwareSerial.h>
#include <Adafruit_Fingerprint.h>
#include <Arduino.h>

#define IR_LED_PIN 6
#define TSOP_PIN 7
#define FP_RX 2
#define FP_TX 3
#define TIMEOUT 5000
#if (defined(__AVR__) || defined(ESP8266)) && !defined(__AVR_ATmega2560__)
// For UNO and others without hardware serial, we must use software serial...
// pin #2 is IN from sensor (GREEN wire)
// pin #3 is OUT from arduino  (WHITE wire)
// Set up the serial port to use softwareserial..
SoftwareSerial mySerial(2, 3);

#else
// On Leonardo/M0/etc, others with hardware serial, use hardware serial!
// #0 is green wire, #1 is white
#define mySerial Serial1
#endif

Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
SoftwareSerial espSerial(10, 11);  // TX = 10, RX = 11 (connect to ESP8266)

bool rackState = LOW;
unsigned long startTime;
bool authenticationSuccess = false;

void setup() {
    Serial.begin(9600);
    //mySerial.begin(9600);
    espSerial.begin(9600);  // Communicate with ESP8266

    pinMode(TSOP_PIN, INPUT);
    pinMode(IR_LED_PIN, OUTPUT);
    
    finger.begin(57600);
    delay(5);
    if (finger.verifyPassword()) {
        Serial.println("Fingerprint sensor detected!");
    } else {
        Serial.println("Fingerprint sensor NOT detected!");
    }

    start38kHzPWM();
}

void loop() {
  while (digitalRead(TSOP_PIN) == rackState) ;

    rackState = !rackState;
    Serial.println(rackState ? "Bag placed" : "Bag removed");

    startTime = millis();
    authenticationSuccess = false;
    
    Serial.println("Waiting for fingerprint...");
    while (millis() - startTime < TIMEOUT) {
        int fpID = getFingerprintID();
        if (fpID > 0) {
            authenticationSuccess = true;
            sendToESP(rackState ? "CHECKIN:" : "CHECKOUT:", fpID);
            break;
        }
    }

    if (!authenticationSuccess) {
        Serial.println("Authentication failed! Sending alert...");
        sendToESP("ALERT", 0);
    }
}

void start38kHzPWM() {
    tone(IR_LED_PIN, 38000); // Generate 38kHz signal on IR LED
}

int getFingerprintID() {
    uint8_t p = finger.getImage();
    if (p != FINGERPRINT_OK) return -1;
    
    p = finger.image2Tz();
    if (p != FINGERPRINT_OK) return -1;

    p = finger.fingerFastSearch();
    if (p != FINGERPRINT_OK) {
        Serial.println("Fingerprint not found");
        return -1;
    }

    Serial.print("Fingerprint found, ID: ");
    Serial.println(finger.fingerID);
    return finger.fingerID;
}

void sendToESP(String action, int id) {
    String message = action + String(id);
    espSerial.println(message);
    Serial.print("Sent to ESP8266: ");
    Serial.println(message);
}
