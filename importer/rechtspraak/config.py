"""Configuration constants for the Rechtspraak importer."""

import os
from pathlib import Path

# API endpoints
BASE_URL = "https://data.rechtspraak.nl"
SEARCH_URL = f"{BASE_URL}/uitspraken/zoeken"
CONTENT_URL = f"{BASE_URL}/uitspraken/content"
IMAGE_URL = f"{BASE_URL}/uitspraken/image"

# Value list URLs
VALUE_LISTS_URL = "https://www.rechtspraak.nl/Uitspraken/Paginas/Open-Data.aspx"

# XML Namespaces
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "dcterms": "http://purl.org/dc/terms/",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "psi": "http://psi.rechtspraak.nl/",
    "ecli": "https://e-justice.europa.eu/ecli",
    "owms": "http://standaarden.overheid.nl/owms/terms/",
    "rs": "http://www.rechtspraak.nl/schema/rechtspraak-1.0",
}

# Rate limiting
MAX_CONCURRENT_REQUESTS = 8
REQUESTS_PER_SECOND = 12.0
REQUEST_TIMEOUT = 30.0
MAX_RETRY_ATTEMPTS = 3

# Pagination
MAX_RESULTS_PER_PAGE = 1000

# Database
DATA_DIR = Path(os.environ.get("RECHTSPRAAK_DATA_DIR", Path(__file__).parent.parent.parent / "data"))
DB_PATH = DATA_DIR / "rechtspraak.db"

# Import defaults
DEFAULT_BATCH_SIZE = 200
COMMIT_EVERY = 500
