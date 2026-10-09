import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Workspace from "./components/Workspace";
import KartoteksSidebar from "./components/KartoteksSidebar";
import KartoteksWorkspace from "./components/KartoteksWorkspace";
import { useStore } from "./store";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Upload, Edit3, FileText, Settings2 } from "lucide-react";

function App() {
  const { currentPdfData, setPdf, appMode, setAppMode } = useStore();

  const handleOpenPdf = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (selected) {
        const filePath = Array.isArray(selected) ? selected[0] : selected;
        const fileUrl = convertFileSrc(filePath);
        setPdf(filePath, fileUrl);
      }
    } catch (error) {
      console.error("PDF açılamadı:", error);
    }
  };

  return (
    <div className="app-container">
      {currentPdfData ? (
        <>
          {appMode && (
            <button 
              className="btn-icon" 
              onClick={() => setAppMode(null)} 
              title="Mod Değiştir"
              style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 1000, background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', padding: '8px' }}
            >
              <Settings2 size={24} />
            </button>
          )}

          {!appMode && (
            <div className="workspace" style={{ flexDirection: "column", gap: "20px" }}>
              <h2>Çalışma Modunu Seçin</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: '20px' }}>Bu belge ile nasıl çalışmak istersiniz?</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button className="btn" onClick={() => setAppMode('tashih')} style={{ fontSize: "1.2rem", padding: "20px 40px", display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                  <Edit3 size={32} /> Tashih Yap
                </button>
                <button className="btn" onClick={() => setAppMode('kartoteks')} style={{ fontSize: "1.2rem", padding: "20px 40px", display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)' }}>
                  <FileText size={32} /> Alıntı Hazırla (Kartoteks)
                </button>
              </div>
            </div>
          )}

          {appMode === 'tashih' && (
            <>
              <Sidebar />
              <Workspace />
            </>
          )}

          {appMode === 'kartoteks' && (
            <>
              <KartoteksSidebar />
              <KartoteksWorkspace />
            </>
          )}
        </>
      ) : (
        <div className="workspace" style={{ flexDirection: "column", gap: "20px" }}>
          <h2>Musahhih'e Hoş Geldiniz</h2>
          <p style={{ color: "var(--text-muted)" }}>İşleme başlamak için bir PDF yükleyin.</p>
          <button className="btn" onClick={handleOpenPdf} style={{ fontSize: "1.2rem", padding: "12px 24px" }}>
            <Upload size={24} /> PDF Seç
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
