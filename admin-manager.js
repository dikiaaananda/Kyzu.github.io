document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('game-table-body').querySelector('tbody');
  const modal = document.getElementById('edit-modal');
  const closeModal = document.querySelector('.close-button');
  const editForm = document.getElementById('edit-game-form');
  const selectAllCheckbox = document.getElementById('select-all');
  const deleteSelectedButton = document.getElementById('delete-selected');
  const exportButton = document.getElementById('export-json');
  const syncButton = document.getElementById('sync-json');

  // Fungsi untuk mengambil game dari localStorage.
  // Fungsi ini juga melakukan sinkronisasi awal dari games.json jika localStorage kosong.
  const getGames = async (forceFetch = false) => {
    const localData = localStorage.getItem('games');
    // Jika ada data di local storage dan tidak dipaksa fetch, gunakan itu.
    if (localData && !forceFetch) {
      return JSON.parse(localData);
    }
    // Jika tidak, ambil dari file games.json sebagai data dasar.
    try {
      const response = await fetch(`games.json?t=${new Date().getTime()}`); // Tambahkan cache-busting
      if (!response.ok) throw new Error('Network response was not ok');
      const games = await response.json();
      localStorage.setItem('games', JSON.stringify(games)); // Simpan ke local storage
      return games;
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  };
  const renderGames = async () => {
    const games = await getGames();
    tableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi ulang
    if (games.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada game yang ditambahkan.</td></tr>';
      return;
    }

    games.forEach(game => {
      const row = document.createElement('tr');
      row.setAttribute('data-id', game.id);
      row.innerHTML = `
        <td><input type="checkbox" class="select-game"></td>
        <td><img src="${game.image}" alt="${game.title}" style="width: 100px;"></td>
        <td>${game.title}</td>
        <td>${game.price}</td>
        <td class="actions">
          <button class="btn btn-edit">Edit</button>
          <button class="btn btn-delete">Hapus</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  };

  // Fungsi untuk menghapus game
  const deleteGame = async (id) => { // Tetap async untuk konsistensi
    let games = await getGames();
    games = games.filter(game => game.id !== id);
    localStorage.setItem('games', JSON.stringify(games));
    alert("Game berhasil dihapus dari penyimpanan lokal.");
    renderGames(); // Render ulang tabel
  };

  const openEditModal = async (id) => {
    const games = await getGames();
    const gameToEdit = games.find(game => game.id === id);
    if (gameToEdit) {
      document.getElementById('edit-game-id').value = gameToEdit.id;
      document.getElementById('edit-game-title').value = gameToEdit.title;
      document.getElementById('edit-game-price').value = gameToEdit.price;
      document.getElementById('edit-game-image').value = gameToEdit.image;
      modal.style.display = 'block';
    }
  };

  // Event listener untuk tombol di tabel (edit dan hapus)
  tableBody.addEventListener('click', (e) => {
    const target = e.target;
    const row = target.closest('tr');
    if (!row) return;
    const id = Number(row.getAttribute('data-id'));

    if (target.classList.contains('btn-delete')) {
      if (confirm('Apakah Anda yakin ingin menghapus game ini?')) {
        deleteGame(id);
      }
    } else if (target.classList.contains('btn-edit')) {
      openEditModal(id);
    }
  });

  // Event listener untuk form edit
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('edit-game-id').value);
    const updatedGame = {
      id: id,
      title: document.getElementById('edit-game-title').value,
      price: document.getElementById('edit-game-price').value,
      image: document.getElementById('edit-game-image').value,
      link: '', // Tetap kosong
    };

    let games = await getGames();
    const gameIndex = games.findIndex(game => game.id === id);
    if (gameIndex > -1) {
      games[gameIndex] = updatedGame;
      localStorage.setItem('games', JSON.stringify(games));
      alert("Game berhasil diperbarui di penyimpanan lokal.");
      renderGames();
      modal.style.display = 'none'; // Tutup modal
    }
  });

  // Fungsi untuk menutup modal
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Fungsi untuk checkbox "pilih semua"
  selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = tableBody.querySelectorAll('.select-game');
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked;
    });
    toggleDeleteButton();
  });

  // Fungsi untuk menampilkan/menyembunyikan tombol "Hapus yang Dipilih"
  const toggleDeleteButton = () => {
    const selectedCheckboxes = tableBody.querySelectorAll('.select-game:checked');
    deleteSelectedButton.style.display = selectedCheckboxes.length > 0 ? 'inline-block' : 'none';
  };

  // Event listener untuk checkbox individual
  tableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-game')) {
      toggleDeleteButton();
    }
  });

  // Event listener untuk tombol "Hapus yang Dipilih"
  deleteSelectedButton.addEventListener('click', async () => {
    const selectedIds = Array.from(tableBody.querySelectorAll('.select-game:checked'))
      .map(cb => Number(cb.closest('tr').getAttribute('data-id')));
    
    if (selectedIds.length > 0 && confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} game yang dipilih?`)) {
      let games = await getGames();
      games = games.filter(game => !selectedIds.includes(game.id));
      localStorage.setItem('games', JSON.stringify(games));
      alert(`${selectedIds.length} game berhasil dihapus dari penyimpanan lokal.`);
      renderGames();
      toggleDeleteButton(); // Sembunyikan tombol lagi
    }
  });

  // Event listener untuk tombol Ekspor
  exportButton.addEventListener('click', async () => {
    const games = await getGames();
    const jsonString = JSON.stringify(games, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'games.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('File games.json telah diunduh. Silakan upload file ini ke server Anda untuk mempublikasikan perubahan.');
  });

  // Event listener untuk tombol Sinkronisasi
  syncButton.addEventListener('click', async () => {
    if (confirm('Apakah Anda yakin ingin menyinkronkan data dari server? Semua perubahan lokal yang belum diekspor akan hilang.')) {
      try {
        await getGames(true); // Paksa fetch dari games.json
        await renderGames(); // Render ulang tabel dengan data baru
        alert('Sinkronisasi berhasil! Daftar game telah diperbarui dari server.');
      } catch (error) {
        alert('Gagal melakukan sinkronisasi. Periksa koneksi atau file games.json di server.');
      }
    }
  });

  // Panggil renderGames saat halaman dimuat
  // Ubah logika: Jangan paksa fetch. Biarkan getGames() yang memutuskan.
  // Pindahkan pemanggilan ini ke dalam DOMContentLoaded agar dieksekusi setelah pengecekan login.
  renderGames();

});