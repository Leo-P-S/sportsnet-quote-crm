import React, { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { numeroALetras } from '../utils/numeroALetras'

export default function InvoiceView({ data, user, onNew }) {
  const invoiceRef = useRef(null)

  const downloadPDF = async () => {
    const element = invoiceRef.current
    if (!element) return

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Proforma_${data.code || 'DOC'}.pdf`)
    } catch (err) {
      console.error('Error generando PDF', err)
      alert('Hubo un error al generar el PDF')
    }
  }

  const shareAsImage = async () => {
    const element = invoiceRef.current
    if (!element) return

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Proforma_${data.code || 'DOC'}.png`, { type: 'image/png' })
        
        // Use Web Share API if available
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Proforma ${data.code || 'DOC'}`,
              text: `Adjunto proforma ${data.code || 'DOC'}`,
              files: [file]
            })
            return; // Success
          } catch (shareErr) {
            console.log('Share failed or unsupported:', shareErr)
            // Fallback to download if it's not a user cancellation
            if (shareErr.name !== 'AbortError') {
              fallbackDownload(canvas, data.code)
            }
          }
        } else {
          // Fallback if no share API
          fallbackDownload(canvas, data.code)
        }
      }, 'image/png')
    } catch (err) {
      console.error('Error generando Imagen', err)
      alert('Hubo un error al generar la imagen')
    }
  }

  const fallbackDownload = (canvas, code) => {
    const imgData = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `Proforma_${code || 'DOC'}.png`
    link.href = imgData
    link.click()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Fallbacks if data doesn't contain populated customer
  const custName = data.customer?.name || data.customerNameTemp || 'CLIENTE SIN NOMBRE'
  const custRuc = data.customer?.ruc || data.customerRucTemp || '-'
  const custAddress = data.customer?.address || data.customerAddressTemp || '-'

  return (
    <div className="invoice-preview-container">
      <div className="invoice-actions">
        <button onClick={onNew} className="btn btn-secondary">← Volver / Nueva Proforma</button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={shareAsImage} className="btn" style={{ background: '#10b981', color: '#fff' }}>🖼️ Compartir Foto</button>
          <button onClick={downloadPDF} className="btn btn-primary">📄 Descargar PDF</button>
        </div>
      </div>

      <div className="invoice-paper" ref={invoiceRef}>
        {/* Header */}
        <div className="invoice-header">
          <div className="invoice-company">
            {user?.logoBase64 ? (
              <img src={user.logoBase64} alt="Logo Empresa" style={{width:'100px', height:'100px', objectFit:'contain'}} />
            ) : (
              <div style={{width: '100px', height: '100px'}}></div>
            )}
            <div className="invoice-company-details">
              <h2>{user?.companyName || 'EMPRESA EJEMPLO EIRL'}</h2>
              <p>{user?.address || 'Dirección de la empresa'}</p>
            </div>
          </div>
          
          <div className="invoice-box-type">
            <h3>PROFORMA / COTIZACIÓN</h3>
            <p>RUC: {user?.ruc || '00000000000'}</p>
            <p className="invoice-number">{data.code}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="invoice-info">
          <table className="info-table">
            <tbody>
              <tr>
                <td width="150"><strong>Fecha de Emisión</strong></td>
                <td width="20">:</td>
                <td>{formatDate(data.createdAt)}</td>
                <td width="150"><strong>Forma de pago</strong></td>
                <td width="20">:</td>
                <td>Contado</td>
              </tr>
              <tr>
                <td><strong>Señor(es)</strong></td>
                <td>:</td>
                <td colSpan="4">{custName}</td>
              </tr>
              <tr>
                <td><strong>RUC / DNI</strong></td>
                <td>:</td>
                <td colSpan="4">{custRuc}</td>
              </tr>
              <tr>
                <td><strong>Dirección del Cliente</strong></td>
                <td>:</td>
                <td colSpan="4">{custAddress}</td>
              </tr>
              <tr>
                <td><strong>Tipo de Moneda</strong></td>
                <td>:</td>
                <td colSpan="4">{data.currency || 'SOLES'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Items Table */}
        <table className="invoice-items">
          <thead>
            <tr>
              <th>Cantidad</th>
              <th>Unidad Medida</th>
              <th>Descripción</th>
              {data.igv > 0 ? (
                <>
                  <th>V. Unitario (Sin IGV)</th>
                  <th>V. Unitario (Con IGV)</th>
                </>
              ) : (
                <th>V. Unitario</th>
              )}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item, idx) => {
              let isReverse = false;
              let rawItemsTotal = data.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
              if (Math.abs(data.total - rawItemsTotal) < 0.1) isReverse = true;
              
              let vUnitSin = item.unitPrice;
              let vUnitCon = item.unitPrice;
              let itemTotal = item.totalPrice; 
              
              if (data.igv > 0) {
                if (isReverse) {
                  vUnitCon = item.unitPrice;
                  vUnitSin = item.unitPrice / 1.18;
                } else {
                  vUnitSin = item.unitPrice;
                  vUnitCon = item.unitPrice * 1.18;
                  itemTotal = item.totalPrice * 1.18;
                }
              }

              return (
                <tr key={idx}>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>{item.description}</td>
                  {data.igv > 0 ? (
                    <>
                      <td>{Number(vUnitSin).toFixed(4)}</td>
                      <td>{Number(vUnitCon).toFixed(4)}</td>
                    </>
                  ) : (
                    <td>{Number(vUnitSin).toFixed(4)}</td>
                  )}
                  <td>{Number(itemTotal).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="invoice-footer">
          <div className="invoice-words">
            <strong>SON: </strong> {numeroALetras(data.total)} SOLES
          </div>
          
          <table className="invoice-totals">
            <tbody>
              <tr>
                <td>Sub Total Ventas</td>
                <td>:</td>
                <td>S/ {Number(data.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td>IGV</td>
                <td>:</td>
                <td>S/ {Number(data.igv).toFixed(2)}</td>
              </tr>
              <tr className="grand-total-row">
                <td>Importe Total</td>
                <td>:</td>
                <td>S/ {Number(data.total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="invoice-disclaimer">
          Esta es una proforma generada por SportNet CRM.
        </div>
      </div>
    </div>
  )
}
