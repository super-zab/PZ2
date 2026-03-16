#!/usr/bin/env python3
"""
Script de synchronisation des photos depuis Google Drive
et génération automatique des données de voyage.
"""

import os
import json
import shutil
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

# Configuration Google Drive
# on purpose use an absolute path relative to the script file so that
# the script works no matter which directory you run it from.
BASE_DIR = Path(__file__).parent
SERVICE_ACCOUNT_FILE = BASE_DIR / 'service_account.json'  # À créer depuis Google Cloud Console
DRIVE_FOLDER_ID = '148-HlnJmJV-BAaevBSLhzUep-81GESX9'  # Votre dossier partagé

# Dégradés de couleurs par continent
CONTINENT_COLORS = {
    'Europe': [
        "#FF6B6B", "#FF8E8E", "#FFB1B1", "#FFD4D4",  # Rouges
        "#FF9AA2", "#FFB7B2", "#FFD4C4", "#FFE6D9"
    ],
    'Asia': [
        "#4ECDC4", "#67D5B5", "#80DEA8", "#9BE69E",  # Bleu-vert
        "#B4EEB4", "#CFF7C9", "#E9FFE1", "#F5FFF7"
    ],
    'Africa': [
        "#FFA07A", "#FFB380", "#FFC689", "#FFD995",  # Oranges
        "#FFE8A1", "#FFF1AD", "#FFF8B8", "#FFFFC4"
    ],
    'North America': [
        "#9B59B6", "#A876C1", "#B593CC", "#C2B0D7",  # Violets
        "#CFCCE3", "#DCE0EB", "#E9E5F5", "#F2E8FF"
    ],
    'South America': [
        "#2ECC71", "#48D682", "#62E093", "#7CEAA4",  # Verts
        "#96F4B5", "#B0FEC6", "#CAFFD7", "#E4FFE8"
    ],
    'Oceania': [
        "#3498DB", "#5DADE2", "#85C1E9", "#AED6F1",  # Bleus
        "#D6EAF8", "#EBF5FB", "#F0F8FF", "#F8FDFF"
    ],
    'USA States': [
        "#E74C3C", "#EC7063", "#F1948A", "#F5B7B1",  # Rouges USA
        "#F8C9C4", "#FADBD8", "#FCEEEB", "#FFF5F7"
    ]
}

# Mapping pays → continent
COUNTRY_CONTINENT = {
    # Europe
    'France': 'Europe', 'Espagne': 'Europe', 'Italie': 'Europe',
    'Allemagne': 'Europe', 'Royaume-Uni': 'Europe', 'Portugal': 'Europe',
    'Grèce': 'Europe', 'Pays-Bas': 'Europe', 'Belgique': 'Europe',
    
    # Asie
    'Japon': 'Asia', 'Chine': 'Asia', 'Thaïlande': 'Asia',
    'Inde': 'Asia', 'Corée du Sud': 'Asia', 'Vietnam': 'Asia',
    
    # Afrique
    'Maroc': 'Africa', 'Égypte': 'Africa', 'Afrique du Sud': 'Africa',
    'Kenya': 'Africa', 'Tunisie': 'Africa',
    
    # Amérique du Nord
    'Canada': 'North America', 'Mexique': 'North America',
    
    # Amérique du Sud
    'Brésil': 'South America', 'Argentine': 'South America',
    'Pérou': 'South America', 'Chili': 'South America',
    
    # Océanie
    'Australie': 'Oceania', 'Nouvelle-Zélande': 'Oceania',
    
    # États USA (à traiter séparément)
    'Californie': 'USA States', 'New York': 'USA States',
    'Floride': 'USA States', 'Texas': 'USA States',
    'Hawaï': 'USA States'
}

# États des USA avec leurs coordonnées
USA_STATES = {
    'Californie': {'iso': 'US-CA', 'coords': [36.7783, -119.4179]},
    'New York': {'iso': 'US-NY', 'coords': [43.2994, -74.2179]},
    'Floride': {'iso': 'US-FL', 'coords': [27.6648, -81.5158]},
    'Texas': {'iso': 'US-TX', 'coords': [31.9686, -99.9018]},
    'Hawaï': {'iso': 'US-HI', 'coords': [19.8968, -155.5828]},
    'Nevada': {'iso': 'US-NV', 'coords': [38.8026, -116.4194]},
    'Colorado': {'iso': 'US-CO', 'coords': [39.0598, -105.3111]},
    'Illinois': {'iso': 'US-IL', 'coords': [40.6331, -89.3985]}
}

def _normalized_name(filename: str) -> str:
    """Remplace l'extension .HEIC/.HEIF par .jpg (les navigateurs ne supportent pas HEIC)."""
    p = Path(filename)
    if p.suffix.lower() in ('.heic', '.heif'):
        return p.stem + '.jpg'
    return filename


def _convert_heic_if_needed(file_path: Path) -> Path:
    """Convertit un fichier HEIC/HEIF en JPEG si pillow-heif est installé.

    Installation : pip install Pillow pillow-heif
    Retourne le chemin final (converti ou original).
    """
    if file_path.suffix.lower() not in ('.heic', '.heif'):
        return file_path
    jpg_path = file_path.with_suffix('.jpg')
    try:
        import pillow_heif
        from PIL import Image
        pillow_heif.register_heif_opener()
        img = Image.open(file_path)
        img.save(jpg_path, 'JPEG', quality=88)
        file_path.unlink()
        return jpg_path
    except ImportError:
        print("  ⚠ pillow-heif non installé : HEIC conservé (pip install pillow-heif pour convertir)")
        return file_path
    except Exception as e:
        print(f"  ⚠ Conversion échouée pour {file_path.name} : {e}")
        return file_path


def get_coordinates(iso_code):
    """Retourne des coordonnées approximatives pour un code ISO alpha-3."""
    coords_map = {
        'FRA': [46.6034, 1.8883], 'ESP': [40.4637, -3.7492], 'ITA': [41.8719, 12.5674],
        'DEU': [51.1657, 10.4515], 'GBR': [55.3781, -3.4360], 'PRT': [39.3999, -8.2245],
        'GRC': [39.0742, 21.8243], 'NLD': [52.1326, 5.2913], 'BEL': [50.5039, 4.4699],
        'POL': [51.9194, 19.1451], 'ROU': [45.9432, 24.9668], 'CHE': [46.8182, 8.2275],
        'AUT': [47.5162, 14.5501], 'SWE': [60.1282, 18.6435], 'NOR': [60.4720, 8.4689],
        'FIN': [61.9241, 25.7482], 'DNK': [56.2639, 9.5018], 'IRL': [53.1424, -7.6921],
        'JPN': [36.2048, 138.2529], 'CHN': [35.8617, 104.1954], 'THA': [15.8700, 100.9925],
        'IND': [20.5937, 78.9629], 'KOR': [35.9078, 127.7669], 'VNM': [14.0583, 108.2772],
        'PHL': [12.8797, 121.7740], 'TWN': [23.6978, 120.9605], 'IDN': [-0.7893, 113.9213],
        'MYS': [4.2105, 101.9758], 'SGP': [1.3521, 103.8198], 'KHM': [12.5657, 104.9910],
        'MMR': [21.9162, 95.9560], 'LAO': [19.8563, 102.4955],
        'MAR': [31.7917, -7.0926], 'EGY': [26.8206, 30.8025], 'ZAF': [-30.5595, 22.9375],
        'KEN': [-0.0236, 37.9062], 'TUN': [33.8869, 9.5375], 'DZA': [28.0339, 1.6596],
        'SEN': [14.4974, -14.4524], 'TZA': [-6.3690, 34.8888],
        'CAN': [56.1304, -106.3468], 'MEX': [23.6345, -102.5528],
        'BRA': [-14.2350, -51.9253], 'ARG': [-38.4161, -63.6167],
        'PER': [-9.1900, -75.0152], 'CHL': [-35.6751, -71.5430],
        'COL': [4.5709, -74.2973], 'BOL': [-16.2902, -63.5887],
        'GTM': [15.7835, -90.2308], 'BLZ': [17.1899, -88.4976],
        'AUS': [-25.2744, 133.7751], 'NZL': [-40.9006, 174.8860],
        'RUS': [61.5240, 105.3188], 'TUR': [38.9637, 35.2433], 'UKR': [48.3794, 31.1656],
        'NPL': [28.3949, 84.1240], 'REU': [-21.1151, 55.5364],
        'USA': [37.0902, -95.7129],
    }
    return coords_map.get(iso_code, [0, 0])


def get_drive_service():
    """Initialise le service Google Drive"""
    scopes = ['https://www.googleapis.com/auth/drive.readonly']

    # Preferred: load credentials from environment variables (so we don't keep secrets in git)
    project_id = os.environ.get("GOOGLE_SERVICE_ACCOUNT_PROJECT_ID")
    client_email = os.environ.get("GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL")
    private_key = os.environ.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")

    def _clean(s: str | None) -> str | None:
        if s is None:
            return None
        s = s.strip()
        if len(s) >= 2 and ((s[0] == s[-1] == '"') or (s[0] == s[-1] == "'")):
            s = s[1:-1]
        return s

    private_key = _clean(private_key)
    if private_key and "\\n" in private_key:
        private_key = private_key.replace("\\n", "\n")

    if project_id and client_email and private_key:
        info = {
            "type": "service_account",
            "project_id": project_id,
            "private_key": private_key,
            "client_email": client_email,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
    else:
        # Backward-compatible fallback for local usage
        creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    return build('drive', 'v3', credentials=creds)

def download_file(service, file_id, file_name, destination_path):
    """Télécharge un fichier depuis Google Drive"""
    request = service.files().get_media(fileId=file_id)
    fh = io.FileIO(destination_path / file_name, 'wb')
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while not done:
        status, done = downloader.next_chunk()
    return destination_path / file_name

def analyze_drive_folder():
    """Analyse la structure du Drive et génère countries.json"""
    service = get_drive_service()
    
    # Lister les dossiers dans le dossier racine
    results = service.files().list(
        q=f"'{DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder'",
        fields="files(id, name)"
    ).execute()
    
    countries_data = []
    continent_color_index = {
        'Europe': 0,
        'Asia': 0,
        'Africa': 0,
        'North America': 0,
        'South America': 0,
        'Oceania': 0,
        'USA States': 0
    }
    
    for folder in results.get('files', []):
        country_name = folder['name']
        folder_id = folder['id']
        
        # Déterminer le continent et obtenir le code ISO
        continent = COUNTRY_CONTINENT.get(country_name, 'Europe')  # Europe par défaut
        iso_code = get_iso_code(country_name)
        
        # Vérifier si c'est un état américain
        is_us_state = country_name in USA_STATES
        if is_us_state:
            continent = 'USA States'
            iso_code = USA_STATES[country_name]['iso']
        
        # Lister les photos dans ce dossier
        photos = []
        visit_year = 2023  # Valeur par défaut
        
        photo_results = service.files().list(
            q=f"'{folder_id}' in parents and mimeType contains 'image/'",
            fields="files(id, name)"
        ).execute()
        
        for photo in photo_results.get('files', []):
            photos.append(_normalized_name(photo['name']))
            
            # Essayer d'extraire l'année du nom de fichier
            if '20' in photo['name']:
                try:
                    visit_year = int(photo['name'].split('20')[1][:2])
                except:
                    pass
        
        # Obtenir les coordonnées
        if is_us_state:
            coords = USA_STATES[country_name]['coords']
        else:
            coords = get_coordinates(iso_code)
        
        # Sélectionner la couleur selon le continent
        continent_colors = CONTINENT_COLORS[continent]
        current_index = continent_color_index[continent] % len(continent_colors)
        color = continent_colors[current_index]
        continent_color_index[continent] += 1
        
        # Commentaire personnalisé
        if is_us_state:
            comment = f"Voyage en {country_name}, États-Unis"
        else:
            comment = f"Voyage en {country_name}"
        
        countries_data.append({
            "iso": iso_code,
            "name": country_name,
            "color": color,
            "continent": continent,
            "visits": [{
                "year": visit_year,
                "comment": comment,
                "photos": photos,
                "coordinates": coords
            }]
        })
    
    # Sauvegarder dans countries.json (base directory du script)
    data_dir = BASE_DIR / 'data'
    data_dir.mkdir(parents=True, exist_ok=True)
    with open(data_dir / 'countries.json', 'w', encoding='utf-8') as f:
        json.dump({"visited": countries_data}, f, indent=2, ensure_ascii=False)
    
    return countries_data

def get_iso_code(country_name):
    """Convertit un nom de dossier en code ISO alpha‑3.

    Accepté :
    1. Le nom est déjà un code ISO (ex : "FRA", "ESP").
    2. Le nom correspond à un pays français courant (via un petit dictionnaire).
    3. Si `pycountry` est installé, on interroge la bibliothèque pour
       trouver un code à partir du nom (recherche fuzzy également).

    Si aucune méthode ne renvoie de code, on retourne "XXX" ; le front-end
    essaiera ensuite de colorer le pays en se basant sur son nom.
    """
    # 1. le dossier est peut-être déjà un code ISO valide
    if isinstance(country_name, str) and len(country_name) == 3 and country_name.isalpha():
        return country_name.upper()

    # 2. petite table statique pour les noms en français (comparaison insensible à la casse)
    lookup = {
        'france': 'FRA', 'espagne': 'ESP', 'italie': 'ITA',
        'japon': 'JPN', 'usa': 'USA', 'états-unis': 'USA', 'etats-unis': 'USA',
        'brésil': 'BRA', 'bresil': 'BRA', 'brasil': 'BRA',
        'australie': 'AUS', 'allemagne': 'DEU', 'royaume-uni': 'GBR', 'angleterre': 'GBR',
        'canada': 'CAN',
        'maroc': 'MAR',
        'thaïlande': 'THA', 'thailande': 'THA',
        'corée du sud': 'KOR', 'coree du sud': 'KOR', 'corée': 'KOR', 'coree': 'KOR',
        'chine': 'CHN',
        'pérou': 'PER', 'perou': 'PER',
        'bolivie': 'BOL',
        'colombie': 'COL',
        'grèce': 'GRC', 'grece': 'GRC',
        'pologne': 'POL',
        'roumanie': 'ROU',
        'pays-bas': 'NLD', 'hollande': 'NLD',
        'californie': 'USA', 'hawaï': 'USA', 'hawaii': 'USA', 'nevada': 'USA', 'colorado': 'USA',
        'la réunion': 'REU', 'réunion': 'REU', 'reunion': 'REU',
        'taïwan': 'TWN', 'taiwan': 'TWN',
        'vietnam': 'VNM',
        'philippines': 'PHL',
        'afrique du sud': 'ZAF',
        'bélize': 'BLZ', 'belize': 'BLZ',
        'guatemala': 'GTM',
        'nepal': 'NPL', 'népal': 'NPL',
        'portugal': 'PRT', 'belgique': 'BEL', 'suisse': 'CHE', 'autriche': 'AUT',
        'suède': 'SWE', 'suede': 'SWE', 'norvège': 'NOR', 'norvege': 'NOR',
        'finlande': 'FIN', 'danemark': 'DNK', 'irlande': 'IRL',
        'mexique': 'MEX', 'argentine': 'ARG', 'chili': 'CHL', 'équateur': 'ECU', 'equateur': 'ECU',
        'venezuela': 'VEN', 'uruguay': 'URY', 'paraguay': 'PRY',
        'inde': 'IND', 'pakistan': 'PAK', 'bangladesh': 'BGD', 'sri lanka': 'LKA',
        'indonésie': 'IDN', 'indonesie': 'IDN', 'malaisie': 'MYS', 'singapour': 'SGP',
        'cambodge': 'KHM', 'myanmar': 'MMR', 'laos': 'LAO',
        'russie': 'RUS', 'turquie': 'TUR', 'ukraine': 'UKR',
        'egypte': 'EGY', 'égypte': 'EGY', 'tunisie': 'TUN', 'algérie': 'DZA', 'algerie': 'DZA',
        'sénégal': 'SEN', 'senegal': 'SEN', 'kenya': 'KEN', 'tanzanie': 'TZA',
        'nouvelle-zélande': 'NZL', 'nouvelle-zelande': 'NZL',
        'israël': 'ISR', 'israel': 'ISR', 'jordanie': 'JOR', 'liban': 'LBN',
    }
    code = lookup.get(country_name.lower())
    if code:
        return code

    # 3. fallback pycountry si disponible
    try:
        import pycountry
        country = pycountry.countries.get(name=country_name)
        if country:
            return country.alpha_3
        country = pycountry.countries.search_fuzzy(country_name)
        if country:
            return country[0].alpha_3
    except ImportError:
        pass
    except Exception:
        pass

    return 'XXX'  # code inconnu, le front-end colorera peut-être par nom


def download_all_photos():
    """Télécharge toutes les photos depuis les sous-dossiers pays du Drive."""
    service = get_drive_service()
    PROJECT_PATH = BASE_DIR / "data" / "photos"
    PROJECT_PATH.mkdir(parents=True, exist_ok=True)

    # Récupérer tous les dossiers pays
    folder_results = service.files().list(
        q=f"'{DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder'",
        fields="files(id, name)"
    ).execute()

    downloaded = 0
    for folder in folder_results.get('files', []):
        folder_name = folder['name']
        photo_results = service.files().list(
            q=f"'{folder['id']}' in parents and mimeType contains 'image/'",
            fields="files(id, name)"
        ).execute()

        for file in photo_results.get('files', []):
            # Destination avec nom normalisé (.heic → .jpg)
            local_name = _normalized_name(file['name'])
            dest = PROJECT_PATH / local_name
            if dest.exists():
                continue  # déjà téléchargé

            # Téléchargement dans un fichier temporaire (nom original)
            tmp = PROJECT_PATH / file['name']
            download_file(service, file['id'], file['name'], PROJECT_PATH)

            # Conversion HEIC si nécessaire
            final = _convert_heic_if_needed(tmp)
            print(f"✓ {folder_name}/{final.name}")
            downloaded += 1

    return downloaded

def main():
    print("Analyse de la structure Google Drive...")
    countries = analyze_drive_folder()
    print(f"\n{len(countries)} pays trouvés : {', '.join([c['name'] for c in countries])}")
    
    print("\nTéléchargement des photos...")
    downloaded = download_all_photos()
    print(f"\n{downloaded} photos téléchargées.")
    
    print("\n✅ Synchronisation terminée!")
    print("Vous pouvez maintenant ouvrir index.html pour voir votre carte.")

if __name__ == "__main__":
    # Vérifier que le fichier de service account existe
    # the service account file is now a Path object; resolve to string for
    # messages so it looks nice regardless of cwd
    if not SERVICE_ACCOUNT_FILE.exists():
        print(f"❌ Fichier {SERVICE_ACCOUNT_FILE} non trouvé.")
        print("Veuillez créer un projet Google Cloud et télécharger le fichier de service account.")
        print("Suivez ce guide: https://developers.google.com/drive/api/v3/quickstart/python")
    else:
        main()