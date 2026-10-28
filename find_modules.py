import urllib.request
import json

# Download and parse all official TypingTest text files (Hard, Medium, Easy)
TEXT_FILES = {
    "hard": "https://www.typingtest.com/assets/testfiles/hardText.txt",
    "medium": "https://www.typingtest.com/assets/testfiles/mediumText.txt",
    "easy": "https://www.typingtest.com/assets/testfiles/easyText.txt"
}

all_database = {}

for level, url in TEXT_FILES.items():
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode('utf-8')
            paragraphs = [p.strip() for p in content.split('\n') if len(p.strip()) > 20]
            all_database[level] = paragraphs
            print(f"[OK] {level.upper()} text loaded: {len(paragraphs)} paragraphs ({len(content)} characters)")
    except Exception as e:
        print(f"[!] Error loading {level}: {e}")

# Save to unified database
with open('all_stories.json', 'w', encoding='utf-8') as f:
    json.dump(all_database, f, indent=2)

print("\nSaved all texts to all_stories.json!")

# Show sample of HARD text paragraphs
print("\n" + "="*50)
print("SAMPLE HARD TEXT STORIES:")
print("="*50)
for idx, p in enumerate(all_database.get("hard", [])[:5]):
    print(f"\n[{idx+1}] {p[:120]}...")
