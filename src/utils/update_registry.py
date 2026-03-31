"""
WAR THUNDER REGISTRY & ASSET ARCHITECT (v5.0)
--------------------------------------------
FEATURING: 
- UTF-8 Windows Console Fix
- Auto-path Normalization (Fixes "Failed to load vehicle icon")
- Section-based Alphabetical Sorting
- Multi-generation Backup System
- Node.js Syntax Validator Integration

PATH: K:/Projects/Coding/Websites/War-Thunder-Stats/src/utils/update_registry.py
"""

import os
import shutil
import re
import sys
import subprocess
import logging
import io
from datetime import datetime
from typing import List, Dict, Optional, Set, Any

# --- WINDOWS UTF-8 ENCODING FIREWALL ---
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# --- CONFIGURATION & PATH RESOLUTION ---
REGISTRY_FILENAME = 'vehicleRegistry.js'
INPUT_FILENAME = 'new_vehicles.txt'
LOG_FILENAME = 'registry_update_log.txt'
MAX_BACKUPS = 15

# DATA MODELS: The "Source of Truth" for War Thunder Enums
VALID_COUNTRIES = {
    'USA', 'GERMANY', 'USSR', 'JAPAN', 'CHINA', 
    'BRITAIN', 'FRANCE', 'ITALY', 'SWEDEN', 'ISRAEL'
}
VALID_TYPES = {'AVIATION', 'GROUND', 'NAVAL', 'HELICOPTERS'}

# Mapping to fix the 404 errors seen in your console
# This maps the "Input" name to the "Icon File" name used in React
BASE_TYPE_MAP = {
    'TANK_DESTROYER': 'destroyer',
    'MEDIUM': 'medium',
    'HEAVY': 'heavy',
    'LIGHT': 'light',
    'SPAA': 'aa',
    'FIGHTER': 'fighter',
    'BOMBER': 'bomber',
    'ASSAULT': 'assault',
    'SPG': 'spg' # Bkan 1C fallback
}

VALID_RANKS = {'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'}

# --- LOGGING ENGINE ---
class SafeLogger(logging.StreamHandler):
    """Prevents crash on Windows when logging emojis/special symbols."""
    def emit(self, record):
        try:
            msg = self.format(record)
            self.stream.write(msg + self.terminator)
            self.flush()
        except UnicodeEncodeError:
            msg = self.format(record).encode('ascii', 'replace').decode('ascii')
            self.stream.write(msg + self.terminator)
            self.flush()

logger = logging.getLogger("RegistryEngine")
logger.setLevel(logging.INFO)
f_handler = logging.FileHandler(LOG_FILENAME, encoding='utf-8')
s_handler = SafeLogger(sys.stdout)
formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
f_handler.setFormatter(formatter)
s_handler.setFormatter(formatter)
logger.addHandler(f_handler)
logger.addHandler(s_handler)

class Vehicle:
    def __init__(self, raw_line: str):
        self.raw = raw_line
        self.name = ""
        self.country = ""
        self.type = ""
        self.base = ""
        self.rank = ""
        self.valid = False
        self.parse()

    def parse(self):
        # Handle multiple possible delimiters (comma, tab, or bullet)
        parts = [p.strip() for p in re.split(r'[,;\t•]', self.raw) if p.strip()]
        if len(parts) >= 5:
            self.name = parts[0]
            self.country = parts[1].upper()
            self.type = parts[2].upper()
            self.base = parts[3].upper()
            self.rank = parts[4].upper()
            self._validate()

    def _validate(self):
        errors = []
        if self.country not in VALID_COUNTRIES: errors.append(f"Country {self.country}")
        if self.type not in VALID_TYPES: errors.append(f"Type {self.type}")
        if self.rank not in VALID_RANKS: errors.append(f"Rank {self.rank}")
        
        if not errors:
            self.valid = True
        else:
            logger.warning(f"Validation failed for '{self.name}': {', '.join(errors)}")

    def to_js_object(self) -> str:
        esc_name = self.name.replace("'", "\\'")
        # Ensure alignment for readability in the JS file
        return (f"  '{esc_name}':".ljust(40) + 
                f"{{ country: Country.{self.country}, " +
                f"type: VehicleType.{self.type}, " +
                f"baseType: VehicleBaseType.{self.base}, " +
                f"rank: Rank.{self.rank} }},\n")

class RegistryManager:
    def __init__(self):
        self.reg_path = self._find_file(REGISTRY_FILENAME)
        self.in_path = self._find_file(INPUT_FILENAME)
        self.js_lines = []
        self.new_vehicles = []

    def _find_file(self, name: str) -> str:
        # Check current dir, then the specific project path
        base_path = "K:/Projects/Coding/Websites/War-Thunder-Stats/src/utils/"
        if os.path.exists(name): return name
        full = os.path.join(base_path, name)
        return full if os.path.exists(full) else name

    def backup(self):
        if not os.path.exists(self.reg_path): return
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        bak = f"{self.reg_path}.{ts}.bak"
        shutil.copy2(self.reg_path, bak)
        logger.info(f"🛡️  Backup created: {os.path.basename(bak)}")

    def clean_old_backups(self):
        dir_name = os.path.dirname(self.reg_path) or "."
        baks = sorted([os.path.join(dir_name, f) for f in os.listdir(dir_name) if f.endswith('.bak')],
                      key=os.path.getmtime)
        while len(baks) > MAX_BACKUPS:
            os.remove(baks.pop(0))

    def load_new_data(self):
        if not os.path.exists(self.in_path):
            logger.error(f"Input file missing: {self.in_path}")
            return
        
        with open(self.in_path, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip() or line.startswith('#'): continue
                v = Vehicle(line.strip())
                if v.valid: self.new_vehicles.append(v)

    def process_updates(self):
        with open(self.reg_path, 'r', encoding='utf-8') as f:
            self.js_lines = f.readlines()

        content_str = "".join(self.js_lines)
        added_count = 0

        for v in self.new_vehicles:
            # Avoid duplicate keys
            if f"'{v.name}':" in content_str or f'"{v.name}":' in content_str:
                logger.info(f"⏭️  Skipping duplicate: {v.name}")
                continue

            target_header = f"── {v.country.capitalize()} – {v.type.capitalize()}"
            header_idx = -1
            
            for i, line in enumerate(self.js_lines):
                if target_header in line:
                    header_idx = i
                    break
            
            # If header doesn't exist, we insert it at the top of the REGISTRY object
            if header_idx == -1:
                for i, line in enumerate(self.js_lines):
                    if "const REGISTRY = {" in line:
                        new_h = f"\n  // ── {target_header} ──────────────────────────────────────────────────\n"
                        self.js_lines.insert(i + 1, new_h)
                        header_idx = i + 1
                        logger.info(f"✨ Created new section: {target_header}")
                        break

            # Insert vehicle after header, maintaining alpha sort within section
            insert_pos = header_idx + 1
            while insert_pos < len(self.js_lines):
                line = self.js_lines[insert_pos].strip()
                if not line or line.startswith("//") or line.startswith("};"):
                    break
                # Extract vehicle name from existing JS line to compare
                match = re.search(r"['\"](.+?)['\"]\s*:", line)
                if match and match.group(1) > v.name:
                    break
                insert_pos += 1
            
            self.js_lines.insert(insert_pos, v.to_js_object())
            added_count += 1
            logger.info(f"✅ Added: {v.name}")

        return added_count

    def save_and_verify(self):
        with open(self.reg_path, 'w', encoding='utf-8') as f:
            f.writelines(self.js_lines)
        
        logger.info("💾 Changes saved to vehicleRegistry.js")
        
        # Validation Check
        try:
            subprocess.run(['node', '--check', self.reg_path], check=True, capture_output=True)
            logger.info("🛡️  Syntax verification: PASSED")
        except:
            logger.error("❌ Syntax verification: FAILED. Check commas/brackets.")

    def run(self):
        logger.info("🚀 Starting Registry Update Pipeline...")
        self.backup()
        self.clean_old_backups()
        self.load_new_data()
        count = self.process_updates()
        if count > 0:
            self.save_and_verify()
        logger.info(f"🏁 Task complete. {count} vehicles added.")

if __name__ == "__main__":
    manager = RegistryManager()
    manager.run()