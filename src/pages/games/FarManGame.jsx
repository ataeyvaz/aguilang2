import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function FarManGame() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('start')
  const [playerName, setPlayerName] = useState('')
  const [gameMode, setGameMode] = useState('karisik')

  const canvasRef = useRef(null)
  const canvasKapRef = useRef(null)
  const gIntRef = useRef(null)
  const drawIntRef = useRef(null)
  const callbacks = useRef({})
  const settingsPanelRef = useRef(null)
  const mesajRef = useRef(null)
  const gecisOverlayRef = useRef(null)

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const ISIM = playerName
    const MOD = gameMode
    const GS = 21, GC = 21

    function ekranAyarla() {
      const kap = canvasKapRef.current
      if (!kap) return
      let boyut = Math.floor(Math.min(kap.clientWidth, kap.clientHeight) / GC) * GC
      boyut = Math.max(boyut, 180)
      canvas.width = canvas.height = boyut
    }
    ekranAyarla()
    window.addEventListener('resize', ekranAyarla)
    function H() { return canvas.width / GC }

    let ayarlar = JSON.parse(localStorage.getItem('farman_ayar_' + ISIM) || '{"tema":"tarim","hiz":180}')
    const temalar = {
      tarim:    { arkaplan: '#1a2e1a', duvar: '#2d4a1e', duvarCizgi: '#4caf50', zemin: '#0d2a0d' },
      gece:     { arkaplan: '#0a0a1a', duvar: '#1a1a3a', duvarCizgi: '#6666ff', zemin: '#08080f' },
      sonbahar: { arkaplan: '#2e1a0a', duvar: '#4a2e1e', duvarCizgi: '#ff8c00', zemin: '#1a0e05' },
      kar:      { arkaplan: '#c8dce8', duvar: '#7090b0', duvarCizgi: '#4a90d9', zemin: '#d8eaf4' },
    }
    let tema = temalar[ayarlar.tema] || temalar.tarim
    function ayarlariKaydet() { localStorage.setItem('farman_ayar_' + ISIM, JSON.stringify(ayarlar)) }
    function temaSec(t) { ayarlar.tema = t; tema = temalar[t] || temalar.tarim }
    function hizSec(h) {
      ayarlar.hiz = parseInt(h)
      clearInterval(gIntRef.current)
      gIntRef.current = setInterval(guncelle, seviyeHizi())
    }
    function seviyeHizi() {
      const az = Math.min(seviye - 1, 2) * 8
      return Math.max(ayarlar.hiz - az, ayarlar.hiz - 16)
    }

    const TUM_M = [
      { emoji: '🌾', puan: 1,  renk: '#c8a000', bonus: null,     sv: 1 },
      { emoji: '🥕', puan: 2,  renk: '#ff8c00', bonus: null,     sv: 1 },
      { emoji: '🍅', puan: 3,  renk: '#cc2200', bonus: null,     sv: 2 },
      { emoji: '🥔', puan: 4,  renk: '#8b6914', bonus: 'hiz',    sv: 2 },
      { emoji: '🌽', puan: 5,  renk: '#ffd700', bonus: 'lazer',  sv: 3 },
      { emoji: '🍓', puan: 8,  renk: '#ff1493', bonus: 'can',    sv: 3 },
      { emoji: '🍇', puan: 10, renk: '#8b008b', bonus: 'kalkan', sv: 4 },
      { emoji: '💎', puan: 15, renk: '#00e5ff', bonus: 'zirh',   sv: 5 },
    ]
    function svMahsul(sv) { return TUM_M.filter(m => m.sv <= sv) }

    let mapData = [], mapToplam = 0, camR = 0
    let mahsuller = [], gucItems = [], kapilar = []
    let toplamM = 0, toplanmis = 0
    let bolgeHaritasi = {}

    function hAl(r, c) {
      if (r < 0 || r >= mapToplam || c < 0 || c >= GC) return 1
      return mapData[r][c]
    }
    function tasi(x, y, dx, dy) { return hAl(y + dy, x + dx) !== 1 }

    function bolumOlustur(tip) {
      const b = []
      for (let r = 0; r < GS; r++) { b[r] = []; for (let c = 0; c < GC; c++) b[r][c] = 1 }
      if (tip === 'acik') {
        for (let r = 0; r < GS; r++) for (let c = 0; c < GC; c++)
          b[r][c] = (r === 0 || r === GS - 1 || c === 0 || c === GC - 1) ? 1 : 0
        for (let i = 0; i < 4; i++) {
          const r = 3 + Math.floor(Math.random() * (GS - 6))
          const c = 3 + Math.floor(Math.random() * (GC - 6))
          for (let j = 0; j < 2 && r + j < GS - 2; j++) b[r + j][c] = 1
        }
      } else if (tip === 'ciftlik') {
        for (let r = 0; r < GS; r++) for (let c = 0; c < GC; c++) {
          if (r === 0 || r === GS - 1 || c === 0 || c === GC - 1) b[r][c] = 1
          else if (r % 6 === 0 && c % 6 === 0) b[r][c] = 1
          else b[r][c] = 0
        }
      } else {
        function oyuk(r, c) {
          const y = [[0, 2], [0, -2], [2, 0], [-2, 0]]
          for (let i = y.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [y[i], y[j]] = [y[j], y[i]]
          }
          for (const [dr, dc] of y) {
            const nr = r + dr, nc = c + dc
            if (nr > 0 && nr < GS - 1 && nc > 0 && nc < GC - 1 && b[nr][nc] === 1) {
              b[nr][nc] = 0; b[r + dr / 2][c + dc / 2] = 0; oyuk(nr, nc)
            }
          }
        }
        b[1][1] = 0; oyuk(1, 1)
        for (let i = 0; i < seviye * 8 + 20; i++) {
          const r = 1 + Math.floor(Math.random() * (GS - 2))
          const c = 1 + Math.floor(Math.random() * (GC - 2))
          if (b[r][c] === 1) b[r][c] = 0
        }
      }
      b[1][1] = 0; b[1][2] = 0; b[2][1] = 0
      return b
    }
    function haritaTipi(sv) {
      if (sv === 1) return 'acik'
      if (sv === 2) return 'ciftlik'
      return ['labirent', 'ciftlik', 'acik'][Math.floor(Math.random() * 3)]
    }

    let puan = 0, canlar = 3, seviye = 1, tarla = 1
    let enY = parseInt(localStorage.getItem('farman_en_' + ISIM) || '0')
    let rozetler = JSON.parse(localStorage.getItem('farman_rozet_' + ISIM) || '[]')
    let oyunBitti = false, gecisKilidi = false
    let lazerGucu = 1, lazerAdet = 0
    let kalkan = 0, zirh = 0, hizS = 0
    let lazerliste = []
    let pacman = { x: 1, y: 1, yon: { dx: 1, dy: 0 }, ag: 0 }

    const el = id => document.getElementById(id)
    el('fm-enyuksek').innerText = enY
    el('fm-rozetler').innerText = rozetler.join(' ')

    function mahsulYerlestir(rBas, rBit) {
      const mevcut = svMahsul(seviye)
      if (MOD === 'bolgeli') {
        let bolgeAdedi = Math.max(2, Math.min(2 + Math.floor(seviye / 1.5), mevcut.length))
        const bolgeMahsul = [], kullanilan = []
        for (let i = 0; i < bolgeAdedi; i++) {
          let adaylar = mevcut.filter(m => !kullanilan.includes(m.emoji))
          if (!adaylar.length) adaylar = mevcut
          const ag = []
          for (const m of adaylar) { const k = Math.max(1, 10 - m.puan); for (let z = 0; z < k; z++) ag.push(m) }
          const sec = ag[Math.floor(Math.random() * ag.length)]
          bolgeMahsul.push(sec); kullanilan.push(sec.emoji)
        }
        const bolgeGenislik = Math.ceil(GC / bolgeAdedi)
        for (let r = rBas; r < rBit && r < mapToplam; r++) {
          for (let c = 0; c < GC; c++) {
            if (mapData[r][c] !== 0) continue
            const bi = Math.min(Math.floor(c / bolgeGenislik), bolgeAdedi - 1)
            bolgeHaritasi[r + '_' + c] = bi
            mahsuller.push({ r, c, mahsul: bolgeMahsul[bi], aktif: true }); toplamM++
          }
        }
      } else {
        for (let r = rBas; r < rBit && r < mapToplam; r++) {
          for (let c = 0; c < GC; c++) {
            if (mapData[r][c] !== 0) continue
            const ag = []
            for (const m of mevcut) { const k = Math.max(1, 10 - m.puan); for (let z = 0; z < k; z++) ag.push(m) }
            mahsuller.push({ r, c, mahsul: ag[Math.floor(Math.random() * ag.length)], aktif: true }); toplamM++
          }
        }
      }
      const gucTipleri = ['kalkan', 'zirh', 'hiz', 'lazer', 'ekstraCan']
      const bolgedekiler = mahsuller.filter(m => m.aktif && m.r >= rBas && m.r < rBit)
      gucTipleri.forEach(g => {
        if (bolgedekiler.length < 10) return
        const adaylar = bolgedekiler.filter(m => !(m.r === pacman.y && m.c === pacman.x) && Math.abs(m.r - (rBas + 1)) > 2)
        if (!adaylar.length) return
        const hedef = adaylar[Math.floor(Math.random() * adaylar.length)]
        gucItems.push({ r: hedef.r, c: hedef.c, tip: g, aktif: true })
        hedef.aktif = false; toplamM--
      })
    }

    function ilkHarita() {
      bolgeHaritasi = {}
      const b = bolumOlustur(haritaTipi(seviye))
      mapData = []; for (let r = 0; r < GS; r++) mapData[r] = b[r]
      mapToplam = GS; camR = 0
      mahsuller = []; gucItems = []; kapilar = []; toplamM = 0; toplanmis = 0
      mahsulYerlestir(0, GS)
    }

    const RENKLER = ['#ff4444', '#ff88ff', '#00ffff', '#ffaa00', '#ff6600', '#aa00ff']
    let hayaletler = []
    function hayaletSayisi() { return Math.min(1 + Math.floor(seviye / 1.2), 6) }
    function hayaletYerlestir(rBas, rBit, temizle) {
      if (temizle) hayaletler = []
      const sayi = hayaletSayisi()
      const eklenecek = temizle ? sayi : Math.min(1, sayi - hayaletler.length)
      for (let i = 0; i < eklenecek; i++) {
        const h = { renk: RENKLER[hayaletler.length % RENKLER.length], oldu: false, x: GC - 2, y: rBas + 1 }
        for (let d = 0; d < 300; d++) {
          const r = rBas + 1 + Math.floor(Math.random() * Math.max(1, rBit - rBas - 2))
          const c = 1 + Math.floor(Math.random() * (GC - 2))
          if (r < 0 || r >= mapToplam) continue
          if (mapData[r][c] === 0 && Math.abs(r - pacman.y) > 4 && Math.abs(c - pacman.x) > 4) { h.x = c; h.y = r; break }
        }
        hayaletler.push(h)
      }
    }

    function kapilariGuncelle() {
      if (kapilar.length > 0 || toplamM === 0) return
      if (toplanmis / toplamM < 0.9) return
      const ortaC = GC / 2 | 0, ortaR = camR + GS / 2 | 0
      if (camR + 1 < mapToplam) mapData[camR + 1][ortaC] = 0
      if (camR + GS - 2 < mapToplam) mapData[camR + GS - 2][ortaC] = 0
      if (ortaR < mapToplam) { mapData[ortaR][1] = 0; mapData[ortaR][GC - 2] = 0 }
      kapilar = [
        { r: camR + 1,      c: ortaC, yon: 'kuzey', aktif: true },
        { r: camR + GS - 2, c: ortaC, yon: 'guney', aktif: true },
        { r: ortaR,         c: 1,     yon: 'bati',  aktif: true },
        { r: ortaR,         c: GC - 2, yon: 'dogu', aktif: true },
      ]
      rozetKazan('🚪', 'Kapı Açıldı')
    }
    function kapidanGectiMi() {
      for (const k of kapilar) if (k.aktif && k.r === pacman.y && k.c === pacman.x) return k
      return null
    }
    function hasatBar() {
      const y = toplamM > 0 ? Math.round(toplanmis / toplamM * 100) : 0
      el('fm-bar').style.width = y + '%'
      el('fm-baryazi').innerText = 'Hasat: ' + y + '% ' + (y >= 90 ? '— 🚪 Kapılar açık!' : '— Kapı için %90 gerekli')
    }

    function yeniHaritaAc(svDegisim, px, py) {
      bolgeHaritasi = {}; mahsuller = []; gucItems = []; kapilar = []; toplamM = 0; toplanmis = 0
      seviye = Math.max(1, seviye + svDegisim)
      el('fm-seviye').innerText = seviye
      if (svDegisim > 0) { tarla++; el('fm-tarla').innerText = tarla }
      const b = bolumOlustur(haritaTipi(seviye))
      mapData = []; for (let r = 0; r < GS; r++) mapData[r] = b[r]
      mapToplam = GS; camR = 0
      pacman.x = px; pacman.y = py; pacman.yon = { dx: px < GC / 2 ? 1 : -1, dy: 0 }
      mahsulYerlestir(0, GS); hayaletYerlestir(0, GS, true); hasatBar()
    }
    function yukariGenisle() {
      bolgeHaritasi = {}
      const b = bolumOlustur(haritaTipi(seviye))
      const yeni = []
      for (let r = 0; r < GS; r++) yeni[r] = b[r]
      for (let r = 0; r < mapToplam; r++) yeni[GS + r] = mapData[r]
      mapData = yeni
      mahsuller.forEach(m => m.r += GS); gucItems.forEach(g => g.r += GS)
      kapilar.forEach(k => k.r += GS); pacman.y += GS; hayaletler.forEach(h => h.y += GS)
      mapToplam += GS; camR = 0
      mapData[GS - 1][GC / 2 | 0] = 0; mapData[GS][GC / 2 | 0] = 0
      mahsulYerlestir(0, GS); hayaletYerlestir(0, GS, false); hasatBar()
    }
    function asagiGenisle() {
      const eski = mapToplam
      const b = bolumOlustur(haritaTipi(seviye))
      for (let r = 0; r < GS; r++) mapData[eski + r] = b[r]
      mapToplam += GS
      mapData[eski - 1][GC / 2 | 0] = 0; mapData[eski][GC / 2 | 0] = 0
      mahsulYerlestir(eski, mapToplam); camR = eski
      hayaletYerlestir(eski, mapToplam, false); hasatBar()
    }

    function rozetKazan(emoji, ad) {
      const key = emoji + ad
      if (rozetler.includes(key)) return
      rozetler.push(key)
      localStorage.setItem('farman_rozet_' + ISIM, JSON.stringify(rozetler))
      el('fm-rozetler').innerText = rozetler.join(' ')
      const d = document.createElement('div')
      d.innerText = emoji + ' ' + ad + '!'
      d.style.cssText = 'position:fixed;top:48px;left:50%;transform:translateX(-50%);background:#4caf50;color:white;padding:6px 13px;border-radius:9px;font-size:13px;font-weight:bold;z-index:500;transition:opacity 2s;'
      document.body.appendChild(d)
      setTimeout(() => d.style.opacity = 0, 1500)
      setTimeout(() => d.remove(), 3500)
    }
    function rozetKontrol() {
      if (puan >= 1)      rozetKazan('⭐', 'İlk Hasat')
      if (puan >= 20)     rozetKazan('🌾', 'Çiftçi')
      if (puan >= 50)     rozetKazan('🚜', 'Traktör')
      if (puan >= 100)    rozetKazan('🏆', 'Şampiyon')
      if (seviye >= 3)    rozetKazan('🌽', '3. Seviye')
      if (seviye >= 5)    rozetKazan('👑', 'Efsane')
      if (lazerGucu >= 3) rozetKazan('⚡', 'Lazer Ustası')
      if (tarla >= 5)     rozetKazan('🗺️', 'Kaşif')
      if (MOD === 'bolgeli' && puan >= 30) rozetKazan('🗂️', 'Bölge Ustası')
    }
    function canGoster() {
      let k = '', max = 3 + Math.floor(seviye / 2)
      for (let i = 0; i < canlar; i++) k += '❤️'
      for (let i = canlar; i < max; i++) k += '🖤'
      el('fm-can').innerText = k
    }
    function gucGoster() {
      const g = (id, aktif) => {
        const e = el(id); if (!e) return
        e.style.border = '2px solid ' + (aktif ? '#f5c518' : '#333')
        e.style.background = aktif ? '#2a2a1e' : '#162e16'
        e.style.opacity = aktif ? '1' : '0.3'
      }
      el('fm-kalkan').innerText = kalkan > 0 ? Math.ceil(kalkan / 6) : '0'
      g('fm-g-kalkan', kalkan > 0)
      el('fm-zirh').innerText = zirh
      g('fm-g-zirh', zirh > 0)
      el('fm-hiz').innerText = hizS > 0 ? Math.ceil(hizS / 6) : '0'
      g('fm-g-hiz', hizS > 0)
      el('fm-lazeradet').innerText = lazerAdet
      g('fm-g-lazer', lazerAdet > 0)
      el('fm-lazergucu').innerText = '⚡' + lazerGucu
      const btn = el('fm-lazer-btn')
      if (btn) {
        if (lazerAdet > 0) {
          btn.style.background = '#4caf50'; btn.style.borderColor = '#4caf50'
          btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'
          btn.innerText = '🔫 ' + lazerAdet
        } else {
          btn.style.background = '#333'; btn.style.borderColor = '#555'
          btn.style.opacity = '0.3'; btn.style.pointerEvents = 'none'
          btn.innerText = '🔫 Lazer'
        }
      }
    }
    function lazerAt() {
      if (lazerAdet <= 0) return
      lazerAdet--
      lazerliste.push({ x: pacman.x, y: pacman.y, dx: pacman.yon.dx || 1, dy: pacman.yon.dy, guc: lazerGucu, adim: 0 })
      gucGoster()
    }
    function odulGoster(metin) {
      const d = document.createElement('div')
      d.innerText = '🎁 ' + metin
      d.style.cssText = 'position:fixed;top:48px;left:50%;transform:translateX(-50%);background:#f5c518;color:#1a1a2e;padding:7px 14px;border-radius:9px;font-size:14px;font-weight:bold;z-index:500;transition:opacity 2s;'
      document.body.appendChild(d)
      setTimeout(() => d.style.opacity = 0, 2000)
      setTimeout(() => d.remove(), 4000)
    }
    function gecisAnim(ikon, yazi, ms, sonra) {
      const ov = gecisOverlayRef.current
      el('fm-gecis-ikon').innerText = ikon; el('fm-gecis-yazi').innerText = yazi
      ov.style.display = 'block'
      setTimeout(() => { ov.style.display = 'none'; sonra && sonra() }, ms)
    }

    function mahsulTopla() {
      for (const m of mahsuller) {
        if (!m.aktif || m.r !== pacman.y || m.c !== pacman.x) continue
        m.aktif = false; toplanmis++; puan += m.mahsul.puan
        el('fm-puan').innerText = puan
        if (m.mahsul.bonus === 'hiz')    hizS = Math.max(hizS, 20)
        if (m.mahsul.bonus === 'lazer')  lazerAdet++
        if (m.mahsul.bonus === 'kalkan') kalkan = Math.max(kalkan, 30)
        if (m.mahsul.bonus === 'zirh')   zirh++
        if (m.mahsul.bonus === 'can') { canlar++; canGoster(); rozetKazan('❤️', 'Ekstra Can') }
        if (puan > enY) { enY = puan; localStorage.setItem('farman_en_' + ISIM, enY); el('fm-enyuksek').innerText = enY }
        rozetKontrol(); kapilariGuncelle(); hasatBar(); gucGoster()
        break
      }
      const gIkon = { kalkan: '🛡️', zirh: '⚔️', hiz: '💨', lazer: '🔫', ekstraCan: '❤️' }
      for (const g of gucItems) {
        if (!g.aktif || g.r !== pacman.y || g.c !== pacman.x) continue
        g.aktif = false
        if (g.tip === 'kalkan') kalkan = 30
        else if (g.tip === 'zirh') zirh += 2
        else if (g.tip === 'hiz') hizS = 20
        else if (g.tip === 'lazer') lazerAdet += 3
        else if (g.tip === 'ekstraCan') { canlar++; canGoster() }
        rozetKazan(gIkon[g.tip] || '✨', 'Güç Alındı'); gucGoster(); break
      }
    }

    function guncelle() {
      if (oyunBitti || gecisKilidi) return
      if (kalkan > 0) kalkan--
      if (hizS > 0) hizS--
      const { dx, dy } = pacman.yon
      if (tasi(pacman.x, pacman.y, dx, dy)) {
        pacman.x += dx; pacman.y += dy; mahsulTopla()
        if (hizS > 0 && tasi(pacman.x, pacman.y, dx, dy)) { pacman.x += dx; pacman.y += dy; mahsulTopla() }
      }
      const hedef = Math.max(0, Math.min(pacman.y - Math.floor(GS / 2), mapToplam - GS))
      camR = hedef

      const kapi = kapidanGectiMi()
      if (kapi && !gecisKilidi) {
        gecisKilidi = true; kapilar = []
        if (kapi.yon === 'dogu') {
          gecisAnim('➡️🗺️', 'Yeni Tarlaya!', 1200, () => {
            let odul = ''
            if (seviye % 3 === 0) { canlar++; canGoster(); odul = '❤️ +1 Can!' }
            else if (seviye % 3 === 1) { lazerAdet += 3; odul = '🔫 +3 Lazer!'; gucGoster() }
            else { lazerGucu = Math.min(lazerGucu + 1, 5); odul = '⚡ Lazer Güçlendi!'; gucGoster() }
            if (odul) odulGoster(odul)
            yeniHaritaAc(1, 1, 1)
            clearInterval(gIntRef.current); gIntRef.current = setInterval(guncelle, seviyeHizi()); gecisKilidi = false
          })
        } else if (kapi.yon === 'bati') {
          gecisAnim('⬅️🗺️', 'Önceki Tarla!', 1200, () => {
            yeniHaritaAc(-1, GC - 2, 1)
            clearInterval(gIntRef.current); gIntRef.current = setInterval(guncelle, seviyeHizi()); gecisKilidi = false
          })
        } else if (kapi.yon === 'kuzey') {
          gecisAnim('⬆️🌾', 'Yukarı Genişliyor!', 1000, () => {
            yukariGenisle(); clearInterval(gIntRef.current); gIntRef.current = setInterval(guncelle, seviyeHizi()); gecisKilidi = false
          })
        } else {
          gecisAnim('⬇️🌾', 'Aşağı Genişliyor!', 1000, () => {
            asagiGenisle(); clearInterval(gIntRef.current); gIntRef.current = setInterval(guncelle, seviyeHizi()); gecisKilidi = false
          })
        }
        return
      }

      let yeniL = []
      for (const l of lazerliste) {
        l.adim++
        const nx = l.x + l.dx, ny = l.y + l.dy
        if (hAl(ny, nx) === 1) continue
        l.x = nx; l.y = ny
        let carpti = false
        for (const h of hayaletler) {
          if (!h.oldu && h.x === l.x && h.y === l.y) {
            h.oldu = true; puan += 5 * lazerGucu; lazerGucu = Math.min(lazerGucu + 1, 5)
            el('fm-puan').innerText = puan; rozetKontrol(); carpti = true
            setTimeout(() => {
              h.oldu = false
              for (let d = 0; d < 200; d++) {
                const r = camR + 1 + Math.floor(Math.random() * (GS - 2))
                const c = 1 + Math.floor(Math.random() * (GC - 2))
                if (hAl(r, c) === 0 && Math.abs(r - pacman.y) > 3) { h.x = c; h.y = r; break }
              }
            }, 3000)
            break
          }
        }
        if (!carpti && l.adim < GC) yeniL.push(l)
      }
      lazerliste = yeniL

      const zorluk = Math.min(0.15 + seviye * 0.12, 0.92)
      hayaletler.forEach(h => {
        if (h.oldu) return
        const yd = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }]
        if (Math.random() < zorluk) {
          let best = null, bestD = 999
          yd.forEach(y => {
            if (!tasi(h.x, h.y, y.dx, y.dy)) return
            const d = Math.abs((h.x + y.dx) - pacman.x) + Math.abs((h.y + y.dy) - pacman.y)
            if (d < bestD) { bestD = d; best = y }
          })
          if (best) { h.x += best.dx; h.y += best.dy; return }
        }
        const gec = yd.filter(y => tasi(h.x, h.y, y.dx, y.dy))
        if (gec.length) { const s = gec[Math.floor(Math.random() * gec.length)]; h.x += s.dx; h.y += s.dy }
      })

      hayaletler.forEach(h => {
        if (h.oldu || oyunBitti) return
        if (h.x === pacman.x && h.y === pacman.y) {
          if (kalkan > 0) return
          if (zirh > 0) { zirh--; gucGoster(); return }
          canlar--; canGoster(); gucGoster()
          if (canlar <= 0) {
            oyunBitti = true
            el('fm-mesaj-baslik').innerText = puan > 30 ? '🌾 Harika!' : '💀 Oyun Bitti!'
            el('fm-mesaj-puan').innerText = 'Puan: ' + puan + ' | Sv: ' + seviye + ' | Tarla: ' + tarla
            el('fm-mesaj-enyuksek').innerText = 'En Yüksek: ' + enY
            el('fm-mesaj-rozet').innerText = rozetler.join(' ')
            mesajRef.current.style.display = 'block'
          } else { pacman.x = 1; pacman.y = camR + 1; pacman.yon = { dx: 1, dy: 0 } }
        }
      })
    }

    function ciz() {
      const h = H()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = tema.arkaplan; ctx.fillRect(0, 0, canvas.width, canvas.height)
      // harita
      for (let gr = 0; gr < GS; gr++) {
        const mr = camR + gr
        for (let c = 0; c < GC; c++) {
          const x = c * h, y = gr * h, v = hAl(mr, c)
          if (v === 1) { ctx.fillStyle = tema.duvar; ctx.fillRect(x, y, h, h); ctx.strokeStyle = tema.duvarCizgi; ctx.strokeRect(x, y, h, h) }
          else { ctx.fillStyle = tema.zemin; ctx.fillRect(x, y, h, h) }
        }
      }
      // bölge zemini
      if (MOD === 'bolgeli') {
        const mevcut = svMahsul(seviye)
        let bolgeAdedi = Math.max(2, Math.min(2 + Math.floor(seviye / 1.5), mevcut.length))
        const bolgeGenislik = Math.ceil(GC / bolgeAdedi)
        const zemler = ['#1a2a00','#2a0a00','#002a1a','#1a001a','#2a1a00','#001a2a','#1a1a00','#002020']
        for (let gr = 0; gr < GS; gr++) {
          const mr = camR + gr
          for (let c = 0; c < GC; c++) {
            if (hAl(mr, c) === 1) continue
            const bi = Math.min(Math.floor(c / bolgeGenislik), bolgeAdedi - 1)
            ctx.fillStyle = zemler[bi % zemler.length]; ctx.fillRect(c * h, gr * h, h, h)
          }
        }
        for (let i = 1; i < bolgeAdedi; i++) {
          const x = i * bolgeGenislik * h
          ctx.save(); ctx.strokeStyle = 'rgba(255,255,100,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); ctx.restore()
        }
      }
      // mahsuller
      const z = Date.now() / 1000
      for (const m of mahsuller) {
        if (!m.aktif) continue
        const gr = m.r - camR
        if (gr < 0 || gr >= GS) continue
        const cx = m.c * h + h / 2, cy = gr * h + h / 2
        ctx.save(); ctx.fillStyle = m.mahsul.renk + '55'; ctx.beginPath(); ctx.arc(cx, cy, h * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        const sal = Math.sin(z * 1.5 + m.r * 0.5 + m.c * 0.3) * h * 0.04
        ctx.save(); ctx.font = Math.round(h * 0.62) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(m.mahsul.emoji, cx, cy + sal); ctx.restore()
      }
      // güç itemleri
      const gz = Date.now() / 400
      const gIk = { kalkan: '🛡️', zirh: '⚔️', hiz: '💨', lazer: '🔫', ekstraCan: '❤️' }
      const gRenk = { kalkan: '#00aaff', zirh: '#ffaa00', hiz: '#00ff88', lazer: '#ff4444', ekstraCan: '#ff69b4' }
      for (const g of gucItems) {
        if (!g.aktif) continue
        const gr = g.r - camR
        if (gr < 0 || gr >= GS) continue
        const cx = g.c * h + h / 2, cy = gr * h + h / 2, pulse = 0.85 + 0.15 * Math.sin(gz)
        ctx.save(); ctx.shadowBlur = 10 * pulse; ctx.shadowColor = gRenk[g.tip] || '#00ffcc'
        ctx.fillStyle = (gRenk[g.tip] || '#00ffcc') + '66'; ctx.beginPath(); ctx.arc(cx, cy, h * 0.42 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.restore()
        ctx.save(); ctx.font = Math.round(h * 0.58) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(gIk[g.tip] || '✨', cx, cy); ctx.restore()
      }
      // kapılar
      const kz = Date.now() / 500
      const oklar = { kuzey: '⬆️', guney: '⬇️', bati: '⬅️', dogu: '➡️' }
      for (const k of kapilar) {
        if (!k.aktif) continue
        const gr = k.r - camR
        if (gr < 0 || gr >= GS) continue
        const x = k.c * h, y = gr * h, p = 0.6 + 0.4 * Math.sin(kz)
        ctx.save(); ctx.shadowBlur = 15 * p; ctx.shadowColor = '#00ff88'
        ctx.fillStyle = `rgba(0,255,136,${p * 0.4})`; ctx.fillRect(x, y, h, h)
        ctx.font = Math.round(h * 0.7) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(oklar[k.yon], x + h / 2, y + h / 2); ctx.restore()
      }
      // lazer
      for (const l of lazerliste) {
        const gr = l.y - camR
        if (gr < 0 || gr >= GS) continue
        ctx.save(); ctx.strokeStyle = `hsl(${120 + lazerGucu * 30},100%,60%)`;  ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = ctx.strokeStyle
        ctx.beginPath(); ctx.moveTo(l.x * h + h / 2, gr * h + h / 2); ctx.lineTo((l.x + l.dx) * h + h / 2, (gr + l.dy) * h + h / 2); ctx.stroke(); ctx.restore()
      }
      // pacman
      const pgr = pacman.y - camR
      if (pgr >= 0 && pgr < GS) {
        const px = pacman.x * h + h / 2, py = pgr * h + h / 2
        const aci = Math.atan2(pacman.yon.dy, pacman.yon.dx)
        pacman.ag = (pacman.ag + 0.25) % (Math.PI / 2)
        const ac = Math.abs(Math.sin(pacman.ag)) * 0.7 + 0.1
        if (kalkan > 0) { ctx.save(); ctx.strokeStyle = '#00aaff'; ctx.lineWidth = 3; ctx.shadowBlur = 12; ctx.shadowColor = '#00aaff'; ctx.beginPath(); ctx.arc(px, py, h / 2 + 4, 0, Math.PI * 2); ctx.stroke(); ctx.restore() }
        if (zirh > 0) { ctx.save(); ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, h / 2 + 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore() }
        ctx.save(); ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.ellipse(px, py - h * 0.44, h * 0.38, h * 0.11, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(px - h * 0.19, py - h * 0.54, h * 0.38, h * 0.14); ctx.restore()
        ctx.fillStyle = hizS > 0 ? '#00ffcc' : '#f5c518'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, h / 2 - 1, aci + ac, aci + Math.PI * 2 - ac); ctx.closePath(); ctx.fill()
        const gx = px + Math.cos(aci - 0.5) * h * 0.24, gy = py + Math.sin(aci - 0.5) * h * 0.24
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(gx, gy, h * 0.08, 0, Math.PI * 2); ctx.fill()
      }
      // hayaletler
      hayaletler.forEach(h2 => {
        if (h2.oldu) return
        const gr = h2.y - camR
        if (gr < 0 || gr >= GS) return
        const hx = h2.x * h, hy = gr * h
        ctx.fillStyle = h2.renk; ctx.beginPath(); ctx.arc(hx + h / 2, hy + h / 2 - 1, h / 2 - 2, Math.PI, 0)
        ctx.lineTo(hx + h - 2, hy + h)
        for (let i = 4; i >= 0; i--) ctx.lineTo(hx + h * i / 4, hy + h - (i % 2 === 0 ? h * 0.25 : 0))
        ctx.lineTo(hx + 2, hy + h); ctx.closePath(); ctx.fill()
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(hx + h * 0.35, hy + h * 0.45, h * 0.13, 0, Math.PI * 2); ctx.arc(hx + h * 0.65, hy + h * 0.45, h * 0.13, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#1a1a2e'; ctx.beginPath(); ctx.arc(hx + h * 0.38, hy + h * 0.45, h * 0.07, 0, Math.PI * 2); ctx.arc(hx + h * 0.68, hy + h * 0.45, h * 0.07, 0, Math.PI * 2); ctx.fill()
      })
      // sayaç
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = Math.round(h * 0.42) + 'px Arial'
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(toplanmis + '/' + toplamM, canvas.width - 3, canvas.height - 3); ctx.restore()
    }

    function keyHandler(e) {
      if (e.key === 'ArrowRight') pacman.yon = { dx: 1, dy: 0 }
      if (e.key === 'ArrowLeft')  pacman.yon = { dx: -1, dy: 0 }
      if (e.key === 'ArrowDown')  pacman.yon = { dx: 0, dy: 1 }
      if (e.key === 'ArrowUp')    pacman.yon = { dx: 0, dy: -1 }
      if (e.key === 'l' || e.key === 'L') lazerAt()
      e.preventDefault()
    }
    document.addEventListener('keydown', keyHandler)

    let bas = null
    function touchStart(e) { bas = e.touches[0]; e.preventDefault() }
    function touchEnd(e) {
      if (!bas) return
      const dx = e.changedTouches[0].clientX - bas.clientX
      const dy = e.changedTouches[0].clientY - bas.clientY
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) lazerAt()
      else if (Math.abs(dx) > Math.abs(dy)) pacman.yon = dx > 0 ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 }
      else pacman.yon = dy > 0 ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 }
      bas = null
    }
    canvas.addEventListener('touchstart', touchStart, { passive: false })
    canvas.addEventListener('touchend', touchEnd, { passive: false })

    function yenidenBasla() {
      bolgeHaritasi = {}; puan = 0; canlar = 3; seviye = 1; tarla = 1
      lazerGucu = 1; lazerAdet = 0; kalkan = 0; zirh = 0; hizS = 0
      lazerliste = []; oyunBitti = false; gecisKilidi = false
      mesajRef.current.style.display = 'none'
      el('fm-puan').innerText = 0; el('fm-seviye').innerText = 1; el('fm-tarla').innerText = 1
      canGoster(); gucGoster(); ilkHarita()
      pacman = { x: 1, y: 1, yon: { dx: 1, dy: 0 }, ag: 0 }
      hayaletYerlestir(0, GS, true); hasatBar()
      clearInterval(gIntRef.current); gIntRef.current = setInterval(guncelle, seviyeHizi())
    }

    callbacks.current = { lazerAt, yenidenBasla, temaSec, hizSec, ayarlariKaydet }

    ilkHarita()
    pacman = { x: 1, y: 1, yon: { dx: 1, dy: 0 }, ag: 0 }
    hayaletYerlestir(0, GS, true); canGoster(); gucGoster(); hasatBar()
    gIntRef.current = setInterval(guncelle, seviyeHizi())
    drawIntRef.current = setInterval(ciz, 50)

    return () => {
      clearInterval(gIntRef.current); clearInterval(drawIntRef.current)
      window.removeEventListener('resize', ekranAyarla)
      document.removeEventListener('keydown', keyHandler)
      canvas.removeEventListener('touchstart', touchStart)
      canvas.removeEventListener('touchend', touchEnd)
    }
  }, [phase, playerName, gameMode])

  if (phase === 'start') {
    return (
      <div style={{ background: '#1a2e1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial,sans-serif', color: 'white' }}>
        <div style={{ background: '#162e16', border: '2px solid #4caf50', borderRadius: '20px', padding: '30px', width: '90%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '4px' }}>🌾</div>
          <h2 style={{ color: '#4caf50', fontSize: '28px', marginBottom: '6px' }}>FarMan</h2>
          <div style={{ fontSize: '26px', margin: '8px 0', letterSpacing: '4px' }}>🥕🍅🌽🍓💎</div>
          <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '14px' }}>Tarlanı hasat et, hayaletlerden kaç!</div>
          <input
            type="text" placeholder="Adın ne?" maxLength={20} value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && playerName.trim()) setPhase('playing') }}
            style={{ width: '100%', fontSize: '20px', padding: '10px', borderRadius: '10px', border: '2px solid #4caf50', background: '#1a2e1a', color: 'white', textAlign: 'center', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          <div style={{ color: '#aaa', fontSize: '11px', textTransform: 'uppercase', marginBottom: '7px', textAlign: 'left' }}>🎯 Hasat Modu</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {[{ value: 'karisik', ikon: '🎲', ad: 'Karışık', acik: 'Her yerde farklı ürün' }, { value: 'bolgeli', ikon: '🗂️', ad: 'Bölgeli', acik: 'Her bölge tek ürün türü' }].map(m => (
              <div key={m.value} onClick={() => setGameMode(m.value)} style={{ padding: '10px 6px', border: `2px solid ${gameMode === m.value ? '#f5c518' : '#333'}`, borderRadius: '12px', color: 'white', cursor: 'pointer', background: gameMode === m.value ? '#1a2e0a' : '#1a2e1a', textAlign: 'center' }}>
                <div style={{ fontSize: '30px', marginBottom: '4px' }}>{m.ikon}</div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{m.ad}</div>
                <div style={{ color: '#aaa', fontSize: '10px', marginTop: '2px' }}>{m.acik}</div>
              </div>
            ))}
          </div>
          <button disabled={!playerName.trim()} onClick={() => setPhase('playing')} style={{ width: '100%', fontSize: '20px', padding: '12px', background: playerName.trim() ? '#4caf50' : '#2a5a2a', color: 'white', border: 'none', borderRadius: '10px', cursor: playerName.trim() ? 'pointer' : 'not-allowed' }}>
            🚜 Tarlaya Git!
          </button>
          <button onClick={() => navigate('/play')} style={{ marginTop: '10px', width: '100%', fontSize: '14px', padding: '8px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>
            ← Geri Dön
          </button>
        </div>
      </div>
    )
  }

  const gc = { borderRadius: '7px', padding: '2px 6px', fontSize: '10px', transition: '0.2s', border: '2px solid #333', background: '#162e16', opacity: '0.3' }
  return (
    <div style={{ width: '100%', height: '100vh', background: '#1a2e1a', color: 'white', fontFamily: 'Arial,sans-serif', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button onClick={() => { settingsPanelRef.current.style.display = 'flex' }} style={{ position: 'fixed', top: '6px', right: '6px', background: '#162e16', border: '2px solid #4caf50', color: 'white', borderRadius: '50%', width: '30px', height: '30px', fontSize: '15px', cursor: 'pointer', zIndex: 300 }}>⚙️</button>
      <div style={{ position: 'fixed', top: '6px', left: '44px', background: '#162e16', border: '1px solid #4caf50', borderRadius: '8px', padding: '2px 7px', fontSize: '10px', color: '#4caf50', zIndex: 200 }}>{gameMode === 'karisik' ? '🎲 Karışık' : '🗂️ Bölgeli'}</div>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: '#162e16', borderBottom: '2px solid #4caf50', padding: '4px 6px', flexShrink: 0 }}>
        {[['Puan','fm-puan','0'],['Can','fm-can','❤️❤️❤️'],['Seviye','fm-seviye','1'],['Tarla','fm-tarla','1'],['En Yüksek','fm-enyuksek','0'],['Lazer','fm-lazergucu','⚡1']].map(([label,id,init]) => (
          <div key={id} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: '#aaa', textTransform: 'uppercase' }}>{label}</div>
            <div id={id} style={{ fontSize: '14px', fontWeight: 'bold', color: '#f5c518' }}>{init}</div>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', padding: '2px 6px', background: '#0d1f0d', flexShrink: 0 }}>
        <div style={{ background: '#333', borderRadius: '5px', height: '8px', overflow: 'hidden' }}>
          <div id="fm-bar" style={{ background: 'linear-gradient(90deg,#4caf50,#f5c518)', height: '100%', borderRadius: '5px', width: '0%', transition: 'width 0.3s' }} />
        </div>
        <div id="fm-baryazi" style={{ fontSize: '9px', color: '#aaa', textAlign: 'right', marginTop: '1px' }}>Hasat: 0% — Kapı için %90 gerekli</div>
      </div>

      <div style={{ display: 'flex', gap: '4px', padding: '2px 6px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', flexShrink: 0 }}>
        <div id="fm-g-kalkan" style={gc}>🛡️ <span id="fm-kalkan">0</span>s</div>
        <div id="fm-g-zirh"   style={gc}>⚔️ <span id="fm-zirh">0</span></div>
        <div id="fm-g-hiz"    style={gc}>💨 <span id="fm-hiz">0</span>s</div>
        <div id="fm-g-lazer"  style={gc}>🔫 <span id="fm-lazeradet">0</span></div>
      </div>

      <div ref={canvasKapRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ border: '3px solid #4caf50', borderRadius: '8px', display: 'block' }} />
      </div>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 8px', background: '#162e16', borderTop: '2px solid #4caf50', flexShrink: 0 }}>
        <div id="fm-rozetler" style={{ fontSize: '14px', letterSpacing: '2px', flex: 1, textAlign: 'left', overflow: 'hidden' }} />
        <button id="fm-lazer-btn" onClick={() => callbacks.current.lazerAt?.()} style={{ fontSize: '16px', padding: '5px 14px', border: '2px solid #555', background: '#333', color: 'white', borderRadius: '10px', cursor: 'pointer', opacity: 0.3, pointerEvents: 'none', transition: '0.2s', flexShrink: 0 }}>🔫 Lazer</button>
        <div style={{ fontSize: '9px', color: '#555', flexShrink: 0, marginLeft: '6px' }}>⬆️⬇️⬅️➡️ | 📱kaydır</div>
      </div>

      <div ref={settingsPanelRef} style={{ position: 'fixed', top: 0, right: 0, width: '250px', height: '100vh', background: '#162e16', borderLeft: '3px solid #4caf50', padding: '12px', zIndex: 400, display: 'none', flexDirection: 'column', gap: '9px', overflowY: 'auto' }}>
        <h3 style={{ color: '#4caf50', fontSize: '17px' }}>⚙️ Ayarlar</h3>
        <div style={{ background: '#1a2e1a', borderRadius: '9px', padding: '8px' }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>⚡ Hız</label>
          <select onChange={e => callbacks.current.hizSec?.(e.target.value)} defaultValue="180" style={{ width: '100%', background: '#162e16', color: 'white', border: '1px solid #4caf50', borderRadius: '7px', padding: '5px', fontSize: '13px' }}>
            <option value="250">🐢 Yavaş</option>
            <option value="180">⚖️ Normal</option>
            <option value="120">🐇 Hızlı</option>
            <option value="80">⚡ Çılgın</option>
          </select>
        </div>
        <div style={{ background: '#1a2e1a', borderRadius: '9px', padding: '8px' }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}>🎨 Tema</label>
          <select onChange={e => callbacks.current.temaSec?.(e.target.value)} defaultValue="tarim" style={{ width: '100%', background: '#162e16', color: 'white', border: '1px solid #4caf50', borderRadius: '7px', padding: '5px', fontSize: '13px' }}>
            <option value="tarim">🌿 Tarım</option>
            <option value="gece">🌙 Gece</option>
            <option value="sonbahar">🍂 Sonbahar</option>
            <option value="kar">❄️ Kış</option>
          </select>
        </div>
        <button onClick={() => { callbacks.current.ayarlariKaydet?.(); settingsPanelRef.current.style.display = 'none' }} style={{ fontSize: '14px', padding: '8px', border: 'none', borderRadius: '9px', cursor: 'pointer', width: '100%', color: 'white', background: '#4caf50' }}>✅ Kapat</button>
        <button onClick={() => setPhase('start')} style={{ fontSize: '14px', padding: '8px', border: 'none', borderRadius: '9px', cursor: 'pointer', width: '100%', color: 'white', background: '#333', marginTop: '4px' }}>🏠 Ana Sayfa</button>
      </div>

      <div ref={mesajRef} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.96)', borderRadius: '18px', padding: '20px 26px', display: 'none', zIndex: 100, minWidth: '240px', textAlign: 'center', border: '3px solid #e94560' }}>
        <h2 id="fm-mesaj-baslik">💀 Oyun Bitti!</h2>
        <p id="fm-mesaj-puan" style={{ fontSize: '13px', color: '#aaa', margin: '3px 0' }} />
        <p id="fm-mesaj-enyuksek" style={{ fontSize: '13px', color: '#aaa', margin: '3px 0' }} />
        <p id="fm-mesaj-rozet" style={{ fontSize: '13px', color: '#aaa', margin: '3px 0' }} />
        <button onClick={() => callbacks.current.yenidenBasla?.()} style={{ marginTop: '7px', fontSize: '14px', padding: '8px', border: 'none', borderRadius: '9px', cursor: 'pointer', width: '100%', color: 'white', background: '#e94560' }}>🔄 Tekrar</button>
        <button onClick={() => setPhase('start')} style={{ marginTop: '5px', fontSize: '14px', padding: '8px', border: 'none', borderRadius: '9px', cursor: 'pointer', width: '100%', color: 'white', background: '#333' }}>🏠 Ana Sayfa</button>
      </div>

      <div ref={gecisOverlayRef} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.96)', borderRadius: '18px', padding: '20px 26px', display: 'none', zIndex: 100, minWidth: '180px', textAlign: 'center', border: '3px solid #00ffcc' }}>
        <div id="fm-gecis-ikon" style={{ fontSize: '36px' }}>🚪</div>
        <div id="fm-gecis-yazi" style={{ fontSize: '18px', color: '#00ffcc', marginTop: '8px' }}>Geçiş...</div>
      </div>
    </div>
  )
}
