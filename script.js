// KONFIGURASI
const CONFIG = {
  dzulhijjah1445: {
    isSpecial: true,    // Aktifkan jika Dzulhijjah tahun ini khusus
    lastDay: 29         // Tanggal terakhir (29 atau 30)
  },
  jadwalKegiatan: {
    "Legi": "Peningkatan Skill",
    "Pahing": "Khitobah",
    "Pon": "Tahlil",
    "Wage": "Sarasehan",
    "Kliwon": "Berjanji"
  },
  daftarPasaran: ["Pon", "Wage", "Kliwon", "Legi", "Pahing"],
  tanggalPatokan: new Date("2024-01-01") // Senin Legi
};

// VARIABEL GLOBAL
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// INISIALISASI SAAT HALAMAN DIMUAT
document.addEventListener('DOMContentLoaded', function() {
  initCalendar();
  initJadwalSholat();
  initDoaAyat();
  initCountdown();
  initNavButtons();
});

// FUNGSI INISIALISASI
function initCalendar() {
  generateHijriCalendar(currentYear, currentMonth);
}

function initJadwalSholat() {
  fetch('https://api.myquran.com/v2/sholat/jadwal/1429/2025/05/24')
    .then(res => res.json())
    .then(data => {
      const jadwal = data.data.jadwal;
      const html = `
        <div class="nama-sholat">Subuh</div><div class="waktu-sholat">${jadwal.subuh}</div>
        <div class="nama-sholat">Dzuhur</div><div class="waktu-sholat">${jadwal.dzuhur}</div>
        <div class="nama-sholat">Ashar</div><div class="waktu-sholat">${jadwal.ashar}</div>
        <div class="nama-sholat">Maghrib</div><div class="waktu-sholat">${jadwal.maghrib}</div>
        <div class="nama-sholat">Isya</div><div class="waktu-sholat">${jadwal.isya}</div>
      `;
      document.getElementById('sholat-times').innerHTML = html;
    })
    .catch(() => {
      document.getElementById('sholat-times').innerText = 'Gagal memuat jadwal';
    });
}

function initDoaAyat() {
  // Ambil doa harian
  fetch("https://api.myquran.com/v2/doa/acak")
            .then(res => res.json())
            .then(data => {
                if (data.status && data.data) {
                    document.getElementById("doa-title").textContent = data.data.title;
                    document.getElementById("doa-arab").textContent = data.data.arab;
                    document.getElementById("doa-indo").textContent = data.data.indo;
                }
            });

  // Ambil ayat harian
  fetch("https://api.myquran.com/v2/quran/ayat/acak")
    .then(res => res.json())
    .then(data => {
      if (data.status && data.data) {
        const ayat = data.data.ayat;
        const surat = data.data.info.surat;

        document.getElementById("ayat-arab").textContent = ayat.arab;
        document.getElementById("ayat-latin").textContent = ayat.latin;
        document.getElementById("ayat-arti").textContent = ayat.text;
        document.getElementById("ayat-sumber").textContent =
          `QS. ${surat.nama.id} (${surat.nama.ar}) : Ayat ${ayat.ayah}`;
      }
    });
}

function initCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function initNavButtons() {
  document.getElementById('prev-month').addEventListener('click', prevMonth);
  document.getElementById('next-month').addEventListener('click', nextMonth);
}

// FUNGSI UTAMA KALENDER
async function generateHijriCalendar(year, month) {
  const calendarGrid = document.getElementById('calendar-grid');
  showLoading(calendarGrid);
  
  try {
    // Coba endpoint alternatif jika utama gagal
    let data = await tryFetchCalendarData(year, month);
    
    if (!data) {
      // Jika masih gagal, buat kalender offline
      createOfflineCalendar(year, month);
      return;
    }

    renderCalendar(data, year, month);
  } catch (error) {
    console.error("Error:", error);
    createOfflineCalendar(year, month);
  }
}

async function tryFetchCalendarData(year, month) {
  try {
    const dateStr = `${year}-${month + 1}-01`;
    const response = await fetch(`https://api.myquran.com/v2/cal/hijr/monthly?date=${dateStr}`);
    
    if (!response.ok) throw new Error("API not responding");
    
    const data = await response.json();
    return data.status ? data.data : null;
  } catch {
    return null;
  }
}



function createOfflineCalendar(year, month) {
  const calendarGrid = document.getElementById('calendar-grid');
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  // PATOKAN: 25 Mei 2025 = 27 Dzulqa'dah 1446 H
  const referenceDate = new Date(2025, 4, 25); // 25 Mei 2025 (bulan dimulai dari 0)
  const referenceHijri = { day: 27, month: 11, year: 1446 }; // Dzulqa'dah = bulan ke-11
  
  // Daftar bulan Hijriyah dan jumlah hari (30/29)
  const hijriMonths = [
    { name: "Muharram", days: 29 },
    { name: "Shafar", days: 30 },
    { name: "Rabiul Awal", days: 29 },
    { name: "Rabiul Akhir", days: 30 },
    { name: "Jumadil Awal", days: 29 },
    { name: "Jumadil Akhir", days: 30 },
    { name: "Rajab", days: 29 },
    { name: "Sya'ban", days: 30 },
    { name: "Ramadhan", days: 29 },
    { name: "Syawal", days: 30 },
    { name: "Dzulqa'dah", days: 29 },
    { name: "Dzulhijjah", days: CONFIG.dzulhijjah1445.isSpecial ? 29 : 30 }
  ];
  
  // Hitung selisih hari dari tanggal patokan
  const currentDate = new Date(year, month, 1);
  const diffDays = Math.floor((currentDate - referenceDate) / (1000 * 60 * 60 * 24));
  
  // Hitung bulan Hijriyah saat ini
  let hijriDay = referenceHijri.day;
  let hijriMonth = referenceHijri.month - 1; // array dimulai dari 0
  let hijriYear = referenceHijri.year;
  
  // Sesuaikan tanggal berdasarkan selisih hari
  let remainingDays = Math.abs(diffDays);
  const direction = diffDays > 0 ? 1 : -1; // maju/mundur dari patokan
  
  while (remainingDays > 0) {
    const currentMonthDays = hijriMonths[hijriMonth].days;
    
    if (direction > 0) {
      // Maju ke depan
      const daysToAdd = Math.min(remainingDays, currentMonthDays - hijriDay + 1);
      hijriDay += daysToAdd;
      
      if (hijriDay > currentMonthDays) {
        hijriDay = 1;
        hijriMonth++;
        if (hijriMonth >= 12) {
          hijriMonth = 0;
          hijriYear++;
        }
      }
    } else {
      // Mundur ke belakang
      const daysToSubtract = Math.min(remainingDays, hijriDay - 1);
      hijriDay -= daysToSubtract;
      
      if (hijriDay < 1) {
        hijriMonth--;
        if (hijriMonth < 0) {
          hijriMonth = 11;
          hijriYear--;
        }
        hijriDay = hijriMonths[hijriMonth].days;
      }
    }
    
    remainingDays -= Math.min(remainingDays, currentMonthDays);
  }
  
  // Update header
  document.getElementById('current-month').textContent = 
    `${getMonthName(month)} ${year} / ${hijriMonths[hijriMonth].name} ${hijriYear} H`;
  
  // Bersihkan dan buat grid
  calendarGrid.innerHTML = '';
  createDayHeaders();
  
  // Tambahkan sel kosong
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(createEmptyCell());
  }

  // Tambahkan tanggal dengan data offline
  const today = new Date();
  let currentHijriDay = hijriDay;
  let currentHijriMonth = hijriMonth;
  let currentHijriYear = hijriYear;
  
  for (let date = 1; date <= daysInMonth; date++) {
    const currentDate = new Date(year, month, date);
    const pasaran = hitungPasaran(currentDate);
    
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (currentDate.toDateString() === today.toDateString()) {
      cell.classList.add('today');
    }
    
    cell.innerHTML = `
      <div class="tgl-masehi">${date}</div>
      <div class="tgl-hijriyah">${currentHijriDay} ${hijriMonths[currentHijriMonth].name}</div>
      <div class="pasaran">${pasaran}</div>
    `;
    
    calendarGrid.appendChild(cell);
    
    // Update tanggal Hijriyah untuk hari berikutnya
    currentHijriDay++;
    if (currentHijriDay > hijriMonths[currentHijriMonth].days) {
      currentHijriDay = 1;
      currentHijriMonth++;
      if (currentHijriMonth >= 12) {
        currentHijriMonth = 0;
        currentHijriYear++;
      }
    }
  }
  
  addOfflineWarning();
}

function createDayHeaders() {
  const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const calendarGrid = document.getElementById('calendar-grid');
  
  dayNames.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'day-name';
    dayElement.textContent = day;
    calendarGrid.appendChild(dayElement);
  });
}

function createCalendarCells(days) {
  const calendarGrid = document.getElementById('calendar-grid');
  const today = new Date();
  const firstDay = new Date(days[0].date.g).getDay();
  
  // Tambahkan sel kosong
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(createEmptyCell());
  }

  // Tambahkan tanggal
  days.forEach(day => {
    const currentDate = new Date(day.date.g);
    const pasaran = hitungPasaran(currentDate);
    const hijriDate = day.date.h.split(' ');
    
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    if (currentDate.toDateString() === today.toDateString()) {
      cell.classList.add('today');
    }
    
    cell.innerHTML = `
      <div class="tgl-masehi">${currentDate.getDate()}</div>
      <div class="tgl-hijriyah">${hijriDate[0]} ${hijriDate[1]}</div>
      <div class="pasaran">${pasaran}</div>
    `;
    
    calendarGrid.appendChild(cell);
  });
}

// FUNGSI PENUNJANG KALENDER
function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateHijriCalendar(currentYear, currentMonth);
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateHijriCalendar(currentYear, currentMonth);
}

function getMonthName(monthIndex) {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                 "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return months[monthIndex];
}

function createEmptyCell() {
  const cell = document.createElement('div');
  return cell;
}

function showLoading(container) {
  container.innerHTML = '<div class="loading">Memuat kalender Hijriyah...</div>';
}

function showError(container, message) {
  container.innerHTML = `<div class="error">${message}</div>`;
}

// FUNGSI COUNTDOWN
function updateCountdown() {
  const target = cariSabtuMalamDepan();
  const now = new Date();
  const selisih = target - now;

  const waktu = formatCountdown(selisih);
  const { tanggalAcara, kegiatan } = getEventInfo(target);
  
  document.getElementById("countdown-timer").textContent = waktu;
  document.getElementById("next-event-date").textContent = tanggalAcara;
  document.getElementById("next-event-name").textContent = kegiatan;
}

function cariSabtuMalamDepan() {
  const sekarang = new Date();
  const sabtuDepan = new Date(sekarang);
  
  sabtuDepan.setDate(sekarang.getDate() + ((6 - sekarang.getDay() + 7) % 7));
  sabtuDepan.setHours(20, 0, 0, 0);
  
  if (sekarang > sabtuDepan) {
    sabtuDepan.setDate(sabtuDepan.getDate() + 7);
  }
  
  return sabtuDepan;
}

function formatCountdown(selisih) {
  const detik = Math.floor((selisih / 1000) % 60);
  const menit = Math.floor((selisih / 1000 / 60) % 60);
  const jam = Math.floor((selisih / (1000 * 60 * 60)) % 24);
  const hari = Math.floor(selisih / (1000 * 60 * 60 * 24));
  
  return `${hari} hari, ${jam} jam, ${menit} menit, ${detik} detik`;
}

function getEventInfo(targetDate) {
  const pasaran = hitungPasaran(targetDate);
  const kegiatan = CONFIG.jadwalKegiatan[pasaran] || "Kegiatan Rutin";
  
  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const tanggalAcara = targetDate.toLocaleDateString('id-ID', options);
  
  return { tanggalAcara, kegiatan };
}

// FUNGSI PENUNJANG LAIN
function hitungPasaran(tanggal) {
  const selisihHari = Math.floor((tanggal - CONFIG.tanggalPatokan) / (1000 * 60 * 60 * 24));
  const indexPasaran = selisihHari % 5;
  return CONFIG.daftarPasaran[(indexPasaran + 5) % 5];
}

// Fungsi untuk download gambar
function downloadImage(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = url.split('/').pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

