#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include<SoftwareSerial.h>
const char* ssid = "ADITI 3483";
const char* password = "hello123";
WiFiClient client;

SoftwareSerial mySUART(4, 5);
void setup() {
    Serial.begin(9600);
    Serial.println("Connecting to WiFi...");
    
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
}

void loop() {
    if (Serial.available()) {
        String receivedData = Serial.readStringUntil('\n');
        receivedData.trim();
        
        Serial.print("Received from Arduino: ");
        Serial.println(receivedData);
        
        if (receivedData.startsWith("CHECKIN:")) {
            int id = receivedData.substring(8).toInt();
            sendHttpRequest("checkin", id);
        } else if (receivedData.startsWith("CHECKOUT:")) {
            int id = receivedData.substring(9).toInt();
            sendHttpRequest("checkout", id);
        } else if (receivedData == "ALERT") {
            sendHttpRequest("alert", 0);
        }
    }
}

void sendHttpRequest(String action, int id) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String url = "http://192.168.106.156:3000/" + action + "/" + String(id);
        
        Serial.print("Sending request: ");
        Serial.println(url);
        
        http.begin(client, url);
        int httpCode = http.GET();
        
        if (httpCode > 0) {
            Serial.println("HTTP Response: " + http.getString());
        } else {
            Serial.println("HTTP request failed!");
        }
        http.end();
    } else {
        Serial.println("WiFi Disconnected! Cannot send request.");
    }
}
