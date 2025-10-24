document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('game-table-body').querySelector('tbody');
  const modal = document.getElementById('edit-modal');
  const closeModal = document.querySelector('.close-button');
  const editForm = document.getElementById('edit-game-form');
  const selectAllCheckbox = document.getElementById('select-all');
  const deleteSelectedButton = document.getElementById('delete-selected');

  // Fungsi untuk menyimpan game ke localStorage
  const saveGames = (games) => {
    localStorage.setItem('games', JSON.stringify(games));
  };

  // Fungsi untuk mengambil game dari localStorage dan memperbaiki data lama
  const getGamesAndFix = () => {
    let games = [];
    try {
      const gamesJSON = localStorage.getItem('games');
      games = gamesJSON ? JSON.parse(gamesJSON) : [];
    } catch (e) {
      console.error("Gagal mem-parsing JSON dari localStorage:", e);
      return [];
    }

    // Cek apakah ada game tanpa ID dan perbaiki
    let needsSave = false;
    games.forEach(game => {
      if (game.id === undefined || game.id === null) {
        game.id = Date.now() + Math.random(); // Beri ID unik
        needsSave = true;
      }
    });

    // Jika ada perbaikan, simpan kembali ke localStorage
    if (needsSave) {
      saveGames(games);
    }

    return games;
  };

  // Fungsi untuk merender (menampilkan) game di tabel
  const renderGames = () => {
    const games = getGamesAndFix(); // Gunakan fungsi yang sudah diperbaiki
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
  const deleteGame = (id) => {
    let games = getGamesAndFix();
    games = games.filter(game => game.id !== id);
    saveGames(games);
    renderGames(); // Render ulang tabel
  };

  // Fungsi untuk membuka modal edit
  const openEditModal = (id) => {
    const games = getGamesAndFix();
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
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('edit-game-id').value);
    const updatedGame = {
      id: id,
      title: document.getElementById('edit-game-title').value,
      price: document.getElementById('edit-game-price').value,
      image: document.getElementById('edit-game-image').value,
      link: '', // Tetap kosong
    };

    let games = getGamesAndFix();
    const gameIndex = games.findIndex(game => game.id === id);
    if (gameIndex > -1) {
      games[gameIndex] = updatedGame;
      saveGames(games);
      renderGames();
      modal.style.display = 'none'; // Tutup modal
      alert('Game berhasil diperbarui!');
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
  deleteSelectedButton.addEventListener('click', () => {
    const selectedIds = Array.from(tableBody.querySelectorAll('.select-game:checked'))
      .map(cb => Number(cb.closest('tr').getAttribute('data-id')));
    
    if (selectedIds.length > 0 && confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} game yang dipilih?`)) {
      let games = getGamesAndFix();
      games = games.filter(game => !selectedIds.includes(game.id));
      saveGames(games);
      renderGames();
      toggleDeleteButton(); // Sembunyikan tombol lagi
    }
  });

  // Panggil renderGames saat halaman dimuat
  renderGames();
});