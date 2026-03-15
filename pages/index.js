import React, { useState, useEffect, useRef } from "react";
import { Search, Play, Pause, Music, Loader2, Headphones, Github, MessageCircle, X } from "lucide-react";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

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
    setCurrentTrack({ ...trackItem, isLoading: true });
    setIsPlaying(false);
    setProgress(0);

    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trackItem.url })
      });
      
      const data = await res.json();
      
      setCurrentTrack({ 
        ...trackItem,
        play: data.play,
        isLoading: false 
      });

    } catch (error) {
      console.error("Gagal memuat audio:", error);
      setCurrentTrack(null);
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#0b101c] text-slate-200 font-sans selection:bg-blue-500/30 ${currentTrack ? 'pb-32 sm:pb-28' : ''}`}>
      <div className="flex-grow max-w-3xl w-full mx-auto px-4 py-8 sm:px-6 sm:py-12">

        <div className="flex items-center gap-4 mb-10 sm:mb-12">
          <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-500 shadow-sm">
            <Music className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Simple Music Stream
            </h1>
            <p className="text-slate-400 text-sm mt-1">Dengarkan musik favoritmu dengan mudah</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul lagu atau artis..."
              className="w-full pl-12 pr-4 py-4 bg-[#131b2e] border border-slate-800/80 rounded-xl text-base focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500 text-slate-100"
            />
          </div>
          
          <button 
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-[#131b2e] disabled:text-slate-500 disabled:border-slate-800 disabled:border disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Cari</span>
            )}
          </button>
        </form>

        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="p-5 bg-[#131b2e] rounded-full mb-4 border border-slate-800/80">
              <Headphones className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-1">Belum ada musik</h3>
            <p className="text-slate-500 text-sm">Mulai cari musik favorit mu sekarang.</p>
          </div>
        )}

        <div className="space-y-3">
          {results.map((m) => {
            const isActive = currentTrack?.id === m.id;
            
            return (
              <div 
                key={m.id} 
                onClick={() => !isActive && handlePlayTrack(m)}
                className={`group flex items-center gap-4 p-3 pr-4 sm:pr-5 rounded-xl cursor-pointer transition-colors
                  ${isActive ? 'bg-[#151f36] border border-blue-500/30' : 'bg-[#131b2e] hover:bg-[#1a243b] border border-transparent'}`}
              >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#0b101c]">
                  {m.thumbnail ? (
                    <img 
                      src={m.thumbnail} 
                      alt={m.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-slate-600" />
                    </div>
                  )}

                  {isActive && !currentTrack?.isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="flex gap-1 items-end h-3">
                        <div className={`w-1 bg-blue-400 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-1'}`}></div>
                        <div className={`w-1 bg-blue-400 rounded-full ${isPlaying ? 'animate-[bounce_1.2s_infinite]' : 'h-1'}`}></div>
                        <div className={`w-1 bg-blue-400 rounded-full ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : 'h-1'}`}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-base truncate ${isActive ? 'text-blue-400' : 'text-slate-200 group-hover:text-white'}`}>
                    {m.title}
                  </h3>
                  <p className="text-sm text-slate-500 truncate mt-0.5">
                    {m.uploader}
                  </p>
                </div>

                <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                  {isActive && currentTrack?.isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  ) : isActive && isPlaying ? (
                    <Pause className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Play className={`w-5 h-5 ml-1 ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-white'}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full border-t border-slate-800 bg-[#0b101c] mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">
            Simple Music Stream &copy; {new Date().getFullYear()}
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="https://t.me/@rexoffc"
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#131b2e] hover:bg-[#1a243b] text-slate-300 border border-slate-800 rounded-lg transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact</span>
            </a>

            <a 
              href="https://github.com/rexorangngawi/music.git" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#131b2e] hover:bg-[#1a243b] text-slate-300 border border-slate-800 rounded-lg transition-colors text-sm"
            >
              <Github className="w-4 h-4" />
              <span>Source Code</span>
            </a>
          </div>
        </div>
      </div>

      {currentTrack && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0f1523] border-t border-slate-800 z-50 px-4 py-3 sm:px-6 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]">
          
          {currentTrack.play && !currentTrack.isLoading && (
            <audio
              ref={audioRef}
              src={currentTrack.play}
              autoPlay
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setProgress(e.target.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.target.duration)}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          <div className="max-w-4xl mx-auto">
            {currentTrack.isLoading ? (
              <div className="flex items-center justify-center gap-3 py-4 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Memuat Audio...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">

                <div className="flex items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img 
                      src={currentTrack.thumbnail} 
                      alt="Cover" 
                      className="w-12 h-12 rounded-md object-cover bg-slate-900 border border-slate-800"
                    />
                    <div className="min-w-0">
                      <h4 className="text-white font-medium text-sm sm:text-base truncate">{currentTrack.title}</h4>
                      <p className="text-slate-400 text-xs sm:text-sm truncate">{currentTrack.uploader}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <button 
                      onClick={togglePlay}
                      className="flex items-center justify-center w-10 h-10 bg-white text-black hover:bg-slate-200 rounded-full transition-colors focus:ring-4 focus:ring-white/20 active:scale-95"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
                    </button>

                    <button 
                      onClick={() => {
                        setCurrentTrack(null);
                        setIsPlaying(false);
                      }}
                      className="p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full pb-1">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 w-9 text-right">
                    {formatTime(progress)}
                  </span>
                  
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={progress}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
                  />
                  
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 w-9">
                    {formatTime(duration)}
                  </span>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
