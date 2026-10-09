import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useStore } from "../store";
import { ZoomIn, ZoomOut, X, Eraser, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default function Workspace() {
  const { currentPdfData, numPages, setNumPages, corrections, addCorrection, updateCorrection, selectedCorrectionId } = useStore();
  const [scale, setScale] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [popover, setPopover] = useState(null);
  const [popoverAction, setPopoverAction] = useState(null);
  const [popoverInput1, setPopoverInput1] = useState('');
  const [popoverInput2, setPopoverInput2] = useState('');
  const [draggingItem, setDraggingItem] = useState(null);
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleSelectionMouseUp = (e) => {
    if (popover) {
      // Allow clicking elsewhere to close popover
      const popoverEl = e.target.closest('.popover-panel');
      if (!popoverEl) {
        closePopover();
      }
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
      setPopoverInput1(text);
    } else {
      const rect = pageEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setPopover({ x, y, pageNum: currentPage });
    }
  };

  const handleGlobalMouseMove = (e) => {
    if (!draggingItem) return;
    const pageEl = containerRef.current.querySelector('.react-pdf__Page');
    if (!pageEl) return;
    
    const rect = pageEl.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    setDraggingItem(prev => ({
      ...prev,
      dragX: x - prev.offsetX,
      dragY: y - prev.offsetY
    }));
  };

  const handleGlobalMouseUp = (e) => {
    if (draggingItem) {
      updateCorrection(draggingItem.id, { dragX: draggingItem.dragX, dragY: draggingItem.dragY });
      setDraggingItem(null);
    } else {
      handleSelectionMouseUp(e);
    }
  };

  const startDrag = (e, correction) => {
    e.stopPropagation();
    const pageEl = containerRef.current.querySelector('.react-pdf__Page');
    if (!pageEl) return;
    
    const rect = pageEl.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;
    
    let origX, origY;
    if (correction.dragX !== undefined) {
      origX = correction.dragX;
      origY = correction.dragY;
    } else {
      const isBubble = correction.type === 'replace' || correction.type === 'insert';
      if (correction.rects && correction.rects.length > 0) {
        const lastRect = correction.rects[correction.rects.length - 1];
        origX = lastRect.x + lastRect.width + (isBubble ? 16 / scale : 0);
        origY = lastRect.y + (lastRect.height / 2);
      } else {
        origX = correction.x + (isBubble ? 16 / scale : 0);
        origY = correction.y;
      }
    }

    setDraggingItem({
      id: correction.id,
      offsetX: currentX - origX,
      offsetY: currentY - origY,
      dragX: origX,
      dragY: origY
    });
  };

  const closePopover = () => {
    setPopover(null);
    setPopoverAction(null);
    setPopoverInput1('');
    setPopoverInput2('');
  };

  const handleAddPin = (type, oldText, newText) => {
    addCorrection({
      type,
      oldText,
      newText,
      pageNum: popover.pageNum,
      x: popover.x,
      y: popover.y,
      rects: popover.rects || [],
    });
    closePopover();
  };

  const handleActionClick = (type) => {
    if (type === 'delete') {
      handleAddPin('delete', '', '');
    } else if (type === 'space') {
      handleAddPin('space', '', ' ');
    } else if (type === 'join') {
      handleAddPin('join', '', '');
    } else {
      setPopoverAction(type);
      setPopoverInput1('');
      setPopoverInput2('');
    }
  };

  const handleSubmitAction = () => {
    if (popoverAction === 'insert') {
      handleAddPin('insert', '', popoverInput1);
    } else if (popoverAction === 'replace') {
      handleAddPin('replace', popoverInput1, popoverInput2);
    }
  };

  const pageCorrections = corrections.filter(c => c.pageNum === currentPage);

  return (
    <div 
      className={`workspace ${draggingItem ? 'dragging-active' : ''}`} 
      ref={containerRef} 
      onMouseUp={handleGlobalMouseUp} 
      onMouseMove={handleGlobalMouseMove}
      style={{ overflowY: 'auto', padding: '40px' }}
    >
      
      {currentPdfData && (
        <div className="pdf-page-container">
          <Document file={currentPdfData} onLoadSuccess={onDocumentLoadSuccess} onLoadError={(error) => console.error('Document Error:', error)}>
            <Page pageNumber={currentPage} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
          </Document>

          {/* SVG Bağlantı Çizgileri */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 15 }}>
            {pageCorrections.map(c => {
               const dragX = draggingItem?.id === c.id ? draggingItem.dragX : c.dragX;
               const dragY = draggingItem?.id === c.id ? draggingItem.dragY : c.dragY;
               if (dragX !== undefined && dragY !== undefined) {
                 let origX = c.x;
                 let origY = c.y;
                 if (c.rects && c.rects.length > 0) {
                   const lastRect = c.rects[c.rects.length - 1];
                   origX = lastRect.x + lastRect.width;
                   origY = lastRect.y + lastRect.height / 2;
                 }
                 // Adjust line destination slightly to not overlap completely with the center of the bubble
                 let strokeColor = 'rgba(239, 68, 68, 0.7)'; // delete
                 if (c.type === 'space') strokeColor = 'rgba(234, 179, 8, 0.7)';
                 if (c.type === 'replace') strokeColor = 'rgba(245, 158, 11, 0.7)';
                 if (c.type === 'insert') strokeColor = 'rgba(34, 197, 94, 0.7)';
                 if (c.type === 'join') strokeColor = 'rgba(168, 85, 247, 0.7)';
                 
                 return (
                   <line 
                     key={`line-${c.id}`} 
                     x1={origX * scale} y1={origY * scale} 
                     x2={dragX * scale} y2={dragY * scale} 
                     stroke={strokeColor}
                     strokeWidth="2"
                     strokeDasharray="4"
                   />
                 )
               }
               return null;
            })}
          </svg>

          {/* İğneler (Pins) ve Seçim Alanları (Rects) */}
          {pageCorrections.map(c => {
            const dragX = draggingItem?.id === c.id ? draggingItem.dragX : c.dragX;
            const dragY = draggingItem?.id === c.id ? draggingItem.dragY : c.dragY;
            const isBubble = c.type === 'replace' || c.type === 'insert';

            // First render rects if they exist
            const rectsRender = c.rects && c.rects.length > 0 ? c.rects.map((rect, i) => (
              <div
                key={`${c.id}-${i}`}
                className={`selection-rect ${c.type}`}
                style={{
                  left: `${rect.x * scale}px`,
                  top: `${rect.y * scale}px`,
                  width: `${rect.width * scale}px`,
                  height: `${rect.height * scale}px`,
                  border: c.id === selectedCorrectionId ? '1px solid white' : ''
                }}
              />
            )) : null;

            // Determine origin for bubble/pin
            let originX, originY;
            if (c.rects && c.rects.length > 0) {
              const lastRect = c.rects[c.rects.length - 1];
              originX = lastRect.x + lastRect.width;
              originY = lastRect.y + lastRect.height / 2;
            } else {
              originX = c.x;
              originY = c.y;
            }

            const bLeft = dragX !== undefined ? (dragX * scale) : (originX * scale + (isBubble ? 16 : 0));
            const bTop = dragY !== undefined ? (dragY * scale) : (originY * scale);

            return (
              <div key={c.id}>
                {rectsRender}
                
                {isBubble ? (
                  <div 
                    className={`speech-bubble draggable ${c.type}`}
                    onMouseDown={(e) => startDrag(e, c)}
                    style={{
                      left: `${bLeft}px`,
                      top: `${bTop}px`,
                      boxShadow: c.id === selectedCorrectionId ? '0 0 0 2px white' : '',
                      background: c.type === 'insert' ? 'var(--insert-color)' : 'var(--replace-color)'
                    }}
                  >
                    {c.newText}
                  </div>
                ) : (() => {
                  const bLeft = dragX !== undefined ? dragX * scale : c.x * scale;
                  const bTop = dragY !== undefined ? dragY * scale : c.y * scale;
                  const isPin = c.type === 'space' || c.type === 'join' || c.type === 'delete';
                  
                  let content = c.id.slice(-2);
                  if (c.type === 'space') content = '^';
                  if (c.type === 'join') content = '><';
                  if (c.type === 'delete') content = <Eraser size={20} />;

                  return (
                    <div 
                      key={c.id} 
                      className={`pin ${isPin ? `${c.type} draggable` : ''} ${c.isCompleted ? 'completed' : ''}`}
                      onMouseDown={isPin ? (e) => startDrag(e, c) : undefined}
                      style={{ 
                        left: `${bLeft}px`, 
                        top: `${bTop}px`, 
                        border: c.id === selectedCorrectionId && !isPin ? '2px solid white' : 'none',
                        textShadow: c.id === selectedCorrectionId && (c.type === 'space' || c.type === 'join') ? '0 0 15px white' : ''
                      }}
                      title={`${c.type} - ${c.newText || 'Silinecek'}`}
                    >
                      {content}
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Geçici Seçim Gösterimi */}
          {popover && popover.rects && popover.rects.map((rect, i) => (
             <div
               key={`temp-${i}`}
               style={{
                 position: 'absolute',
                 pointerEvents: 'none',
                 backgroundColor: 'rgba(99, 102, 241, 0.2)',
                 left: `${rect.x * scale}px`,
                 top: `${rect.y * scale}px`,
                 width: `${rect.width * scale}px`,
                 height: `${rect.height * scale}px`,
                 zIndex: 5
               }}
             />
          ))}

          {/* Yeni Pin Ekleme Menüsü */}
          {popover && (
            <div className="glass-panel popover-panel" style={{ 
              position: 'absolute', 
              left: `${popover.x * scale}px`, 
              top: `${popover.y * scale}px`, 
              padding: '16px', 
              borderRadius: '8px', 
              zIndex: 100,
              minWidth: '280px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>Düzeltme Ekle</h4>
                <button className="btn-icon" onClick={closePopover} style={{ padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>
              
              {!popoverAction ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ background: 'var(--delete-color)', flex: 1, padding: '8px' }} onClick={() => handleActionClick('delete')}>Sil</button>
                    <button className="btn" style={{ background: 'var(--space-color)', flex: 1, padding: '8px', color: '#000' }} onClick={() => handleActionClick('space')}>Boşluk</button>
                    <button className="btn" style={{ background: 'var(--join-color)', flex: 1, padding: '8px' }} onClick={() => handleActionClick('join')}>Birleştir</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ background: 'var(--insert-color)', flex: 1, padding: '8px' }} onClick={() => handleActionClick('insert')}>Ekle</button>
                    <button className="btn" style={{ background: 'var(--replace-color)', flex: 1, padding: '8px' }} onClick={() => handleActionClick('replace')}>Değiştir</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {popoverAction === 'replace' && (
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Eski Metin" 
                      value={popoverInput1} 
                      onChange={e => setPopoverInput1(e.target.value)} 
                      autoFocus
                    />
                  )}
                  {popoverAction === 'insert' && (
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Eklenecek Metin" 
                      value={popoverInput1} 
                      onChange={e => setPopoverInput1(e.target.value)} 
                      autoFocus
                    />
                  )}
                  {popoverAction === 'replace' && (
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Yeni Metin" 
                      value={popoverInput2} 
                      onChange={e => setPopoverInput2(e.target.value)} 
                    />
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPopoverAction(null)}>Geri</button>
                    <button className="btn" style={{ background: 'var(--accent-color)', flex: 1 }} onClick={handleSubmitAction}>Tamam</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Araç Çubuğu */}
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
