import os
import json
import re
from evds import evdsAPI
from dotenv import load_dotenv
from datetime import datetime

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
        # USD Satış Kuru serisini çek (TP.DK.USD.S.YTL)
        # Bugünün ve dünün verisini çekmek için kısa bir aralık kullanıyoruz
        today = datetime.now().strftime('%d-%m-%Y')
        data = evds.get_data(['TP.DK.USD.S.YTL'], startdate=today, enddate=today)
        
        # Eğer bugün veri yoksa (hafta sonu vb.), son mevcut veriyi al
        if data.empty or data['TP_DK_USD_S_YTL'].iloc[-1] is None:
             # Son 7 günlük veriye bak ki en güncel iş gününü yakalayalım
             data = evds.get_data(['TP.DK.USD.S.YTL'], startdate="20-12-2024") # Güvenli bir geçmiş tarih
        
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
            new_content = re.sub(pattern, rf'\1{usd_price:.2f}\3', content)
            
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
