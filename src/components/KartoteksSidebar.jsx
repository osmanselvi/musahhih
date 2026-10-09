import { useState } from "react";
import { useStore } from "../store";
import { Trash2, Download, Upload, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

export default function KartoteksSidebar() {
  const { cards, updateCard, deleteCard, currentPdfPath, loadState } = useStore();
  const [expandedCardId, setExpandedCardId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedCardId(prev => prev === id ? null : id);
  };

  const handleCopy = (card, e) => {
    e.stopPropagation();
    // Format: "Bilgi" - Yazar, Kitap, Konu, s. Sayfa
    const kitapStr = card.kitap ? `${card.kitap}, ` : '';
    const yazarStr = card.yazar ? `${card.yazar}, ` : '';
    const text = `"${card.bilgi}" - ${yazarStr}${kitapStr}${card.konu || 'Genel Konu'}, s. ${card.sayfa || '-'}`;
    navigator.clipboard.writeText(text).then(() => {
      // Opt: show a small toast or alert
    }).catch(err => {
      console.error('Kopyalama başarısız:', err);
    });
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteCard(id);
  };

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
        
        if (parsedData && parsedData.cards) {
          const currentBaseName = currentPdfPath ? currentPdfPath.split(/[/\\]/).pop() : "";
          if (parsedData.pdfName && parsedData.pdfName !== currentBaseName) {
            alert(`Uyarı: Bu kartoteks dosyası "${parsedData.pdfName}" adlı belgeye aittir!\n\nŞu anki belge: "${currentBaseName}"\n\nYanlış dosya eşleşmesi. İşlem iptal edildi.`);
            return;
          }
          loadState({ cards: parsedData.cards });
          alert("Kartoteks başarıyla yüklendi!");
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
      let defaultName = "musahhih-kartoteks.json";
      let baseName = "Bilinmeyen_PDF";
      if (currentPdfPath) {
        baseName = currentPdfPath.split(/[/\\]/).pop();
        const baseNameWithoutExt = baseName.replace(/\.pdf$/i, '');
        const date = new Date();
        const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
        defaultName = `${baseNameWithoutExt}_kartoteks_${timestamp}.json`;
      }
      
      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: defaultName
      });
      
      if (filePath) {
        const exportData = {
          pdfName: baseName,
          cards: cards
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
    <div className="sidebar glass-panel" style={{ minWidth: '350px' }}>
      <div className="sidebar-header">
        <h3>Kartoteks Fişleri</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-icon" onClick={handleImport} title="İçe Aktar">
            <Upload size={20} />
          </button>
          <button className="btn-icon" onClick={handleExport} title="Dışa Aktar">
            <Download size={20} />
          </button>
        </div>
      </div>
      <div className="sidebar-content" style={{ padding: '16px' }}>
        {cards.map((c) => {
          const isExpanded = expandedCardId === c.id;
          return (
            <div 
              key={c.id} 
              className="correction-card"
              style={{ 
                background: isExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', 
                borderRadius: '8px', 
                border: isExpanded ? '1px solid var(--accent-color)' : '1px solid var(--panel-border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'all 0.2s'
              }}
            >
              {/* Accordion Header */}
              <div 
                onClick={() => toggleExpand(c.id)}
                style={{ 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontWeight: isExpanded ? '600' : '500',
                  color: isExpanded ? 'var(--text-main)' : 'var(--text-muted)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.konu || 'Konu Belirtilmemiş'}
                  </span>
                </div>
                {!isExpanded && (
                  <button className="btn-icon" onClick={(e) => handleDelete(c.id, e)} style={{ color: 'var(--delete-color)', padding: '2px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {/* Accordion Body */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Yazar" 
                      value={c.yazar || ''} 
                      onChange={(e) => updateCard(c.id, { yazar: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Sayfa" 
                      value={c.sayfa || ''} 
                      onChange={(e) => updateCard(c.id, { sayfa: e.target.value })}
                      style={{ width: '60px' }}
                    />
                  </div>

                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Kitap Künyesi (Adı vb.)" 
                    value={c.kitap || ''} 
                    onChange={(e) => updateCard(c.id, { kitap: e.target.value })}
                  />
                  
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Konu" 
                    value={c.konu || ''} 
                    onChange={(e) => updateCard(c.id, { konu: e.target.value })}
                  />
                  
                  <textarea 
                    className="input-field" 
                    placeholder="Alıntı/Bilgi" 
                    value={c.bilgi || ''} 
                    onChange={(e) => updateCard(c.id, { bilgi: e.target.value })}
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={(e) => handleCopy(c, e)} 
                      title="Formatlı Kopyala"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                    >
                      <Copy size={16} /> Kopyala
                    </button>
                    
                    <button className="btn-icon" onClick={(e) => handleDelete(c.id, e)} style={{ color: 'var(--delete-color)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {cards.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
            Henüz kartoteks fişi eklenmedi.<br/><br/>
            PDF üzerinden metin seçerek ilk fişinizi oluşturabilirsiniz.
          </div>
        )}
      </div>
    </div>
  );
}
