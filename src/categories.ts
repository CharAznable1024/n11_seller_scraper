export interface PlatformCategory {
    id: string;
    name: string;
    url: string;
}

export const CATEGORY_MANIFEST_VERSION = 'n11-public-nav-2026-10-v1';

export const FULL_PLATFORM_CATEGORIES: PlatformCategory[] = [
    { id: 'ayakkabi-ve-canta', name: 'Ayakkabı ve Çanta', url: 'https://www.n11.com/ayakkabi-ve-canta' },
    { id: 'kadin-giyim-aksesuar', name: 'Kadın Giyim ve Aksesuar', url: 'https://www.n11.com/kadin-giyim-aksesuar' },
    { id: 'erkek-giyim-aksesuar', name: 'Erkek Giyim ve Aksesuar', url: 'https://www.n11.com/erkek-giyim-aksesuar' },
    { id: 'cocuk-giyim-aksesuar', name: 'Çocuk Giyim ve Aksesuar', url: 'https://www.n11.com/cocuk-giyim-aksesuar' },
    { id: 'telefon-ve-aksesuarlari', name: 'Telefon ve Aksesuarları', url: 'https://www.n11.com/telefon-ve-aksesuarlari' },
    { id: 'bilgisayar', name: 'Bilgisayar', url: 'https://www.n11.com/bilgisayar' },
    { id: 'televizyon-ve-ses-sistemleri', name: 'Televizyon ve Ses Sistemleri', url: 'https://www.n11.com/televizyon-ve-ses-sistemleri' },
    { id: 'elektrikli-ev-aletleri', name: 'Elektrikli Ev Aletleri', url: 'https://www.n11.com/elektrikli-ev-aletleri' },
    { id: 'beyaz-esya', name: 'Beyaz Eşya', url: 'https://www.n11.com/beyaz-esya' },
    { id: 'fotograf-ve-kamera', name: 'Fotoğraf ve Kamera', url: 'https://www.n11.com/fotograf-ve-kamera' },
    { id: 'video-oyun-konsol', name: 'Video Oyun ve Konsol', url: 'https://www.n11.com/video-oyun-konsol' },
    { id: 'mobilya', name: 'Mobilya', url: 'https://www.n11.com/mobilya' },
    { id: 'ev-tekstili', name: 'Ev Tekstili', url: 'https://www.n11.com/ev-tekstili' },
    { id: 'dekorasyon-ve-aydinlatma', name: 'Dekorasyon ve Aydınlatma', url: 'https://www.n11.com/dekorasyon-ve-aydinlatma' },
    { id: 'mutfak-gerecleri', name: 'Mutfak Gereçleri', url: 'https://www.n11.com/mutfak-gerecleri' },
    { id: 'banyo-ve-ev-gerecleri', name: 'Banyo ve Ev Gereçleri', url: 'https://www.n11.com/banyo-ve-ev-gerecleri' },
    { id: 'yapi-market-ve-bahce', name: 'Yapı Market ve Bahçe', url: 'https://www.n11.com/yapi-market-ve-bahce' },
    { id: 'evcil-hayvan-urunleri', name: 'Evcil Hayvan Ürünleri', url: 'https://www.n11.com/evcil-hayvan-urunleri' },
    { id: 'kirtasiye-ve-ofis', name: 'Kırtasiye ve Ofis', url: 'https://www.n11.com/kirtasiye-ve-ofis' },
    { id: 'supermarket', name: 'Süpermarket', url: 'https://www.n11.com/supermarket' },
    { id: 'bebek-bezi-ve-islak-mendil', name: 'Bebek Bezi ve Islak Mendil', url: 'https://www.n11.com/bebek-bezi-ve-islak-mendil' },
    { id: 'bebek-giyim', name: 'Bebek Giyim', url: 'https://www.n11.com/bebek-giyim' },
    { id: 'hamile-giyim', name: 'Hamile Giyim', url: 'https://www.n11.com/hamile-giyim' },
    { id: 'bebek-arabalari', name: 'Bebek Arabaları', url: 'https://www.n11.com/bebek-arabalari' },
    { id: 'oto-koltugu-ve-ana-kucagi', name: 'Oto Koltuğu ve Ana Kucağı', url: 'https://www.n11.com/oto-koltugu-ve-ana-kucagi' },
    { id: 'beslenme-ve-mama-sandalyesi', name: 'Beslenme ve Mama Sandalyesi', url: 'https://www.n11.com/beslenme-ve-mama-sandalyesi' },
    { id: 'biberon-ve-aksesuarlari', name: 'Biberon ve Aksesuarları', url: 'https://www.n11.com/biberon-ve-aksesuarlari' },
    { id: 'emzirme-urunleri', name: 'Emzirme Ürünleri', url: 'https://www.n11.com/emzirme-urunleri' },
    { id: 'yurutec-ve-yurume-yardimcilari', name: 'Yürüteç ve Yürüme Yardımcıları', url: 'https://www.n11.com/yurutec-ve-yurume-yardimcilari' },
    { id: 'bebek-odasi-ve-park-yatak', name: 'Bebek Odası ve Park Yatak', url: 'https://www.n11.com/bebek-odasi-ve-park-yatak' },
    { id: 'bebek-bakim-ve-saglik', name: 'Bebek Bakım ve Sağlık', url: 'https://www.n11.com/bebek-bakim-ve-saglik' },
    { id: 'bebek-guvenlik', name: 'Bebek Güvenlik', url: 'https://www.n11.com/bebek-guvenlik' },
    { id: 'bebek-oyuncaklari', name: 'Bebek Oyuncakları', url: 'https://www.n11.com/bebek-oyuncaklari' },
    { id: 'banyo-ve-tuvalet', name: 'Banyo ve Tuvalet', url: 'https://www.n11.com/banyo-ve-tuvalet' },
    { id: 'cocuk-oyuncaklari-ve-parti', name: 'Çocuk Oyuncakları ve Parti', url: 'https://www.n11.com/cocuk-oyuncaklari-ve-parti' },
    { id: 'parfum-ve-deodorant', name: 'Parfüm ve Deodorant', url: 'https://www.n11.com/parfum-ve-deodorant' },
    { id: 'sac-bakim-ve-sekillendirme', name: 'Saç Bakım ve Şekillendirme', url: 'https://www.n11.com/sac-bakim-ve-sekillendirme' },
    { id: 'yuz-ve-vucut-bakimi', name: 'Yüz ve Vücut Bakımı', url: 'https://www.n11.com/yuz-ve-vucut-bakimi' },
    { id: 'makyaj', name: 'Makyaj', url: 'https://www.n11.com/makyaj' },
    { id: 'saglik-ve-medikal-urunler', name: 'Sağlık ve Medikal Ürünler', url: 'https://www.n11.com/saglik-ve-medikal-urunler' },
    { id: 'kadin-bakim-urunleri', name: 'Kadın Bakım Ürünleri', url: 'https://www.n11.com/kadin-bakim-urunleri' },
    { id: 'erkek-bakim-urunleri', name: 'Erkek Bakım Ürünleri', url: 'https://www.n11.com/erkek-bakim-urunleri' },
    { id: 'guzellik-salonu-ve-kuafor-urunleri', name: 'Güzellik Salonu ve Kuaför Ürünleri', url: 'https://www.n11.com/guzellik-salonu-ve-kuafor-urunleri' },
    { id: 'agiz-dis-bakimi', name: 'Ağız ve Diş Bakımı', url: 'https://www.n11.com/agiz-dis-bakimi' },
    { id: 'cinsel-urunler', name: 'Cinsel Ürünler', url: 'https://www.n11.com/cinsel-urunler' },
    { id: 'altin-ve-gumus', name: 'Yatırımlık Altın ve Gümüş', url: 'https://www.n11.com/altin-ve-gumus' },
    { id: 'saat', name: 'Saat', url: 'https://www.n11.com/saat' },
    { id: 'gunes-gozlugu', name: 'Güneş Gözlüğü', url: 'https://www.n11.com/gunes-gozlugu' },
    { id: 'altin-takilar', name: 'Altın Takılar', url: 'https://www.n11.com/altin-takilar' },
    { id: 'pirlanta-takilar', name: 'Pırlanta Takılar', url: 'https://www.n11.com/pirlanta-takilar' },
    { id: 'gumus-takilar', name: 'Gümüş Takılar', url: 'https://www.n11.com/gumus-takilar' },
    { id: 'celik-takilar', name: 'Çelik Takılar', url: 'https://www.n11.com/celik-takilar' },
    { id: 'bijuteri-takilar', name: 'Bijuteri Takılar', url: 'https://www.n11.com/bijuteri-takilar' },
    { id: 'aksesuar', name: 'Aksesuar', url: 'https://www.n11.com/aksesuar' },
    { id: 'taki-aksesuarlari', name: 'Takı Aksesuarları', url: 'https://www.n11.com/taki-aksesuarlari' },
    { id: 'antika-ve-koleksiyon', name: 'Antika ve Koleksiyon', url: 'https://www.n11.com/antika-ve-koleksiyon' },
    { id: 'fitness-ve-kondisyon', name: 'Fitness ve Kondisyon', url: 'https://www.n11.com/fitness-ve-kondisyon' },
    { id: 'spor-giyim-ve-ayakkabi', name: 'Spor Giyim ve Ayakkabı', url: 'https://www.n11.com/spor-giyim-ve-ayakkabi' },
    { id: 'outdoor-ve-kamp', name: 'Outdoor ve Kamp', url: 'https://www.n11.com/outdoor-ve-kamp' },
    { id: 'bireysel-ve-takim-sporlari', name: 'Bireysel ve Takım Sporları', url: 'https://www.n11.com/bireysel-ve-takim-sporlari' },
    { id: 'avcilik-ve-balikcilik', name: 'Avcılık ve Balıkçılık', url: 'https://www.n11.com/avcilik-ve-balikcilik' },
    { id: 'kis-sporlari', name: 'Kış Sporları', url: 'https://www.n11.com/kis-sporlari' },
    { id: 'bisiklet-ve-scooter', name: 'Bisiklet ve Scooter', url: 'https://www.n11.com/bisiklet-ve-scooter' },
    { id: 'tekne-ve-yat-malzemeleri', name: 'Tekne ve Yat Malzemeleri', url: 'https://www.n11.com/tekne-ve-yat-malzemeleri' },
    { id: 'su-sporlari', name: 'Su Sporları', url: 'https://www.n11.com/su-sporlari' },
    { id: 'kitap', name: 'Kitap', url: 'https://www.n11.com/kitap' },
    { id: 'film', name: 'Film', url: 'https://www.n11.com/film' },
    { id: 'muzik', name: 'Müzik', url: 'https://www.n11.com/muzik' },
    { id: 'yetiskin-hobi-ve-oyun', name: 'Yetişkin Hobi ve Oyun', url: 'https://www.n11.com/yetiskin-hobi-ve-oyun' },
    { id: 'dijital-kodlar-urunler', name: 'Dijital Kodlar ve Ürünler', url: 'https://www.n11.com/dijital-kodlar-urunler' },
    { id: 'dugun-davet-organizasyon', name: 'Düğün, Davet ve Organizasyon', url: 'https://www.n11.com/dugun-davet-organizasyon' },
    { id: 'ilginc-akilli-urunler', name: 'El İşi ve İlginç Ürünler', url: 'https://www.n11.com/ilginc-akilli-urunler' },
    { id: 'yasam-ve-etkinlik', name: 'Yaşam ve Etkinlik', url: 'https://www.n11.com/yasam-ve-etkinlik' },
    { id: 'aksesuar-ve-tuning', name: 'Otomotiv Aksesuar ve Tuning', url: 'https://www.n11.com/aksesuar-ve-tuning' },
    { id: 'yedek-parca-otomobil', name: 'Otomobil Yedek Parça', url: 'https://www.n11.com/yedek-parca-otomobil' },
    { id: 'ses-sistemleri-ve-navigasyon', name: 'Araç Ses Sistemleri ve Navigasyon', url: 'https://www.n11.com/ses-sistemleri-ve-navigasyon' },
    { id: 'lastik-ve-jant', name: 'Lastik ve Jant', url: 'https://www.n11.com/lastik-ve-jant' },
    { id: 'motosiklet', name: 'Motosiklet', url: 'https://www.n11.com/motosiklet' },
    { id: 'traktor', name: 'Traktör', url: 'https://www.n11.com/traktor' },
];

export function validateCategoryManifest(categories: PlatformCategory[]): void {
    const ids = new Set<string>();
    const urls = new Set<string>();
    for (const category of categories) {
        if (!category.id || !category.name) throw new Error('Category manifest entries require id and name');
        const url = new URL(category.url);
        if (url.protocol !== 'https:' || url.hostname !== 'www.n11.com' || url.pathname.split('/').filter(Boolean).length !== 1) {
            throw new Error(`Invalid N11 category URL: ${category.url}`);
        }
        if (ids.has(category.id) || urls.has(category.url)) throw new Error(`Duplicate category manifest entry: ${category.id}`);
        ids.add(category.id);
        urls.add(category.url);
    }
}

export function selectPendingCategories<T extends { url: string }>(
    categories: T[],
    exhaustedUrls: Set<string>,
    limit: number,
): T[] {
    return categories.filter((category) => !exhaustedUrls.has(category.url)).slice(0, limit);
}
