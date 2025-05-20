import sqlite3
import time
from datetime import datetime

# Database setup
def setup_database():
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS cloakroom (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        check_in_time TEXT,
                        check_out_time TEXT,
                        check_in_date TEXT,
                        duration TEXT)
                   ''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS visitors (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER,
                        name TEXT,
                        check_in_time TEXT,
                        check_out_time TEXT,
                        check_in_date TEXT,
                        duration TEXT)
                   ''')
    conn.commit()
    conn.close()

# Function to log check-in
def check_in(user_id, name):
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    check_in_time = datetime.now().strftime("%H:%M:%S")
    check_in_date = datetime.now().strftime("%Y-%m-%d")

    # Check if the user is already checked in
    cursor.execute("SELECT * FROM cloakroom WHERE user_id=? AND check_out_time IS NULL", (user_id,))
    if cursor.fetchone():
        print(f"User {user_id} ({name}) is already checked in!")
    else:
        cursor.execute("INSERT INTO cloakroom (user_id, check_in_time, check_in_date) VALUES (?, ?, ?)", 
                       (user_id, check_in_time, check_in_date))
        cursor.execute("INSERT INTO visitors (user_id, name, check_in_time, check_in_date) VALUES (?, ?, ?, ?)", 
                       (user_id, name, check_in_time, check_in_date))
        conn.commit()
        print(f"User {user_id} ({name}) checked in at {check_in_time} on {check_in_date}")
    conn.close()

# Function to log check-out
def check_out(user_id):
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    check_out_time = datetime.now().strftime("%H:%M:%S")

    cursor.execute("SELECT check_in_time, check_in_date FROM cloakroom WHERE user_id=? AND check_out_time IS NULL", (user_id,))
    record = cursor.fetchone()
    
    if record:
        check_in_time, check_in_date = record
        format_str = "%H:%M:%S"
        duration = str(datetime.strptime(check_out_time, format_str) - datetime.strptime(check_in_time, format_str))

        cursor.execute("UPDATE cloakroom SET check_out_time=?, duration=? WHERE user_id=? AND check_out_time IS NULL", 
                       (check_out_time, duration, user_id))
        cursor.execute("UPDATE visitors SET check_out_time=?, duration=? WHERE user_id=? AND check_out_time IS NULL", 
                       (check_out_time, duration, user_id))
        conn.commit()
        print(f"User {user_id} checked out at {check_out_time}. Duration: {duration}")
    else:
        print("No check-in record found for this user.")
    
    conn.close()

# Function to analyze visitor trends
def visitor_trends():
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    cursor.execute("SELECT check_in_time, check_in_date FROM visitors")
    records = cursor.fetchall()
    print("\nVisitor Trends (Peak Hours and Busiest Days):")
    for record in records:
        print(record)
    conn.close()

# Function to analyze duration
def duration_analysis():
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, duration FROM visitors")
    records = cursor.fetchall()
    print("\nDuration Analysis (Average Stay Time):")
    for record in records:
        print(record)
    conn.close()

# Function to find frequent visitors
def frequent_visitors():
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, COUNT(user_id) FROM visitors GROUP BY user_id ORDER BY COUNT(user_id) DESC")
    records = cursor.fetchall()
    print("\nFrequent Visitors:")
    for record in records:
        print(record)
    conn.close()

# Function to track security logs
def security_logs():
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM visitors")
    records = cursor.fetchall()
    print("\nSecurity Logs:")
    for record in records:
        print(record)
    conn.close()

# Function for capacity management
def capacity_management():
    conn = sqlite3.connect("cloakroom.db")
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM visitors WHERE check_out_time IS NULL")
    count = cursor.fetchone()[0]
    print(f"\nCurrent number of people in cloakroom: {count}")
    conn.close()

# Initialize the database
setup_database()

# Continuous input loop
if __name__ == "__main__":
    while True:
        user_id = input("\nEnter fingerprint ID (or type 'exit' to quit): ").strip()
        if user_id.lower() == "exit":
            print("Exiting system.")
            break

        if not user_id.isdigit():
            print("Invalid input. Please enter a numeric fingerprint ID.")
            continue
        
        user_id = int(user_id)
        action = input("Enter 'in' to check-in, 'out' to check-out, or 'report' for analytics: ").strip().lower()
        
        if action == "in":
            name = input("Enter name: ")
            check_in(user_id, name)
        elif action == "out":
            check_out(user_id)
        elif action == "report":
            visitor_trends()
            duration_analysis()
            frequent_visitors()
            security_logs()
            capacity_management()
        else:
            print("Invalid action. Please enter 'in', 'out', or 'report'.")