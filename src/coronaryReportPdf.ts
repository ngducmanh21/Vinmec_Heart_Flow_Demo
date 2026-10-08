import { DEMO_CASE, DEMO_LESIONS, DEMO_PLAQUE_TOTAL_MM3, TPV_BANDS, tpvBandIndex, type DemoLesion, type DemoPlans } from './coronaryDemoData'

// Small browser-only vector PDF. Standard PDF fonts, English ASCII labels;
// no remote service, font download, or clinical calculations are involved.
export function createCoronaryReportPdf(selectedId: DemoLesion['id'], plans: DemoPlans): Uint8Array {
  const commands: string[]=[]
  const safe=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ').replace(/([\\()])/g,'\\$1')
  const text=(s:string,x:number,y:number,size=10,bold=false,color='0.14 0.27 0.32')=>commands.push(`BT /${bold?'F2':'F1'} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${safe(s)}) Tj ET`)
  const rect=(x:number,y:number,w:number,h:number,color:string)=>commands.push(`${color} rg ${x} ${y} ${w} ${h} re f`)
  const line=(x:number,y:number,x2:number,y2:number,color='0.79 0.87 0.88')=>commands.push(`${color} RG 0.6 w ${x} ${y} m ${x2} ${y2} l S`)
  rect(0,0,595,842,'0.98 0.99 0.99')
  rect(0,738,595,104,'0.03 0.15 0.21')
  text('CARDIOFLOW LAB',42,808,10,true,'0.44 0.82 0.76')
  text('Coronary showcase report',42,776,24,true,'1 1 1')
  text(`${DEMO_CASE.id}  |  SYNTHETIC DATA  |  Selected: ${selectedId}`,42,754,10,false,'0.74 0.88 0.88')
  rect(42,686,511,35,'1 0.95 0.82')
  text('DEMO ONLY - no patient images, computed FFR_CT, or treatment recommendation.',53,706,9,true)
  text('All values and geometry are synthetic presets. The PCI plan is a visual exercise.',53,693,9)
  const metrics=[['TOTAL PLAQUE',`${DEMO_PLAQUE_TOTAL_MM3} mm3`],['TPV BAND',TPV_BANDS[tpvBandIndex(DEMO_PLAQUE_TOTAL_MM3)].label],['LESIONS / BRANCHES',`${DEMO_LESIONS.length} / 3`]]
  metrics.forEach(([label,value],i)=>{rect(42+i*174,612,163,56,'0.9 0.96 0.95');text(label,52+i*174,649,8,true);text(value,52+i*174,625,19,true)})
  text('Lesion register - preset anatomy and pressure ratios',42,585,13,true)
  rect(42,552,511,22,'0.12 0.34 0.4')
  const columns=[42,91,160,243,324,405]
  ;['ID / artery','Narrowing','Length (mm)','Proximal','Distal','Plaque (mm3)'].forEach((label,i)=>text(label,columns[i]+7,560,8,true,'1 1 1'))
  DEMO_LESIONS.forEach((l,i)=>{
    const y=526-i*27
    if(l.id===selectedId)rect(42,y-7,511,27,'0.91 0.97 0.94')
    const total=l.plaqueMm3.calcified+l.plaqueMm3.nonCalcified+l.plaqueMm3.lowAttenuation
    ;[`${l.id} ${l.branchLabel}`,`${l.severityPct}%`,`${l.lengthMm}`,l.proximalRatio.toFixed(2),l.distalRatio.toFixed(2),`${total}`].forEach((value,j)=>text(value,columns[j]+7,y,9,l.id===selectedId))
    line(42,y-7,553,y-7)
  })
  text('Saved virtual PCI plans',42,410,13,true)
  text('Length and angles reflect the controls selected in the demo.',42,394,9)
  rect(42,362,511,22,'0.12 0.34 0.4')
  const planCols=[49,150,275,412]
  ;['Lesion / artery','Virtual stent','C-arm horizontal','C-arm vertical'].forEach((label,i)=>text(label,planCols[i],370,8,true,'1 1 1'))
  DEMO_LESIONS.forEach((l,i)=>{
    const p=plans[l.id],y=338-i*25
    ;[`${l.id} ${l.branchLabel}`,`${p.stentLength} mm`,`${p.lao>=0?'LAO':'RAO'} ${Math.abs(p.lao)} deg`,`${p.cranial>=0?'Cranial':'Caudal'} ${Math.abs(p.cranial)} deg`].forEach((value,j)=>text(value,planCols[j],y,9,l.id===selectedId))
    line(42,y-7,553,y-7)
  })
  rect(42,213,511,30,'0.9 0.95 0.97')
  text('LAD contains sequential lesions L1 and L4 in the shared synthetic model.',53,225,9,true)
  text('Reading this demo',42,186,12,true)
  text('3D probes, straightened vessel and cross-sections share a branch position.',42,166,9)
  text('TPV bands: 0 | 1-100 | 101-250 | 251-750 | >750 mm3.',42,150,9)
  text('Changing virtual stent length does not solve or predict blood flow.',42,134,9)
  text('PACS / EMR delivery controls are local simulations. No data is transmitted.',42,118,9)
  text('Feature references: heartflow.com/heartflow-one/',42,90,8)
  line(42,69,553,69)
  text('SIM-COR-01 - EDUCATIONAL SHOWCASE',42,49,8,true)
  text('1 / 1',523,49,8)
  const stream=commands.join('\n')
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf='%PDF-1.4\n', offsets=[0]
  objects.forEach((body,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${body}\nendobj\n`})
  const xref=pdf.length
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new TextEncoder().encode(pdf)
}
