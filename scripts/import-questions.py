#!/usr/bin/env python3
"""
Questions Importer Script
Helps fetch and import questions from various sources
"""

import json
import requests
from datetime import datetime

SUPABASE_URL = "your-supabase-url"
SUPABASE_KEY = "your-supabase-anon-key"

# Sample questions to import
SAMPLE_QUESTIONS = [
    # Level 1 - Aptitude
    {
        "level": 1,
        "category": "Numbers",
        "question_text": "What is the sum of first 20 natural numbers?",
        "option_a": "200",
        "option_b": "210",
        "option_c": "220",
        "option_d": "190",
        "correct_option": 2,
        "difficulty": "Easy",
        "source": "Python Script"
    },
    {
        "level": 1,
        "category": "Percentage",
        "question_text": "If the price increases by 25%, what is the multiplier?",
        "option_a": "0.75",
        "option_b": "1.25",
        "option_c": "1.75",
        "option_d": "2.25",
        "correct_option": 2,
        "difficulty": "Easy",
        "source": "Python Script"
    },
    # Level 2 - Logical Reasoning
    {
        "level": 2,
        "category": "Series",
        "question_text": "3, 6, 12, 24, ?",
        "option_a": "36",
        "option_b": "42",
        "option_c": "48",
        "option_d": "50",
        "correct_option": 3,
        "difficulty": "Medium",
        "source": "Python Script"
    },
    # Level 3 - Coding
    {
        "level": 3,
        "category": "Algorithms",
        "question_text": "What is the time complexity of merge sort?",
        "option_a": "O(n)",
        "option_b": "O(n^2)",
        "option_c": "O(n log n)",
        "option_d": "O(log n)",
        "correct_option": 3,
        "difficulty": "Medium",
        "source": "Python Script"
    },
]

def import_questions_to_supabase():
    """Import questions to Supabase"""
    print("🚀 Starting questions import...")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    
    url = f"{SUPABASE_URL}/rest/v1/questions"
    
    try:
        response = requests.post(
            url,
            json=SAMPLE_QUESTIONS,
            headers=headers
        )
        
        if response.status_code == 201:
            print(f"✅ Successfully imported {len(SAMPLE_QUESTIONS)} questions!")
            print(response.json())
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def get_questions_from_db():
    """Fetch questions from database"""
    print("📚 Fetching questions from database...")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    
    url = f"{SUPABASE_URL}/rest/v1/questions"
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            questions = response.json()
            print(f"\n✅ Found {len(questions)} total questions")
            
            # Group by level
            by_level = {}
            for q in questions:
                level = q['level']
                by_level[level] = by_level.get(level, 0) + 1
            
            for level in sorted(by_level.keys()):
                print(f"   Level {level}: {by_level[level]} questions")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def export_questions_to_csv():
    """Export questions to CSV format"""
    print("📊 Exporting questions to CSV...")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    
    url = f"{SUPABASE_URL}/rest/v1/questions"
    
    try:
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            questions = response.json()
            
            # Create CSV
            csv_content = "level,category,question,option_a,option_b,option_c,option_d,correct_option,difficulty\n"
            
            for q in questions:
                csv_content += f"{q['level']},{q['category']},\"{q['question_text']}\",\"{q['option_a']}\",\"{q['option_b']}\",\"{q['option_c']}\",\"{q['option_d']}\",{q['correct_option']},{q['difficulty']}\n"
            
            # Save to file
            filename = f"questions_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(csv_content)
            
            print(f"✅ Exported to {filename}")
        else:
            print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """Main menu"""
    print("""
    ╔════════════════════════════════════════╗
    ║  DRIVE 2.0 - Questions Importer        ║
    ╚════════════════════════════════════════╝
    
    1. Import sample questions
    2. View all questions
    3. Export questions to CSV
    4. Exit
    """)
    
    choice = input("Choose an option (1-4): ").strip()
    
    if choice == "1":
        import_questions_to_supabase()
    elif choice == "2":
        get_questions_from_db()
    elif choice == "3":
        export_questions_to_csv()
    elif choice == "4":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid option!")

if __name__ == "__main__":
    print("⚠️  First, update SUPABASE_URL and SUPABASE_KEY in this script!")
    print("You can find them in your Supabase project settings.\n")
    
    # Uncomment after updating credentials
    # main()
