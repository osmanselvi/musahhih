import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useStore } from "../store";
import { ZoomIn, ZoomOut, X, Plus, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Copy } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default function KartoteksWorkspace() {
  const { currentPdfData, numPages, setNumPages, addCard, currentPdfPath } = useStore();
  const [scale, setScale] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [popover, setPopover] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleSelectionMouseUp = (e) => {
    // If clicking inside context menu, let it handle itself
    if (e.target.closest('.context-menu')) return;
    
    setContextMenu(null);

    if (popover) {
      const popoverEl = e.target.closest('.popover-panel');
      if (!popoverEl) closePopover();
      return;
    }
    
    const pageEl = e.target.closest('.react-pdf__Page');
    if (!pageEl) return;

    const selection = window.getSelection();
    if (!selection.isCollapsed) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rects = Array.from(range.getClientRects());
      const pageRect = pageEl.getBoundingClientRect();
      
      const normalizedRects = rects.map(r => ({
        x: (r.left - pageRect.left) / scale,
        y: (r.top - pageRect.top) / scale,
        width: r.width / scale,
        height: r.height / scale,
      }));

      const lastRect = normalizedRects[normalizedRects.length - 1];
      selection.removeAllRanges();

      setPopover({ 
        x: lastRect.x + lastRect.width, 
        y: lastRect.y, 
        pageNum: currentPage, 
        text, 
        rects: normalizedRects 
      });
    }
  };

  const handleContextMenu = (e) => {
    const selection = window.getSelection();
    let text = "";
    
    if (popover) {
      text = popover.text;
    } else if (!selection.isCollapsed) {
      text = selection.toString().trim();
    }

    if (text) {
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        text: text
      });
    }
  };

  const closePopover = () => {
    setPopover(null);
  };

  const handleAddCard = () => {
    if (popover) {
      let bookName = "";
      if (currentPdfPath) {
        bookName = currentPdfPath.split(/[/\\]/).pop().replace(/\.pdf$/i, '');
      }
      
      addCard({
        yazar: '',
        kitap: bookName,
        konu: '',
        bilgi: popover.text,
        sayfa: popover.pageNum.toString()
      });
      closePopover();
    }
  };

  const handleCopyText = (text) => {
    if (text) {
      navigator.clipboard.writeText(text).catch(err => console.error(err));
      closePopover();
      setContextMenu(null);
    }
  };

  return (
    <div className="workspace" ref={containerRef} onMouseUp={handleSelectionMouseUp} onContextMenu={handleContextMenu}>
      {currentPdfData && (
        <div className="pdf-page-container">
          <Document file={currentPdfData} onLoadSuccess={onDocumentLoadSuccess}>
            <Page 
              pageNumber={currentPage} 
              scale={scale} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>

          {popover && popover.rects && popover.rects.map((rect, i) => (
             <div
               key={`temp-${i}`}
               style={{
                 position: 'absolute',
                 pointerEvents: 'none',
                 backgroundColor: 'rgba(59, 130, 246, 0.2)',
                 left: `${rect.x * scale}px`,
                 top: `${rect.y * scale}px`,
                 width: `${rect.width * scale}px`,
                 height: `${rect.height * scale}px`,
                 zIndex: 5
               }}
             />
          ))}

          {popover && (
            <div className="glass-panel popover-panel" style={{ 
              position: 'absolute', 
              left: `${popover.x * scale}px`, 
              top: `${popover.y * scale}px`, 
              padding: '12px', 
              borderRadius: '8px', 
              zIndex: 100,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              gap: '8px'
            }}>
              <button className="btn btn-secondary" onClick={() => handleCopyText(popover.text)}>
                <Copy size={16} style={{ marginRight: '6px' }} /> Kopyala
              </button>
              <button className="btn" style={{ background: 'var(--accent-color)' }} onClick={handleAddCard}>
                <Plus size={16} style={{ marginRight: '6px' }} /> Kartotekse Ekle
              </button>
              <button className="btn-icon" onClick={closePopover}>
                <X size={18} />
              </button>
            </div>
          )}
          
          {contextMenu && (
            <div className="glass-panel context-menu" style={{ 
              position: 'absolute', 
              left: `${contextMenu.x}px`, 
              top: `${contextMenu.y}px`, 
              padding: '8px', 
              borderRadius: '8px', 
              zIndex: 200,
              boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '150px'
            }}>
              <button className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', border: 'none' }} onClick={() => handleCopyText(contextMenu.text)}>
                <Copy size={16} style={{ marginRight: '8px' }} /> Metni Kopyala
              </button>
            </div>
          )}
        </div>
      )}

      <div className="toolbar glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn-icon" onClick={() => setScale(s => s - 0.2)}><ZoomOut size={20}/></button>
        <span style={{ display: 'flex', alignItems: 'center', minWidth: '40px', justifyContent: 'center' }}>{Math.round(scale * 100)}%</span>
        <button className="btn-icon" onClick={() => setScale(s => s + 0.2)}><ZoomIn size={20}/></button>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--panel-border)', margin: '0 8px' }}></div>
        
        <button className="btn-icon" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1} title="İlk Sayfa"><ChevronsLeft size={20}/></button>
        <button className="btn-icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} title="Önceki Sayfa"><ChevronLeft size={20}/></button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px' }}>
          <input 
            type="number" 
            className="input-field" 
            style={{ width: '60px', padding: '4px 8px', textAlign: 'center', margin: 0, height: '32px' }} 
            value={currentPage} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= (numPages || 1)) {
                setCurrentPage(val);
              }
            }}
            min={1}
            max={numPages || 1}
          />
          <span style={{ color: 'var(--text-muted)' }}>/ {numPages || '-'}</span>
        </div>
        
        <button className="btn-icon" onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))} disabled={currentPage >= numPages} title="Sonraki Sayfa"><ChevronRight size={20}/></button>
        <button className="btn-icon" onClick={() => setCurrentPage(numPages)} disabled={currentPage >= numPages} title="Son Sayfa"><ChevronsRight size={20}/></button>
      </div>
    </div>
  );
}
