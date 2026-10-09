import { useStore } from "../store";
import { Check, Trash2, Download, Upload } from "lucide-react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

export default function Sidebar() {
  const { corrections, toggleCompletion, deleteCorrection, setSelectedCorrection, selectedCorrectionId, currentPdfPath, loadState } = useStore();

  const handleImport = async () => {
    try {
      const selected = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false
      });
      if (selected) {
        const filePath = Array.isArray(selected) ? selected[0] : selected;
        const fileContent = await readTextFile(filePath);
        const parsedData = JSON.parse(fileContent);
        
        // Geriye dönük uyumluluk (Eski diziler)
        if (Array.isArray(parsedData)) {
          loadState({ corrections: parsedData });
          alert("Tashih dosyası (eski format) başarıyla yüklendi!");
        } 
        // Yeni damgalı format
        else if (parsedData && parsedData.corrections) {
          const currentBaseName = currentPdfPath ? currentPdfPath.split(/[/\\]/).pop() : "";
          if (parsedData.pdfName && parsedData.pdfName !== currentBaseName) {
            alert(`Uyarı: Bu düzeltme dosyası "${parsedData.pdfName}" adlı PDF'e aittir!\n\nŞu anki PDF: "${currentBaseName}"\n\nYanlış dosya eşleşmesi. İşlem iptal edildi.`);
            return;
          }
          loadState({ corrections: parsedData.corrections });
          alert("Tashih dosyası başarıyla yüklendi!");
        } else {
          alert("Hatalı dosya formatı.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("İçe aktarma sırasında hata oluştu.");
    }
  };

  const handleExport = async () => {
    try {
      let defaultName = "musahhih-tashih.json";
      let baseName = "Bilinmeyen_PDF";
      if (currentPdfPath) {
        baseName = currentPdfPath.split(/[/\\]/).pop();
        const baseNameWithoutExt = baseName.replace(/\.pdf$/i, '');
        const date = new Date();
        const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
        defaultName = `${baseNameWithoutExt}_${timestamp}.json`;
      }
      
      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: defaultName
      });
      
      if (filePath) {
        const exportData = {
          pdfName: baseName,
          corrections: corrections
        };
        const jsonStr = JSON.stringify(exportData, null, 2);
        await writeTextFile(filePath, jsonStr);
        alert("Dışa aktarma başarılı! Dosya kaydedildi: " + filePath);
      }
    } catch (e) {
      console.error(e);
      alert("Dışa aktarma sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <h3>Tashih Listesi</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-icon" onClick={handleImport} title="İçe Aktar">
            <Upload size={20} />
          </button>
          <button className="btn-icon" onClick={handleExport} title="Dışa Aktar">
            <Download size={20} />
          </button>
        </div>
      </div>
      <div className="sidebar-content">
        {corrections.map((c) => (
          <div 
            key={c.id} 
            className={`correction-card ${c.id === selectedCorrectionId ? 'selected' : ''}`}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: c.id === selectedCorrectionId ? '1px solid var(--accent-color)' : '1px solid var(--panel-border)',
              opacity: c.isCompleted ? 0.6 : 1,
              cursor: 'pointer'
            }}
            onClick={() => setSelectedCorrection(c.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className={`type-badge ${c.type}`}>{c.type === 'delete' ? 'Sil' : c.type === 'insert' ? 'Ekle' : c.type === 'replace' ? 'Değiştir' : 'Boşluk'}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sayfa {c.pageNum}</span>
            </div>
            
            {c.type === 'replace' && (
              <div style={{ textDecoration: 'line-through', color: 'var(--delete-color)', fontSize: '14px', marginBottom: '4px' }}>
                {c.oldText}
              </div>
            )}
            {(c.type === 'insert' || c.type === 'replace') && (
              <div style={{ color: 'var(--insert-color)', fontSize: '14px' }}>
                {c.newText}
              </div>
            )}
            {c.type === 'space' && (
              <div style={{ color: 'var(--space-color)', fontSize: '14px', fontStyle: 'italic' }}>
                Araya boşluk eklenecek
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); toggleCompletion(c.id); }} style={{ color: c.isCompleted ? 'var(--insert-color)' : 'var(--text-muted)' }}>
                <Check size={18} />
              </button>
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); deleteCorrection(c.id); }} style={{ color: 'var(--delete-color)' }}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {corrections.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
            Henüz düzeltme eklenmedi.
          </div>
        )}
      </div>
    </div>
  );
}
