/* ==========================================================================
   ENCO Portal Web · exportação de relatórios sem bibliotecas externas
   - ENCO.exporta.xlsx(nomeArquivo, abas): gera um .xlsx de verdade (Office Open XML
     empacotado num ZIP sem compressão), com uma aba por item de 'abas':
       { nome: 'Planos', colunas: [{ titulo }], linhas: [[...], ...] }  (largura das colunas calculada pelo conteúdo)
     Opcional: cabecalho: { titulo, subtitulo, logo } põe logo, título e filtros no topo da aba (a tabela começa na linha 4).
   - ENCO.exporta.pdf(titulo, html): abre a impressão do navegador com o relatório
     formatado; o usuário escolhe "Salvar como PDF".
   Funciona com o index.html aberto direto do disco (file://).
   ========================================================================== */
(function () {
  var ENCO = window.ENCO;

  /* ---------- ZIP (método "store") ---------- */
  var CRC = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    function hdr(size) { var b = new Uint8Array(size); return { b: b, v: new DataView(b.buffer) }; }
    files.forEach(function (f) {
      var name = enc.encode(f.nome), data = f.conteudo instanceof Uint8Array ? f.conteudo : enc.encode(f.conteudo), crc = crc32(data);
      var l = hdr(30);
      l.v.setUint32(0, 0x04034b50, true); l.v.setUint16(4, 20, true); l.v.setUint16(6, 0x0800, true); l.v.setUint16(8, 0, true);
      l.v.setUint16(10, time, true); l.v.setUint16(12, date, true); l.v.setUint32(14, crc, true);
      l.v.setUint32(18, data.length, true); l.v.setUint32(22, data.length, true); l.v.setUint16(26, name.length, true); l.v.setUint16(28, 0, true);
      var c = hdr(46);
      c.v.setUint32(0, 0x02014b50, true); c.v.setUint16(4, 20, true); c.v.setUint16(6, 20, true); c.v.setUint16(8, 0x0800, true); c.v.setUint16(10, 0, true);
      c.v.setUint16(12, time, true); c.v.setUint16(14, date, true); c.v.setUint32(16, crc, true);
      c.v.setUint32(20, data.length, true); c.v.setUint32(24, data.length, true); c.v.setUint16(28, name.length, true);
      c.v.setUint32(42, offset, true);
      parts.push(l.b, name, data); central.push(c.b, name);
      offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (s, b) { return s + b.length; }, 0), e = hdr(22);
    e.v.setUint32(0, 0x06054b50, true); e.v.setUint16(8, files.length, true); e.v.setUint16(10, files.length, true);
    e.v.setUint32(12, size, true); e.v.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [e.b]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ---------- XLSX ---------- */
  function x(s) { return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function col(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; }
  function cell(ref, v, estilo) {
    var st = estilo ? ' s="' + estilo + '"' : '';
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
    return '<c r="' + ref + '" t="inlineStr"' + st + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
  }
  /* Cabeçalho opcional no topo da aba (mesmo padrão do PDF): logo do ENCO, título e filtros aplicados.
     aba.cabecalho = { titulo, subtitulo, logo (data URI PNG) }. A tabela começa na linha 4. */
  function inicio(aba) { return aba.cabecalho ? 4 : 1; }
  function temLogo(aba) { return !!(aba.cabecalho && /^data:image\/png/.test(aba.cabecalho.logo || '')); }
  function sheet(aba) {
    var h = inicio(aba), cab = aba.cabecalho;
    /* Largura de cada coluna pelo maior conteúdo (cabeçalho + seta do filtro, ou dado), entre 8 e 45.
       Texto maior que a largura quebra linha; a altura da linha acompanha o número de linhas. */
    var LARG_MIN = 8, LARG_MAX = 45;
    function tam(v) { return String(v === null || v === undefined ? '' : v).length; }
    var larg = aba.colunas.map(function (c, i) {
      var m = Math.ceil(tam(c.titulo) * 1.15) + 4;
      aba.linhas.forEach(function (l) { m = Math.max(m, tam(l[i]) + 3); });
      return Math.min(LARG_MAX, Math.max(LARG_MIN, m));
    });
    function linhas(vals, folga) { return vals.reduce(function (m, v, i) { return Math.max(m, Math.ceil((tam(v) + folga) / Math.max(1, larg[i] - 2))); }, 1); }
    aba._largA = larg[0];
    var cols = '<cols>' + larg.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
    var topo = cab ? '<row r="1" ht="30" customHeight="1">' + cell('B1', cab.titulo, 2) + '</row>' +
      '<row r="2" ht="20" customHeight="1">' + cell('B2', cab.subtitulo, 3) + '</row>' +
      '<row r="3" ht="10" customHeight="1"></row>' : '';
    var hh = Math.max(30, linhas(aba.colunas.map(function (c) { return c.titulo; }), 0) * 15 + 6);
    var rows = topo + '<row r="' + h + '" ht="' + hh + '" customHeight="1">' + aba.colunas.map(function (c, i) { return cell(col(i) + h, c.titulo, 1); }).join('') + '</row>' +
      aba.linhas.map(function (l, r) { var n = r + h + 1; return '<row r="' + n + '" ht="' + Math.max(20, linhas(l, 0) * 15 + 5) + '" customHeight="1">' + l.map(function (v, i) { return cell(col(i) + n, v, 4); }).join('') + '</row>'; }).join('');
    var last = col(aba.colunas.length - 1) + (aba.linhas.length + h);
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheetViews><sheetView workbookViewId="0" showGridLines="' + (cab ? 0 : 1) + '"><pane ySplit="' + h + '" topLeftCell="A' + (h + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      cols + '<sheetData>' + rows + '</sheetData><autoFilter ref="A' + h + ':' + last + '"/>' + (cab && cab.logo ? '<drawing r:id="rId1"/>' : '') + '</worksheet>';
  }
  /* Logo: PNG em data URI → bytes; largura e altura lidas do cabeçalho IHDR do PNG */
  function pngBytes(dataUri) {
    var b64 = String(dataUri).split(',')[1] || '', bin = atob(b64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    var v = new DataView(u.buffer);
    return { bytes: u, w: v.getUint32(16), h: v.getUint32(20) };
  }
  /* Logo centralizada na coluna A e na altura das linhas 1 e 2 (título e filtros: 30 + 20 pt = ~67 px) */
  function drawing(png, largColA, n) {
    var alt = 44, larg = Math.round(alt * png.w / png.h), emu = 9525;
    var colPx = Math.floor((largColA || 16) * 7 + 5), dx = Math.max(4, Math.round((colPx - larg) / 2)), dy = Math.max(2, Math.round((67 - alt) / 2));
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>' + (dx * emu) + '</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>' + (dy * emu) + '</xdr:rowOff></xdr:from>' +
      '<xdr:ext cx="' + (larg * emu) + '" cy="' + (alt * emu) + '"/>' +
      '<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="' + (n + 1) + '" name="Logo ENCO ' + n + '" descr="ENCO"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>' +
      '<xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>' +
      '<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + (larg * emu) + '" cy="' + (alt * emu) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic>' +
      '<xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>';
  }
  var REL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  function xlsx(nomeArquivo, abas) {
    var files = [
      { nome: '[Content_Types].xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        abas.map(function (a, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' + (temLogo(a) ? '<Override PartName="/xl/drawings/drawing' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : ''); }).join('') + '</Types>' },
      { nome: '_rels/.rels', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { nome: 'xl/workbook.xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        abas.map(function (a, i) { return '<sheet name="' + x(a.nome).slice(0, 31) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets>' +
        '<definedNames>' + abas.map(function (a, i) { return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + x(a.nome).slice(0, 31) + '\'!$A$' + inicio(a) + ':$' + col(a.colunas.length - 1) + '$' + (a.linhas.length + inicio(a)) + '</definedName>'; }).join('') + '</definedNames></workbook>' },
      { nome: 'xl/_rels/workbook.xml.rels', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        abas.map(function (a, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (abas.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { nome: 'xl/styles.xml', conteudo: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF1B1A4A"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF5E627C"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC94F0C"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9DBE5"/></left><right style="thin"><color rgb="FFD9DBE5"/></right><top style="thin"><color rgb="FFD9DBE5"/></top><bottom style="thin"><color rgb="FFD9DBE5"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="bottom"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs></styleSheet>' }
    ];
    var png = null;
    abas.forEach(function (a, i) {
      files.push({ nome: 'xl/worksheets/sheet' + (i + 1) + '.xml', conteudo: sheet(a) });
      if (!temLogo(a)) return;
      png = png || pngBytes(a.cabecalho.logo);
      files.push({ nome: 'xl/worksheets/_rels/sheet' + (i + 1) + '.xml.rels', conteudo: REL + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing' + (i + 1) + '.xml"/></Relationships>' });
      files.push({ nome: 'xl/drawings/drawing' + (i + 1) + '.xml', conteudo: drawing(png, a._largA, i + 1) });
      files.push({ nome: 'xl/drawings/_rels/drawing' + (i + 1) + '.xml.rels', conteudo: REL + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo' + (i + 1) + '.png"/></Relationships>' });
      files.push({ nome: 'xl/media/logo' + (i + 1) + '.png', conteudo: png.bytes });
    });
    baixar(zip(files), nomeArquivo);
  }

  function baixar(blob, nome) {
    var a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  /* ---------- PDF (impressão do navegador) ---------- */
  var CSS_PDF = '@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{margin:0;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#1B1A4A;font-size:10px}' +
    'header{display:flex;align-items:center;gap:12px;border-bottom:2px solid #F26A1B;padding-bottom:8px;margin-bottom:10px}header img{height:30px}header h1{margin:0;font-size:16px}header p{margin:2px 0 0;color:#5E627C;font-size:10px}' +
    'h2{font-size:12px;margin:14px 0 6px;color:#C94F0C}table{width:100%;border-collapse:collapse;margin-bottom:6px;page-break-inside:auto}tr{page-break-inside:avoid}th{background:#F1F1F6;text-align:left;font-size:9px;color:#4A4E6A}' +
    'th,td{border:1px solid #E1E3EC;padding:4px 5px;vertical-align:top}td.n{white-space:nowrap}.plano{border:1px solid #E1E3EC;border-radius:6px;padding:8px 10px;margin-bottom:10px;page-break-inside:avoid}.plano h3{margin:0 0 6px;font-size:12px}' +
    '.fatos{display:flex;flex-wrap:wrap;gap:4px 16px;margin-bottom:6px;color:#4A4E6A}.fatos b{color:#1B1A4A}.grp td{background:#FFF7F1;font-weight:700;color:#A8420A}footer{margin-top:10px;color:#8B8FA6;font-size:9px}';
  /* PDF gerado no próprio navegador, sem a janela de impressão: A4 paisagem, sempre.
     Cada filho do <body> do relatório é um bloco (cabeçalho, plano, indicadores, gráficos, rodapé);
     os blocos são empilhados em páginas sem serem cortados (bloco maior que a página é reduzido).
     Cada página vira uma imagem (SVG foreignObject → canvas → JPEG) dentro de um PDF montado aqui. */
  var PG_W = 1123, PG_H = 794, MARGEM = 40, AREA_W = PG_W - 2 * MARGEM, AREA_H = PG_H - 2 * MARGEM;
  function pdf(titulo, html, opcoes) {
    opcoes = opcoes || {};
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;left:-20000px;top:0;width:' + AREA_W + 'px;height:' + AREA_H + 'px;border:0';
    document.body.appendChild(f);
    var doc = f.contentWindow.document;
    doc.open();
    doc.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>' + CSS_PDF + 'body{width:' + AREA_W + 'px;background:#fff}</style></head><body>' + html + '</body></html>');
    doc.close();
    var imgs = [].slice.call(doc.images);
    return Promise.all(imgs.map(function (i) { return i.complete ? 0 : new Promise(function (r) { i.onload = i.onerror = r; }); }))
      .then(function () { return opcoes.umaPagina ? [umaPagina(doc)] : paginar(doc); })
      .then(function (paginas) { return Promise.all(paginas.map(renderPagina)); })
      .then(function (jpegs) { baixar(montarPdf(jpegs, titulo), titulo + '.pdf'); })
      .finally(function () { f.remove(); });
  }
  function umaPagina(doc) { var b = [].slice.call(doc.body.children); return { blocos: b, h: doc.body.scrollHeight }; }
  function paginar(doc) {
    var blocos = [].slice.call(doc.body.children), paginas = [], atual = [], usado = 0;
    blocos.forEach(function (b) {
      var cs = doc.defaultView.getComputedStyle(b), h = b.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      if (atual.length && usado + h > AREA_H) { paginas.push({ blocos: atual, h: usado }); atual = []; usado = 0; }
      atual.push(b); usado += h;
    });
    if (atual.length) paginas.push({ blocos: atual, h: usado });
    return paginas;
  }
  function renderPagina(p) {
    var esc = Math.min(1, AREA_H / p.h), ser = new XMLSerializer();
    var corpo = p.blocos.map(function (b) { return ser.serializeToString(snapshotNode(b)); }).join('');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + PG_W + '" height="' + PG_H + '"><rect width="100%" height="100%" fill="#fff"/>' +
      '<foreignObject x="' + MARGEM + '" y="' + MARGEM + '" width="' + AREA_W + '" height="' + AREA_H + '"><div xmlns="http://www.w3.org/1999/xhtml" style="width:' + (AREA_W / esc) + 'px;transform:scale(' + esc + ');transform-origin:0 0;font-family:Segoe UI,system-ui,sans-serif;color:#1B1A4A">' + corpo + '</div></foreignObject></svg>';
    return new Promise(function (ok, erro) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'), k = 2;
        c.width = PG_W * k; c.height = PG_H * k;
        var g = c.getContext('2d'); g.scale(k, k); g.drawImage(img, 0, 0);
        ok(c.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = erro;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  /* Monta um PDF mínimo: uma página A4 paisagem (842 x 595 pt) por imagem JPEG */
  function montarPdf(jpegs, titulo) {
    var enc = new TextEncoder(), partes = [], offs = [], tam = 0, n = jpegs.length;
    function add(p) { var b = typeof p === 'string' ? enc.encode(p) : p; partes.push(b); tam += b.length; }
    function obj(id, conteudo, bin) { offs[id] = tam; add(id + ' 0 obj\n' + conteudo); if (bin) { add(bin); add('\nendstream'); } add('\nendobj\n'); }
    add('%PDF-1.4\n%âãÏÓ\n');
    var kids = []; for (var i = 0; i < n; i++) kids.push((4 + i * 3) + ' 0 R');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>');
    obj(3, '<< /Title (' + titulo.replace(/[()\\]/g, '') + ') /Producer (ENCO Portal Web) >>');
    jpegs.forEach(function (d, i) {
      var bin = atob(d.split(',')[1]), u = new Uint8Array(bin.length);
      for (var j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j);
      var pid = 4 + i * 3, iid = pid + 1, cid = pid + 2, cmd = 'q 842 0 0 595 0 0 cm /Im' + i + ' Do Q';
      obj(pid, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im' + i + ' ' + iid + ' 0 R >> >> /Contents ' + cid + ' 0 R >>');
      obj(iid, '<< /Type /XObject /Subtype /Image /Width ' + PG_W * 2 + ' /Height ' + PG_H * 2 + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + u.length + ' >>\nstream\n', u);
      obj(cid, '<< /Length ' + cmd.length + ' >>\nstream\n', enc.encode(cmd));
    });
    var total = 4 + n * 3, xref = tam, linhas = ['xref', '0 ' + total, '0000000000 65535 f '];
    for (var k = 1; k < total; k++) linhas.push(String(offs[k]).padStart(10, '0') + ' 00000 n ');
    add(linhas.join('\n') + '\ntrailer\n<< /Size ' + total + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(partes, { type: 'application/pdf' });
  }

  /* ---------- Cópia de um trecho da tela com os estilos calculados ----------
     Usado para levar gráficos e indicadores para o PDF exatamente como aparecem. */
  var PROPS = ['display', 'position', 'box-sizing', 'width', 'height', 'min-width', 'max-width', 'min-height', 'margin', 'padding', 'border', 'border-radius', 'background-color', 'background-image',
    'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'white-space', 'overflow', 'text-overflow', 'vertical-align',
    'flex', 'flex-direction', 'flex-wrap', 'align-items', 'align-self', 'justify-content', 'gap', 'grid-template-columns', 'grid-column', 'grid-auto-flow', 'grid-auto-columns',
    'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'text-anchor', 'dominant-baseline', 'box-shadow', 'top', 'left', 'right', 'bottom', 'transform', 'inset', 'zoom', 'border-collapse', 'border-spacing', 'table-layout'];
  function snapshotNode(el) {
    var win = el.ownerDocument.defaultView, clone = el.cloneNode(true), src = [el].concat([].slice.call(el.querySelectorAll('*'))), dst = [clone].concat([].slice.call(clone.querySelectorAll('*')));
    src.forEach(function (s, i) {
      var cs = win.getComputedStyle(s), d = dst[i];
      if (cs.display === 'none') { d.remove(); return; }
      d.setAttribute('style', PROPS.map(function (p) { var v = cs.getPropertyValue(p); return v ? p + ':' + v : ''; }).filter(Boolean).join(';'));
      ['tabindex', 'data-tip', 'data-pt', 'data-x', 'class', 'id'].forEach(function (a) { d.removeAttribute(a); });
    });
    return clone;
  }
  function snapshot(el) { return snapshotNode(el).outerHTML; }

  ENCO.exporta = { xlsx: xlsx, pdf: pdf, escape: x, snapshot: snapshot };
})();
