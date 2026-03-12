import React, { useState, useEffect } from "react";
import { Search, Play, Music, Loader2, Headphones, Heart, MessageCircle, Sparkles, X } from "lucide-react";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  useEffect(() => {
    const savedQuery = sessionStorage.getItem("musicQuery");
    const savedResults = sessionStorage.getItem("musicResults");
    
    if (savedQuery) setQuery(savedQuery);
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (e) {
        console.error("Gagal memuat cache pencarian", e);
      }
    }
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });

      const json = await res.json();
      const searchResults = json.results || [];

      setResults(searchResults);
      
      sessionStorage.setItem("musicQuery", query);
      sessionStorage.setItem("musicResults", JSON.stringify(searchResults));
      
    } catch (error) {
      console.error("Terjadi kesalahan saat mencari", error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlayTrack(trackItem) {
    // 1. Set status loading, tapi TETAP GUNAKAN data dari trackItem (pencarian)
    setCurrentTrack({ ...trackItem, isLoading: true });

    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trackItem.url })
      });
      
      const data = await res.json();
      
      // 2. PERBAIKAN UTAMA DI SINI
      // Kita pertahankan metadata asli dari trackItem (thumbnail, title, uploader)
      // Kita HANYA mengambil URL audio (data.play) dari hasil fetch
      setCurrentTrack({ 
        ...trackItem,      // Data asli yang benar (Gambar, Judul)
        play: data.play,   // Link MP3/Audio dari API
        isLoading: false 
      });

    } catch (error) {
      console.error("Gagal memuat audio:", error);
      setCurrentTrack(null);
    }
  }

  return (
    <div className={`min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 transition-all ${currentTrack ? 'pb-32 sm:pb-24' : ''}`}>
      <div className="flex-grow max-w-3xl w-full mx-auto px-4 py-8 sm:px-6 sm:py-12">
        
        <div className="flex items-center gap-3 mb-8 sm:mb-12">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
            <Music className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Simple Music Stream
            </h1>
            <p className="text-slate-400 text-sm mt-1">Dengarkan musik favoritmu dengan mudah</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul lagu atau artis..."
              className="w-full pl-12 pr-4 py-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500 hover:border-slate-700 shadow-sm"
            />
          </div>
          
          <button 
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all active:scale-95 shadow-md shadow-blue-900/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <span>Cari</span>
            )}
          </button>
        </form>

        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="p-5 bg-slate-900 rounded-full mb-6 border border-slate-800 shadow-sm">
              <Headphones className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Belum ada musik</h3>
            <p className="text-slate-400 max-w-sm">Mulai cari musik favorit mu sekarang.</p>
          </div>
        )}

        <div className="space-y-3">
          {results.map((m) => (
            <div 
              key={m.id} 
              className="group relative flex items-center gap-4 p-3 pr-5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all duration-200"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-xl shadow-sm bg-slate-800">
                {m.thumbnail ? (
                  <img 
                    src={m.thumbnail} 
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-6 h-6 text-slate-600" />
                  </div>
                )}
                
                {/* Overlay saat lagu ini sedang dimainkan */}
                {currentTrack?.id === m.id && !currentTrack?.isLoading && (
                  <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-xl"></div>
                )}
              </div>

              <div className="flex-1 min-w-0 py-1">
                <h3 className={`font-semibold text-base sm:text-lg truncate transition-colors ${currentTrack?.id === m.id ? 'text-blue-400' : 'text-slate-100 group-hover:text-blue-400'}`}>
                  {m.title}
                </h3>
                <p className="text-sm text-slate-400 truncate mt-0.5">
                  {m.uploader}
                </p>
              </div>

              {/* Tombol Play */}
              <button 
                onClick={() => handlePlayTrack(m)}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all duration-200 transform group-hover:scale-105 shadow-md focus:ring-4 focus:ring-blue-500/20 active:scale-95 flex-shrink-0"
              >
                {currentTrack?.id === m.id && currentTrack?.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 ml-1 fill-current" />
                )}
              </button>

            </div>
          ))}
        </div>

      </div>

      <div className="w-full border-t border-slate-800/80 bg-slate-900/30 backdrop-blur-sm mt-8">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Simple Music Stream &copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a 
              href="https://t.me/@rexoffc"
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-green-400 border border-slate-700/50 hover:border-green-500/30 rounded-xl transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-green-900/20 group"
            >
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Contact</span>
            </a>

            <a 
              href="https://donate.rexdev.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-400/50 rounded-xl transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-blue-900/20 group"
            >
              <Heart className="w-4 h-4 group-hover:fill-current group-hover:scale-110 transition-all" />
              <span>Donate</span>
            </a>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM MUSIC PLAYER (Sudah Dirapikan untuk Mobile) */}
      {currentTrack && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-4xl mx-auto p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 relative">
            
            {/* TAMPILAN HP: Bagian Atas (Gambar, Judul, Tombol Close) */}
            <div className="flex items-center justify-between w-full sm:w-1/3">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <img 
                  src={currentTrack.thumbnail} 
                  alt="Cover" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover shadow-sm bg-slate-800 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-semibold text-sm sm:text-base truncate">{currentTrack.title}</h4>
                  <p className="text-slate-400 text-xs sm:text-sm truncate">{currentTrack.uploader}</p>
                </div>
              </div>

              <button 
                onClick={() => setCurrentTrack(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2"
                title="Tutup Pemutar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAMPILAN HP: Bagian Bawah (Audio Kontrol) */}
            <div className="w-full sm:w-2/3 flex items-center justify-center sm:justify-start sm:pr-12">
              {currentTrack.isLoading ? (
                <div className="flex items-center gap-2 text-blue-400 h-10">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Menyiapkan audio...</span>
                </div>
              ) : (
                <audio 
                  src={currentTrack.play} 
                  controls 
                  autoPlay 
                  className="w-full h-9 sm:h-10 rounded-lg outline-none max-w-lg" 
                />
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


