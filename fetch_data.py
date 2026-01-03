import os
import json
import re
from evds import evdsAPI
from dotenv import load_dotenv
from datetime import datetime, timedelta

# .env dosyasındaki anahtarı yükle
load_dotenv()
api_key = os.getenv('EVDS_API_KEY')

if not api_key:
    print("Hata: EVDS_API_KEY bulunamadı!")
    exit(1)

# EVDS bağlantısını kur
evds = evdsAPI(api_key)

def fetch_latest_usd():
    try:
        now = datetime.now()
        # Haftanın günü (0=Pazartesi ... 6=Pazar)
        weekday = now.weekday()
        
        target_date = now
        
        # Eğer Cumartesi (5) ise 1 gün geri git (Cuma)
        if weekday == 5:
            target_date = now - timedelta(days=1)
        # Eğer Pazar (6) ise 2 gün geri git (Cuma)
        elif weekday == 6:
            target_date = now - timedelta(days=2)
            
        target_date_str = target_date.strftime('%d-%m-%Y')
        
        # USD Satış Kuru serisini çek (TP.DK.USD.S.YTL)
        data = evds.get_data(['TP.DK.USD.S.YTL'], startdate=target_date_str, enddate=target_date_str)
        
        # Eğer veri yoksa (Resmi tatil vs.), son 7 günlük veriye bak
        if data.empty or data['TP_DK_USD_S_YTL'].iloc[-1] is None:
             # target_date zaten Cuma olabilir ama belki o da tatildir, garantilemek için geniş aralık
             week_ago = (now - timedelta(days=7)).strftime('%d-%m-%Y')
             data = evds.get_data(['TP.DK.USD.S.YTL'], startdate=week_ago)
        
        latest_val = data['TP_DK_USD_S_YTL'].dropna().iloc[-1]
        return float(latest_val)
    except Exception as e:
        print(f"USD çekilirken hata: {e}")
        return None

def update_data_js(usd_price):
    file_path = 'data/data.js'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Regex ile ABD Doları objesindeki unitPrice değerini bul ve değiştir
        # ABD Doları'nın olduğu satırı hedefle
        pattern = r'({ name: "ABD Doları", .*? unitPrice: )([\d.]+)(, .*? })'
        
        if re.search(pattern, content):
            new_content = re.sub(pattern, rf'\g<1>{usd_price:.2f}\g<3>', content)
            
            # Tarihi de güncelleyelim
            now = datetime.now().strftime('%d.%m.%Y %H:%M')
            date_pattern = r'(lastUpdated: ")(.*?)(")'
            new_content = re.sub(date_pattern, rf'\1{now}\3', new_content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"data.js başarıyla güncellendi. Yeni USD: {usd_price:.2f}")
        else:
            print("Hata: data.js içinde ABD Doları verisi bulunamadı.")
            
    except Exception as e:
        print(f"Dosya güncellenirken hata: {e}")

if __name__ == "__main__":
    usd = fetch_latest_usd()
    if usd:
        print(f"Merkez Bankasından alınan güncel kur: {usd}")
        update_data_js(usd)
    else:
        print("Kur verisi alınamadı.")
